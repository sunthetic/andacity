import { searchHotels } from '~/lib/repos/hotels-repo.server'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { HotelResult } from '~/types/hotels/search'

const normalizeToken = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()

export type LoadHotelResultsInput = {
  query: string
  checkIn?: string | null
  checkOut?: string | null
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

export async function loadHotelResultsFromDb(
  input: LoadHotelResultsInput,
): Promise<HotelResult[]> {
  const city = findTopTravelCity(input.query)
  if (!city) return []

  const rows = await searchHotels({
    citySlug: city.slug,
    checkIn: input.checkIn || undefined,
    checkOut: input.checkOut || undefined,
    limit: 500,
    offset: 0,
  })

  const q = normalizeToken(input.query)

  return rows.map((row, index) => {
    const rating = Number(row.rating)
    const priceFrom = toPriceAmount(row.fromNightlyCents)
    const score =
      rating * 0.55 +
      row.stars * 0.18 +
      (row.freeCancellation ? 0.25 : 0) +
      (Math.max(0, 240 - priceFrom) / 240) * 0.4

    return {
      id: `hotel-${row.slug}-${index}`,
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
  })
}
