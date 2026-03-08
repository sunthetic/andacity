import { searchHotels, type HotelPriceRange, type HotelSort } from '~/lib/repos/hotels-repo.server'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { HotelResult } from '~/types/hotels/search'

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()

const normalizeOptions = (value: string[] | null | undefined) =>
  Array.from(
    new Set(
      (value || [])
        .map((entry) => String(entry || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  )

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const toSort = (value: string | null | undefined): HotelSort => {
  if (value === 'price-desc') return 'price-desc'
  if (value === 'price' || value === 'price-asc') return 'price-asc'
  if (value === 'rating' || value === 'rating-desc') return 'rating-desc'
  return 'recommended'
}

const toPriceRanges = (value: string[] | null | undefined): HotelPriceRange[] => {
  const allowed: HotelPriceRange[] = ['under-150', '150-300', '300-500', '500-plus']
  const selected = normalizeOptions(value)
  return selected.filter((entry): entry is HotelPriceRange => allowed.includes(entry as HotelPriceRange))
}

const toStarRatings = (value: string[] | null | undefined) =>
  normalizeOptions(value)
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry) && entry >= 1 && entry <= 5)

const toGuestRatingMin = (value: string[] | null | undefined) => {
  const scores = normalizeOptions(value)
    .map((entry) => Number.parseFloat(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0)

  if (!scores.length) return undefined
  return Math.min(...scores) / 2
}

export type LoadHotelResultsInput = {
  query: string
  checkIn?: string | null
  checkOut?: string | null
  sort?: string | null
  page?: number
  pageSize?: number
  filters?: {
    priceRange?: string[] | null
    starRating?: string[] | null
    guestRating?: string[] | null
    amenities?: string[] | null
  }
}

export type LoadHotelResultsOutput = {
  matchedCity: {
    slug: string
    name: string
  } | null
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  results: HotelResult[]
}

export async function loadHotelResultsFromDb(
  input: LoadHotelResultsInput,
): Promise<LoadHotelResultsOutput> {
  const city = findTopTravelCity(input.query)
  const pageSize = Math.max(1, Math.min(60, Number(input.pageSize || 24)))
  const requestedPage = Math.max(1, Number(input.page || 1))
  const offset = (requestedPage - 1) * pageSize

  if (!city) {
    return {
      matchedCity: null,
      totalCount: 0,
      page: requestedPage,
      pageSize,
      totalPages: 1,
      results: [],
    }
  }

  const sort = toSort(input.sort)
  const amenities = normalizeOptions(input.filters?.amenities)
  const stars = toStarRatings(input.filters?.starRating)
  const priceRanges = toPriceRanges(input.filters?.priceRange)
  const ratingMin = toGuestRatingMin(input.filters?.guestRating)

  const firstPageResult = await searchHotels({
    citySlug: city.slug,
    checkIn: input.checkIn || undefined,
    checkOut: input.checkOut || undefined,
    sort,
    limit: pageSize,
    offset,
    amenities,
    stars,
    priceRanges,
    ratingMin,
  })

  let rows = firstPageResult.rows
  const totalCount = firstPageResult.totalCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const effectiveOffset = (page - 1) * pageSize
  if (totalCount > 0 && page !== requestedPage) {
    const rerun = await searchHotels({
      citySlug: city.slug,
      checkIn: input.checkIn || undefined,
      checkOut: input.checkOut || undefined,
      sort,
      limit: pageSize,
      offset: effectiveOffset,
      amenities,
      stars,
      priceRanges,
      ratingMin,
    })
    rows = rerun.rows
  }

  const q = normalizeToken(input.query)

  return {
    matchedCity: {
      slug: city.slug,
      name: city.name,
    },
    totalCount,
    page,
    pageSize,
    totalPages,
    results: rows.map((row, index) => {
      const rating = Number(row.rating)
      const priceFrom = toPriceAmount(row.fromNightlyCents)
      const score =
        rating * 0.55 +
        row.stars * 0.18 +
        (row.freeCancellation ? 0.25 : 0) +
        (Math.max(0, 240 - priceFrom) / 240) * 0.4

      return {
        id: `hotel-${row.slug}-${effectiveOffset + index}`,
        inventoryId: row.id,
        slug: row.slug,
        name: row.name,
        neighborhood: row.neighborhood,
        stars: row.stars as HotelResult['stars'],
        rating,
        reviewCount: row.reviewCount,
        priceFrom,
        currency: row.currencyCode,
        refundable: row.freeCancellation,
        amenities: row.amenities,
        image: row.imageUrl || '/img/demo/hotel-1.jpg',
        badges: [
          row.stars >= 4 ? 'Top rated' : 'Best value',
          row.payLater ? 'Pay later' : 'Deal',
          q && row.citySlug.includes(q) ? 'Great match' : 'Popular',
        ].slice(0, 3),
        score,
      }
    }),
  }
}
