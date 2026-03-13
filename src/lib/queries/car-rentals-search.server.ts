import { buildAvailabilityConfidence } from '~/lib/inventory/availability-confidence'
import {
  listCarRentalSearchFacets,
  searchCarRentalsPage,
} from '~/lib/repos/car-rentals-repo.server'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import { emitSearchMetrics } from '~/lib/metrics/search-metrics'
import { getCachedResults, setCachedResults } from '~/lib/search/search-cache'
import { buildCarSearchEntity, toBookableEntity } from '~/lib/search/search-entities'
import {
  normalizeCarRentalsSortValue,
  type CarRentalsSortKey,
} from '~/lib/search/car-rentals/car-sort-options'
import type {
  CarRentalsPriceBand,
  CarRentalsPickupType,
  CarRentalsSearchFacets,
  CarRentalsSelectedFilters,
  CarRentalsTransmission,
} from '~/lib/search/car-rentals/filter-types'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { CarRentalResult } from '~/types/car-rentals/search'

const DEFAULT_PAGE_SIZE = 6

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean)
  }

  const single = String(value || '').trim()
  if (!single) return []
  if (single.includes(',')) {
    return single
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  return [single]
}

const titleCase = (value: string) => {
  const lower = normalizeToken(value)
  if (!lower) return ''
  return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toScore = (input: {
  score: string | null
  rating: number
  priceFrom: number
  freeCancellation: boolean
  payAtCounter: boolean
}) => {
  const raw = Number(input.score)
  if (Number.isFinite(raw)) return raw

  return (
    input.rating * 0.6 +
    (input.freeCancellation ? 0.25 : 0) +
    (input.payAtCounter ? 0.18 : 0) +
    (Math.max(0, 120 - input.priceFrom) / 120) * 0.35
  )
}

const parsePriceBand = (filters: Record<string, unknown>): CarRentalsPriceBand | '' => {
  const fromPriceBand = normalizeToken(String(filters.priceBand || ''))
  if (
    fromPriceBand === 'under-50' ||
    fromPriceBand === '50-100' ||
    fromPriceBand === '100-150' ||
    fromPriceBand === '150-plus'
  ) {
    return fromPriceBand
  }

  const fromPrice = normalizeToken(String(filters.price || ''))
  if (
    fromPrice === 'under-50' ||
    fromPrice === '50-100' ||
    fromPrice === '100-150' ||
    fromPrice === '150-plus'
  ) {
    return fromPrice
  }

  const fromPriceRange = toStringArray(filters.priceRange)[0]
  const normalizedRange = normalizeToken(String(fromPriceRange || ''))
  if (
    normalizedRange === 'under-50' ||
    normalizedRange === '50-100' ||
    normalizedRange === '100-150' ||
    normalizedRange === '150-plus'
  ) {
    return normalizedRange
  }

  return ''
}

const parseTransmission = (filters: Record<string, unknown>): CarRentalsTransmission | '' => {
  const value = normalizeToken(String(filters.transmission || ''))
  if (value === 'automatic' || value === 'manual') return value
  return ''
}

const parsePickupType = (filters: Record<string, unknown>): CarRentalsPickupType | '' => {
  const value = normalizeToken(String(filters.pickup || filters.pickupType || ''))
  if (value === 'airport' || value === 'city') return value
  return ''
}

const parseSeatsMin = (filters: Record<string, unknown>) => {
  const token = String(filters.seats || filters.seatsMin || '').trim()
  if (!token) return null
  const n = Number.parseInt(token, 10)
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

const parseVehicleClasses = (filters: Record<string, unknown>) => {
  const values = [...toStringArray(filters.class), ...toStringArray(filters.vehicleClass)]
  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)))
}

export const normalizeCarRentalsSort = (value: string | null | undefined): CarRentalsSortKey => {
  return normalizeCarRentalsSortValue(value)
}

export const parseCarRentalsSelectedFilters = (
  filters: Record<string, unknown>,
): CarRentalsSelectedFilters => {
  return {
    vehicleClasses: parseVehicleClasses(filters),
    pickupType: parsePickupType(filters),
    transmission: parseTransmission(filters),
    seatsMin: parseSeatsMin(filters),
    priceBand: parsePriceBand(filters),
  }
}

