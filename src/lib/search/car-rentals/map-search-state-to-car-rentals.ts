import type { CarRentalResult } from '~/types/car-rentals/search'
import type { SearchState } from '~/types/search/state'
import {
  normalizeCarRentalsSortValue,
  type CarRentalsSortKey,
} from '~/lib/search/car-rentals/car-sort-options'

type CarRentalsPriceBand = 'under-50' | '50-100' | '100-150' | '150-plus'

type CarRentalsPickupType = 'airport' | 'city'

type CarRentalsSelectedFilters = {
  vehicleClasses: string[]
  pickupType: CarRentalsPickupType | ''
  transmission: 'automatic' | 'manual' | ''
  seatsMin: number | null
  priceBand: CarRentalsPriceBand | ''
}

export type CarRentalsMappedState = {
  activeSort: CarRentalsSortKey
  selectedFilters: CarRentalsSelectedFilters
  items: CarRentalResult[]
}

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

const toPickupType = (result: CarRentalResult): CarRentalsPickupType => {
  if (result.pickupType === 'airport' || result.pickupType === 'city') return result.pickupType
  return result.pickupArea.toLowerCase().includes('airport') ? 'airport' : 'city'
}

const inPriceBand = (priceFrom: number, band: CarRentalsPriceBand) => {
  if (band === 'under-50') return priceFrom < 50
  if (band === '50-100') return priceFrom >= 50 && priceFrom <= 100
  if (band === '100-150') return priceFrom > 100 && priceFrom <= 150
  if (band === '150-plus') return priceFrom > 150
  return true
}

const parsePriceBand = (filters: Record<string, unknown>): CarRentalsPriceBand | '' => {
  const fromPriceBand = normalizeToken(String(filters.priceBand || ''))
  if (fromPriceBand === 'under-50' || fromPriceBand === '50-100' || fromPriceBand === '100-150' || fromPriceBand === '150-plus') {
    return fromPriceBand
  }

  const fromPrice = normalizeToken(String(filters.price || ''))
  if (fromPrice === 'under-50' || fromPrice === '50-100' || fromPrice === '100-150' || fromPrice === '150-plus') {
    return fromPrice
  }

  const fromPriceRange = toStringArray(filters.priceRange)[0]
  const normalizedRange = normalizeToken(String(fromPriceRange || ''))
  if (normalizedRange === 'under-50' || normalizedRange === '50-100' || normalizedRange === '100-150' || normalizedRange === '150-plus') {
    return normalizedRange
  }

  return ''
}

const parseTransmission = (filters: Record<string, unknown>): 'automatic' | 'manual' | '' => {
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
  return Number.isFinite(n) ? n : null
}

const parseVehicleClasses = (filters: Record<string, unknown>) => {
  const values = [
    ...toStringArray(filters.class),
    ...toStringArray(filters.vehicleClass),
  ]

  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)))
}

const pickupConvenienceRank = (result: CarRentalResult) => {
  return toPickupType(result) === 'city' ? 2 : 1
}

const sortItems = (items: CarRentalResult[], activeSort: CarRentalsSortKey) => {
  return [...items].sort((a, b) => {
    if (activeSort === 'price-asc') return a.priceFrom - b.priceFrom

    if (activeSort === 'value') {
      const valueCompare =
        (b.score / Math.max(b.priceFrom, 1)) - (a.score / Math.max(a.priceFrom, 1))
      if (valueCompare !== 0) return valueCompare
      return b.score - a.score
    }

    if (activeSort === 'rating-desc') {
      if (b.rating !== a.rating) return b.rating - a.rating
      return a.priceFrom - b.priceFrom
    }

    if (activeSort === 'pickup-convenience') {
      const pickupCompare = pickupConvenienceRank(b) - pickupConvenienceRank(a)
      if (pickupCompare !== 0) return pickupCompare
      if (a.priceFrom !== b.priceFrom) return a.priceFrom - b.priceFrom
      return b.score - a.score
    }

    return b.score - a.score
  })
}

export const mapSearchStateToCarRentals = (
  results: CarRentalResult[],
  searchState: SearchState,
): CarRentalsMappedState => {
  const rawFilters = searchState.filters || {}
  const selectedFilters: CarRentalsSelectedFilters = {
    vehicleClasses: parseVehicleClasses(rawFilters),
    pickupType: parsePickupType(rawFilters),
    transmission: parseTransmission(rawFilters),
    seatsMin: parseSeatsMin(rawFilters),
    priceBand: parsePriceBand(rawFilters),
  }

  const filtered = results.filter((result) => {
    const category = normalizeToken(result.category || '')
    if (selectedFilters.vehicleClasses.length && !selectedFilters.vehicleClasses.includes(category)) {
      return false
    }

    if (selectedFilters.pickupType && toPickupType(result) !== selectedFilters.pickupType) {
      return false
    }

    if (selectedFilters.transmission) {
      const transmission = normalizeToken(result.transmission || '')
      if (transmission !== selectedFilters.transmission) return false
    }

    if (selectedFilters.seatsMin != null) {
      if (result.seats == null || result.seats < selectedFilters.seatsMin) return false
    }

    if (selectedFilters.priceBand) {
      if (!inPriceBand(result.priceFrom, selectedFilters.priceBand)) return false
    }

    return true
  })

  const sortCandidate = String(searchState.sort || '').trim()
  const activeSort = normalizeCarRentalsSortValue(sortCandidate)

  return {
    activeSort,
    selectedFilters,
    items: sortItems(filtered, activeSort),
  }
}
