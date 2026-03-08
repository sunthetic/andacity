import { isFlightSortKey, type FlightSortKey } from '~/lib/search/flights/flight-sort-options'
import type { FlightCabinClass, FlightTimeWindow } from '~/types/flights/search'

export type FlightPriceBand = 'under-200' | '200-400' | '400-700' | '700-plus'

export type FlightsSelectedFilters = {
  maxStops: 0 | 1 | 2 | null
  departureWindows: FlightTimeWindow[]
  arrivalWindows: FlightTimeWindow[]
  cabinClass: FlightCabinClass | ''
  priceBand: FlightPriceBand | ''
}

export type FlightSearchFacets = {
  departureWindows: FlightTimeWindow[]
  arrivalWindows: FlightTimeWindow[]
  cabinClasses: FlightCabinClass[]
  maxStops: (0 | 1 | 2)[]
}

export const EMPTY_FLIGHT_SEARCH_FACETS: FlightSearchFacets = {
  departureWindows: [],
  arrivalWindows: [],
  cabinClasses: [],
  maxStops: [],
}

const FLIGHT_WINDOWS: FlightTimeWindow[] = ['morning', 'afternoon', 'evening', 'overnight']
const FLIGHT_CABIN_CLASSES: FlightCabinClass[] = ['economy', 'premium-economy', 'business', 'first']

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
  return FLIGHT_CABIN_CLASSES.includes(value as FlightCabinClass) ? (value as FlightCabinClass) : ''
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

export const normalizeFlightSort = (value: string | null | undefined): FlightSortKey => {
  const token = String(value || '').trim()
  if (isFlightSortKey(token)) return token
  if (token === 'best' || token === 'relevance') return 'recommended'
  if (token === 'price') return 'price-asc'
  if (token === 'earliest-departure' || token === 'departure') return 'departure-asc'
  return 'recommended'
}

export const parseFlightsSelectedFilters = (
  filters: Record<string, unknown>,
): FlightsSelectedFilters => {
  return {
    maxStops: parseMaxStops(filters),
    departureWindows: parseWindows(filters, ['departureWindow', 'departWindow']),
    arrivalWindows: parseWindows(filters, ['arrivalWindow']),
    cabinClass: parseCabinClass(filters),
    priceBand: parsePriceBand(filters),
  }
}

export const toFlightsSearchStateFilters = (
  selected: FlightsSelectedFilters,
  current: Record<string, unknown> = {},
) => {
  const next: Record<string, unknown> = {}

  if (selected.maxStops != null) {
    next.maxStops = selected.maxStops
  }

  if (selected.departureWindows.length) {
    next.departureWindow = selected.departureWindows
  }

  if (selected.arrivalWindows.length) {
    next.arrivalWindow = selected.arrivalWindows
  }

  if (selected.cabinClass) {
    next.cabin = selected.cabinClass
  }

  if (selected.priceBand) {
    next.priceBand = selected.priceBand
  }

  if (current.travelers != null && String(current.travelers).trim()) {
    next.travelers = current.travelers
  }

  return Object.keys(next).length ? next : undefined
}