export const toCarRentalsSearchStateFilters = (
  selected: CarRentalsSelectedFilters,
  current: Record<string, unknown> = {},
) => {
  const next: Record<string, unknown> = {}

  if (selected.vehicleClasses.length) {
    next.class = selected.vehicleClasses
  }
  if (selected.pickupType) {
    next.pickup = selected.pickupType
  }
  if (selected.transmission) {
    next.transmission = selected.transmission
  }
  if (selected.seatsMin != null) {
    next.seats = selected.seatsMin
  }
  if (selected.priceBand) {
    next.priceBand = selected.priceBand
  }

  if (current.drivers != null && String(current.drivers).trim()) {
    next.drivers = current.drivers
  }

  return Object.keys(next).length ? next : undefined
}

export const EMPTY_CAR_RENTALS_FACETS: CarRentalsSearchFacets = {
  vehicleClasses: [],
  pickupTypes: [],
  transmissions: [],
  seats: [],
}

export type LoadCarRentalResultsPageInput = {
  citySlug: string
  query?: string | null
  pickupDate?: string | null
  dropoffDate?: string | null
  sort?: string | null
  page?: number
  pageSize?: number
  filters?: Record<string, unknown>
}

export type LoadCarRentalResultsPageOutput = {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  activeSort: CarRentalsSortKey
  selectedFilters: CarRentalsSelectedFilters
  results: CarRentalResult[]
  facets: CarRentalsSearchFacets
}

const buildCarRentalSearchCacheKey = (input: LoadCarRentalResultsPageInput) => {
  const selected = parseCarRentalsSelectedFilters(input.filters || {})
  return [
    'cars',
    input.citySlug,
    input.pickupDate || 'any',
    input.dropoffDate || 'any',
    `sort=${normalizeCarRentalsSort(input.sort)}`,
    `page=${Math.max(1, Number(input.page || 1))}`,
    `size=${Math.max(1, Math.min(60, Number(input.pageSize || DEFAULT_PAGE_SIZE)))}`,
    `class=${selected.vehicleClasses.slice().sort().join(',') || 'any'}`,
    `pickup=${selected.pickupType || 'any'}`,
    `transmission=${selected.transmission || 'any'}`,
    `seats=${selected.seatsMin ?? 'any'}`,
    `price=${selected.priceBand || 'any'}`,
  ].join(':')
}

const toSearchDateTime = (value: string | null | undefined, fallback: string) => {
  const text = String(value || '').trim()
  return text ? `${text}T10:00` : fallback
}

