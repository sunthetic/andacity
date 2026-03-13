import { normalizeDatePart } from '~/lib/inventory/inventory-id'
import type { HotelPriceRange, HotelSort } from '~/lib/repos/hotels-repo.server'
import type { SearchParams } from '~/types/search'
import { findTopTravelCity } from '~/seed/cities/top-100.js'

export type HotelProviderSearchRequest = {
  citySlug: string
  cityName: string | null
  checkInDate: string
  checkOutDate: string
  occupancy: number
  rooms: number
  sort: HotelSort
  filters: {
    priceRanges: HotelPriceRange[]
    starRatings: number[]
    guestRatingMin: number | null
    amenities: string[]
    refundableOnly: boolean
  }
}

export class HotelSearchParamsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HotelSearchParamsError'
  }
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const clampCount = (value: unknown, fallback: number, max: number) => {
  const parsed = toInteger(value)
  if (parsed == null) return fallback
  return Math.max(1, Math.min(max, parsed))
}

const normalizeTokenList = (value: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [value])
        .flatMap((entry) => String(entry ?? '').split(','))
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  )

const toGuestRatingMin = (value: unknown) => {
  const scores = normalizeTokenList(value)
    .map((entry) => Number.parseFloat(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0)

  if (!scores.length) return null
  return Math.min(...scores) / 2
}

const toStarRatings = (value: unknown) =>
  normalizeTokenList(value)
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry) && entry >= 1 && entry <= 5)
    .sort((left, right) => left - right)

const toPriceRanges = (value: unknown): HotelPriceRange[] => {
  const allowed: HotelPriceRange[] = ['under-150', '150-300', '300-500', '500-plus']
  return normalizeTokenList(value).filter((entry): entry is HotelPriceRange =>
    allowed.includes(entry as HotelPriceRange),
  )
}

const toSort = (value: unknown): HotelSort => {
  const token = toNullableText(value)?.toLowerCase()
  if (token === 'price-asc') return 'price-asc'
  if (token === 'rating-desc') return 'rating-desc'
  if (token === 'value') return 'value'
  return 'recommended'
}

const resolveCity = (value: unknown) => {
  const destination = toNullableText(value)
  if (!destination) {
    throw new HotelSearchParamsError('destination is required for hotel provider search.')
  }

  const city = findTopTravelCity(destination)
  if (!city) {
    throw new HotelSearchParamsError(
      `destination "${destination}" could not be mapped to a supported hotel city.`,
    )
  }

  return {
    citySlug: city.slug,
    cityName: city.name,
  }
}

const resolveDate = (value: unknown, fieldName: string) => {
  const text = toNullableText(value)
  if (!text) {
    throw new HotelSearchParamsError(`${fieldName} is required for hotel provider search.`)
  }

  try {
    return normalizeDatePart(text, fieldName)
  } catch {
    throw new HotelSearchParamsError(`${fieldName} must be a valid ISO date.`)
  }
}

const resolveOccupancy = (params: SearchParams) => {
  const adults = toInteger(params.adults)
  const children = Math.max(0, toInteger(params.children) ?? 0)
  const modeledGuestCount =
    adults != null || children > 0 ? Math.max(1, (adults ?? 0) + children) : null

  return clampCount(params.occupancy ?? modeledGuestCount ?? params.passengers, 2, 12)
}

export const mapHotelSearchParams = (
  params: SearchParams,
): HotelProviderSearchRequest => {
  if (params.vertical !== 'hotel') {
    throw new HotelSearchParamsError(
      `Hotel provider cannot search the "${params.vertical}" vertical.`,
    )
  }

  const { citySlug, cityName } = resolveCity(params.destination || params.origin)
  const checkInDate = resolveDate(params.checkInDate || params.departDate, 'checkInDate')
  const checkOutDate = resolveDate(params.checkOutDate || params.returnDate, 'checkOutDate')
  if (checkOutDate <= checkInDate) {
    throw new HotelSearchParamsError(
      'Hotel provider search requires checkOutDate to be after checkInDate.',
    )
  }

  const rooms = clampCount(params.rooms, 1, 8)
  if (rooms !== 1) {
    throw new HotelSearchParamsError(
      'Hotel provider search currently supports single-room inventory only.',
    )
  }

  return {
    citySlug,
    cityName,
    checkInDate,
    checkOutDate,
    occupancy: resolveOccupancy(params),
    rooms,
    sort: toSort(params.filters?.sort ?? null),
    filters: {
      priceRanges: toPriceRanges(params.filters?.priceRange),
      starRatings: toStarRatings(params.filters?.starRating),
      guestRatingMin: toGuestRatingMin(params.filters?.guestRating),
      amenities: normalizeTokenList(params.filters?.amenities),
      refundableOnly: params.filters?.refundableOnly === true,
    },
  }
}
