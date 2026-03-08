import type { FlightCabinClass, FlightResult, FlightTimeWindow } from '~/types/flights/search'
import type { SearchState } from '~/types/search/state'
import { isFlightSortKey } from '~/lib/search/flights/flight-sort-options'
import type { FlightSortKey } from '~/lib/search/flights/flight-sort-options'

type FlightPriceBand = 'under-200' | '200-400' | '400-700' | '700-plus'

type FlightsSelectedFilters = {
  maxStops: 0 | 1 | 2 | null
  departureWindows: FlightTimeWindow[]
  arrivalWindows: FlightTimeWindow[]
  cabinClass: FlightCabinClass | ''
  priceBand: FlightPriceBand | ''
}

export type FlightsMappedState = {
  activeSort: FlightSortKey
  selectedFilters: FlightsSelectedFilters
  items: FlightResult[]
}

const FLIGHT_WINDOWS: FlightTimeWindow[] = ['morning', 'afternoon', 'evening', 'overnight']

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

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

const parseMaxStops = (filters: Record<string, unknown>): 0 | 1 | 2 | null => {
  if (filters.nonstop === true || String(filters.nonstop || '') === '1') return 0

  const fromMaxStops = Number.parseInt(String(filters.maxStops || ''), 10)
  if (Number.isFinite(fromMaxStops) && (fromMaxStops === 0 || fromMaxStops === 1 || fromMaxStops === 2)) {
    return fromMaxStops
  }

  const selectedStops = toStringArray(filters.stops).map(normalizeToken)
  if (!selectedStops.length) return null
  if (selectedStops.includes('0') || selectedStops.includes('nonstop')) return 0
  if (selectedStops.includes('1') || selectedStops.includes('1-stop') || selectedStops.includes('one-stop')) return 1
  if (selectedStops.includes('2plus') || selectedStops.includes('2-plus') || selectedStops.includes('2')) return 2
  return null
}

const parseWindows = (filters: Record<string, unknown>, keys: string[]): FlightTimeWindow[] => {
  const tokens = keys
    .flatMap((key) => toStringArray(filters[key]))
    .map(normalizeToken)

  return Array.from(
    new Set(tokens.filter((token): token is FlightTimeWindow => FLIGHT_WINDOWS.includes(token as FlightTimeWindow))),
  )
}

const parseCabinClass = (filters: Record<string, unknown>): FlightCabinClass | '' => {
  const value = normalizeToken(String(filters.cabin || filters.cabinClass || ''))
  if (value === 'economy' || value === 'premium-economy' || value === 'business' || value === 'first') {
    return value
  }
  return ''
}

const parsePriceBand = (filters: Record<string, unknown>): FlightPriceBand | '' => {
  const direct = normalizeToken(String(filters.priceBand || filters.price || ''))
  if (direct === 'under-200' || direct === '200-400' || direct === '400-700' || direct === '700-plus') {
    return direct
  }

  const fromPriceRange = normalizeToken(String(toStringArray(filters.priceRange)[0] || ''))
  if (
    fromPriceRange === 'under-200' ||
    fromPriceRange === '200-400' ||
    fromPriceRange === '400-700' ||
    fromPriceRange === '700-plus'
  ) {
    return fromPriceRange
  }

  return ''
}

const inPriceBand = (price: number, band: FlightPriceBand) => {
  if (band === 'under-200') return price < 200
  if (band === '200-400') return price >= 200 && price <= 400
  if (band === '400-700') return price > 400 && price <= 700
  if (band === '700-plus') return price > 700
  return true
}

const flightDurationMinutes = (flight: FlightResult) => {
  const diff = flight.arrivalMinutes - flight.departureMinutes
  return diff >= 0 ? diff : diff + 24 * 60
}

const sortItems = (items: FlightResult[], activeSort: FlightSortKey) => {
  return [...items].sort((a, b) => {
    if (activeSort === 'price-asc') return a.price - b.price
    if (activeSort === 'price-desc') return b.price - a.price
    if (activeSort === 'duration') {
      const durationCompare = flightDurationMinutes(a) - flightDurationMinutes(b)
      if (durationCompare !== 0) return durationCompare
      return a.price - b.price
    }

    if (activeSort === 'departure-asc') {
      const departureCompare = a.departureMinutes - b.departureMinutes
      if (departureCompare !== 0) return departureCompare
      return a.price - b.price
    }

    const stopsCompare = a.stops - b.stops
    if (stopsCompare !== 0) return stopsCompare

    const durationCompare = flightDurationMinutes(a) - flightDurationMinutes(b)
    if (durationCompare !== 0) return durationCompare

    return a.price - b.price
  })
}

const toSortKey = (value: string): FlightSortKey => {
  if (isFlightSortKey(value)) return value
  if (value === 'best' || value === 'relevance') return 'recommended'
  if (value === 'price') return 'price-asc'
  if (value === 'earliest-departure' || value === 'departure') return 'departure-asc'
  return 'recommended'
}

export const mapSearchStateToFlights = (
  results: FlightResult[],
  searchState: SearchState,
): FlightsMappedState => {
  const rawFilters = searchState.filters || {}
  const selectedFilters: FlightsSelectedFilters = {
    maxStops: parseMaxStops(rawFilters),
    departureWindows: parseWindows(rawFilters, ['departureWindow', 'departWindow']),
    arrivalWindows: parseWindows(rawFilters, ['arrivalWindow']),
    cabinClass: parseCabinClass(rawFilters),
    priceBand: parsePriceBand(rawFilters),
  }

  const filtered = results.filter((flight) => {
    if (selectedFilters.maxStops != null && flight.stops > selectedFilters.maxStops) {
      return false
    }

    if (
      selectedFilters.departureWindows.length &&
      !selectedFilters.departureWindows.includes(flight.departureWindow)
    ) {
      return false
    }

    if (selectedFilters.arrivalWindows.length && !selectedFilters.arrivalWindows.includes(flight.arrivalWindow)) {
      return false
    }

    if (selectedFilters.cabinClass) {
      const cabin = normalizeToken(String(flight.cabinClass || ''))
      if (cabin !== selectedFilters.cabinClass) return false
    }

    if (selectedFilters.priceBand && !inPriceBand(flight.price, selectedFilters.priceBand)) {
      return false
    }

    return true
  })

  const activeSort = toSortKey(String(searchState.sort || '').trim())

  return {
    activeSort,
    selectedFilters,
    items: sortItems(filtered, activeSort),
  }
}