export async function loadCarRentalResultsPageFromDb(
  input: LoadCarRentalResultsPageInput,
): Promise<LoadCarRentalResultsPageOutput> {
  const startedAt = Date.now()
  const pageSize = Math.max(1, Math.min(60, Number(input.pageSize || DEFAULT_PAGE_SIZE)))
  const requestedPage = Math.max(1, Number(input.page || 1))
  const offset = (requestedPage - 1) * pageSize
  const activeSort = normalizeCarRentalsSort(input.sort)
  const selectedFilters = parseCarRentalsSelectedFilters(input.filters || {})
  const searchKey = buildCarRentalSearchCacheKey(input)

  const cached = getCachedResults<LoadCarRentalResultsPageOutput>(searchKey)
  if (cached) {
    emitSearchMetrics({
      vertical: 'car',
      searchKey,
      searchTimeMs: Date.now() - startedAt,
      providerTimeMs: 0,
      cacheHit: true,
      resultsCount: cached.results.length,
    })
    return cached
  }

  const providerStartedAt = Date.now()
  const [firstPageResult, facets] = await Promise.all([
    searchCarRentalsPage({
      citySlug: input.citySlug,
      pickupDate: input.pickupDate || undefined,
      dropoffDate: input.dropoffDate || undefined,
      sort: activeSort,
      limit: pageSize,
      offset,
      filters: {
        vehicleClassKeys: selectedFilters.vehicleClasses,
        pickupType: selectedFilters.pickupType,
        transmission: selectedFilters.transmission,
        seatsMin: selectedFilters.seatsMin,
        priceBand: selectedFilters.priceBand,
      },
    }),
    listCarRentalSearchFacets({
      citySlug: input.citySlug,
      pickupDate: input.pickupDate || undefined,
      dropoffDate: input.dropoffDate || undefined,
    }),
  ])

  let rows = firstPageResult.rows
  const totalCount = firstPageResult.totalCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const effectiveOffset = (page - 1) * pageSize

  if (totalCount > 0 && page !== requestedPage) {
    const rerun = await searchCarRentalsPage({
      citySlug: input.citySlug,
      pickupDate: input.pickupDate || undefined,
      dropoffDate: input.dropoffDate || undefined,
      sort: activeSort,
      limit: pageSize,
      offset: effectiveOffset,
      filters: {
        vehicleClassKeys: selectedFilters.vehicleClasses,
        pickupType: selectedFilters.pickupType,
        transmission: selectedFilters.transmission,
        seatsMin: selectedFilters.seatsMin,
        priceBand: selectedFilters.priceBand,
      },
    })
    rows = rerun.rows
  }

  const q = normalizeToken(String(input.query || input.citySlug || ''))
  const hasExactDates = Boolean(input.pickupDate && input.dropoffDate)
  const providerTimeMs = Date.now() - providerStartedAt
  const snapshotTimestamp = new Date().toISOString()

  const result = {
    totalCount,
    page,
    pageSize,
    totalPages,
    activeSort,
    selectedFilters,
    facets,
    results: rows.map((row, index) => {
      const priceFrom = toPriceAmount(row.fromDailyCents)
      const rating = Number(row.rating)

      const freshness = buildInventoryFreshness({
        checkedAt: row.freshnessTimestamp,
        profile: 'inventory_snapshot',
      })
      const searchEntity = buildCarSearchEntity({
        providerInventoryId: row.id,
        price: priceFrom,
        currency: row.currencyCode,
        provider: row.providerName,
        snapshotTimestamp:
          row.freshnessTimestamp instanceof Date
            ? row.freshnessTimestamp.toISOString()
            : String(row.freshnessTimestamp || snapshotTimestamp),
        providerLocationId: row.id,
        pickupDateTime: toSearchDateTime(input.pickupDate, '1970-01-01T10:00'),
        dropoffDateTime: toSearchDateTime(
          input.dropoffDate,
          input.pickupDate ? `${input.pickupDate}T10:00` : '1970-01-02T10:00',
        ),
        vehicleClass: row.category || row.vehicleName || 'standard',
      })

      return {
        id: `car-${row.slug}-${effectiveOffset + index}`,
        inventoryId: row.id,
        canonicalInventoryId: searchEntity.inventoryId,
        slug: row.slug,
        name: row.providerName,
        city: row.cityName,
        pickupArea: row.pickupArea,
        locationId: row.locationId,
        vehicleName: row.vehicleName,
        category: row.category,
        transmission: row.transmission ? titleCase(row.transmission) : null,
        seats: row.seats,
        bags: row.bagsLabel,
        pickupType: row.pickupType,
        rating,
        reviewCount: row.reviewCount,
        priceFrom,
        currency: row.currencyCode,
        freeCancellation: row.freeCancellation,
        payAtCounter: row.payAtCounter,
        inclusions: (row.inclusions || []).slice(0, 8),
        image: row.imageUrl || '/img/demo/car-1.jpg',
        badges: [
          row.freeCancellation ? 'Free cancellation' : 'Flexible',
          row.payAtCounter ? 'Pay at counter' : 'Deal',
          q && row.citySlug.includes(q) ? 'Great match' : 'Popular',
        ].slice(0, 3),
        score: toScore({
          score: row.score,
          rating,
          priceFrom,
          freeCancellation: row.freeCancellation,
          payAtCounter: row.payAtCounter,
        }),
        availabilityConfidence: buildAvailabilityConfidence({
          freshness,
          match: hasExactDates ? 'exact' : 'unknown',
        }),
        freshness,
        searchEntity,
        bookableEntity: toBookableEntity(searchEntity),
      }
    }),
  }

  setCachedResults(searchKey, result)
  emitSearchMetrics({
    vertical: 'car',
    searchKey,
    searchTimeMs: Date.now() - startedAt,
    providerTimeMs,
    cacheHit: false,
    resultsCount: result.results.length,
  })
  return result
}

export type LoadCarRentalResultsInput = {
  query: string
  pickupDate?: string | null
  dropoffDate?: string | null
}

export async function loadCarRentalResultsFromDb(
  input: LoadCarRentalResultsInput,
): Promise<CarRentalResult[]> {
  const city = findTopTravelCity(input.query)
  if (!city) return []

  const source = await loadCarRentalResultsPageFromDb({
    citySlug: city.slug,
    query: input.query,
    pickupDate: input.pickupDate,
    dropoffDate: input.dropoffDate,
    page: 1,
    pageSize: 600,
    sort: 'recommended',
    filters: {},
  })

  return source.results
}
