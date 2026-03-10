import {
  buildAvailabilityConfidence,
  evaluateFlightAvailabilityContext,
} from '~/lib/inventory/availability-confidence'
import {
  listFlightSearchFacets,
  searchFlightsPage,
  type FlightSort,
} from '~/lib/repos/flights-repo.server'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import {
  EMPTY_FLIGHT_SEARCH_FACETS,
  normalizeFlightSort,
  parseFlightsSelectedFilters,
  toFlightsSearchStateFilters,
  type FlightPriceBand,
  type FlightSearchFacets,
  type FlightsSelectedFilters,
} from '~/lib/search/flights/filter-types'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { FlightResult } from '~/types/flights/search'

const DEFAULT_PAGE_SIZE = 6

const toClock = (totalMinutes: number) => {
  const minutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const toStopsLabel = (stops: number) => {
  if (stops <= 0) return 'Nonstop'
  if (stops === 1) return '1 stop'
  return '2+ stops'
}

const clampStops = (stops: number): 0 | 1 | 2 => {
  if (stops <= 0) return 0
  if (stops === 1) return 1
  return 2
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toPriceBandBounds = (band: FlightPriceBand | '') => {
  if (band === 'under-200') {
    return { minCents: undefined, maxCents: 19999 }
  }

  if (band === '200-400') {
    return { minCents: 20000, maxCents: 40000 }
  }

  if (band === '400-700') {
    return { minCents: 40001, maxCents: 70000 }
  }

  if (band === '700-plus') {
    return { minCents: 70001, maxCents: undefined }
  }

  return { minCents: undefined, maxCents: undefined }
}

const toRepoSort = (sort: ReturnType<typeof normalizeFlightSort>): FlightSort => {
  if (sort === 'price-asc') return 'price-asc'
  if (sort === 'duration') return 'duration'
  if (sort === 'departure-asc') return 'departure-asc'
  return 'recommended'
}

export {
  EMPTY_FLIGHT_SEARCH_FACETS,
  normalizeFlightSort,
  parseFlightsSelectedFilters,
  toFlightsSearchStateFilters,
} from '~/lib/search/flights/filter-types'
export type { FlightSearchFacets, FlightsSelectedFilters } from '~/lib/search/flights/filter-types'

export type LoadFlightResultsPageInput = {
  fromLocationSlug: string
  toLocationSlug: string
  itineraryType: 'one-way' | 'round-trip'
  departDate?: string | null
  sort?: string | null
  page?: number
  pageSize?: number
  filters?: Record<string, unknown>
}

export type LoadFlightResultsPageOutput = {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  activeSort: ReturnType<typeof normalizeFlightSort>
  selectedFilters: FlightsSelectedFilters
  facets: FlightSearchFacets
  results: FlightResult[]
}

export async function loadFlightResultsPageFromDb(
  input: LoadFlightResultsPageInput,
): Promise<LoadFlightResultsPageOutput> {
  const pageSize = Math.max(1, Math.min(60, Number(input.pageSize || DEFAULT_PAGE_SIZE)))
  const requestedPage = Math.max(1, Number(input.page || 1))
  const offset = (requestedPage - 1) * pageSize
  const activeSort = normalizeFlightSort(input.sort)
  const selectedFilters = parseFlightsSelectedFilters(input.filters || {})
  const priceBand = toPriceBandBounds(selectedFilters.priceBand)
  const fromCity = findTopTravelCity(input.fromLocationSlug)
  const toCity = findTopTravelCity(input.toLocationSlug)

  if (!fromCity || !toCity) {
    return {
      totalCount: 0,
      page: requestedPage,
      pageSize,
      totalPages: 1,
      activeSort,
      selectedFilters,
      facets: EMPTY_FLIGHT_SEARCH_FACETS,
      results: [],
    }
  }

  const originIata = fromCity.airportCodes[0]
  const destinationIata = toCity.airportCodes[0]
  if (!originIata || !destinationIata) {
    return {
      totalCount: 0,
      page: requestedPage,
      pageSize,
      totalPages: 1,
      activeSort,
      selectedFilters,
      facets: EMPTY_FLIGHT_SEARCH_FACETS,
      results: [],
    }
  }

  const runSearch = async (serviceDate?: string) => {
    const [pageResult, facets] = await Promise.all([
      searchFlightsPage({
        originIata,
        destinationIata,
        serviceDate,
        itineraryType: input.itineraryType,
        cabinClass: selectedFilters.cabinClass || undefined,
        maxStops: selectedFilters.maxStops == null ? undefined : selectedFilters.maxStops,
        departureWindows: selectedFilters.departureWindows,
        arrivalWindows: selectedFilters.arrivalWindows,
        priceMinCents: priceBand.minCents,
        priceMaxCents: priceBand.maxCents,
        sort: toRepoSort(activeSort),
        limit: pageSize,
        offset,
      }),
      listFlightSearchFacets({
        originIata,
        destinationIata,
        serviceDate,
        itineraryType: input.itineraryType,
      }),
    ])

    return { pageResult, facets }
  }

  let effectiveServiceDate = input.departDate || undefined
  let { pageResult: firstPageResult, facets } = await runSearch(effectiveServiceDate)

  // Seeded datasets can contain route inventory without exact date coverage.
  // If exact date yields no rows, retry at route-level instead of returning empty.
  if (!firstPageResult.totalCount && effectiveServiceDate) {
    effectiveServiceDate = undefined
    const fallback = await runSearch(undefined)
    firstPageResult = fallback.pageResult
    facets = fallback.facets
  }

  let rows = firstPageResult.rows
  const totalCount = firstPageResult.totalCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const effectiveOffset = (page - 1) * pageSize

  if (totalCount > 0 && page !== requestedPage) {
    const rerun = await searchFlightsPage({
      originIata,
      destinationIata,
      serviceDate: effectiveServiceDate,
      itineraryType: input.itineraryType,
      cabinClass: selectedFilters.cabinClass || undefined,
      maxStops: selectedFilters.maxStops == null ? undefined : selectedFilters.maxStops,
      departureWindows: selectedFilters.departureWindows,
      arrivalWindows: selectedFilters.arrivalWindows,
      priceMinCents: priceBand.minCents,
      priceMaxCents: priceBand.maxCents,
      sort: toRepoSort(activeSort),
      limit: pageSize,
      offset: effectiveOffset,
    }),
    rows = rerun.rows
  }

  return {
    totalCount,
    page,
    pageSize,
    totalPages,
    activeSort,
    selectedFilters,
    facets,
    results: rows.map((row, index) => {
      const stops = clampStops(Number(row.stops))
      const freshness = buildInventoryFreshness({
        checkedAt: row.freshnessTimestamp,
        profile: 'inventory_snapshot',
      })
      const flightAssessment = evaluateFlightAvailabilityContext({
        requestedServiceDate: input.departDate || null,
        actualServiceDate: row.serviceDate,
      })

      return {
        id: row.seedKey || `flight-${row.id}-${effectiveOffset + index}`,
        itineraryId: row.id,
        serviceDate: row.serviceDate,
        requestedServiceDate: input.departDate || undefined,
        airline: row.airline,
        origin: `${fromCity.name} (${row.originIata})`,
        destination: `${toCity.name} (${row.destinationIata})`,
        departureTime: toClock(row.departureMinutes),
        arrivalTime: toClock(row.arrivalMinutes),
        departureMinutes: row.departureMinutes,
        arrivalMinutes: row.arrivalMinutes,
        departureWindow: row.departureWindow,
        arrivalWindow: row.arrivalWindow,
        stops,
        stopsLabel: toStopsLabel(stops),
        duration: formatDuration(row.durationMinutes),
        cabinClass: row.cabinClass,
        fareCode: row.fareCode,
        price: toPriceAmount(row.priceCents),
        currency: row.currencyCode,
        refundable: row.refundable,
        changeable: row.changeable,
        checkedBagsIncluded: row.checkedBagsIncluded,
        seatsRemaining: row.seatsRemaining,
        availabilityConfidence: buildAvailabilityConfidence({
          freshness,
          ...flightAssessment,
        }),
        freshness,
      }
    }),
  }
}
