import type { Hotel } from '~/data/hotels'
import type { HotelResult } from '~/types/hotels/search'

const parseIsoDate = (value: string | null | undefined) => {
  const raw = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const date = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const staysWithinAvailability = (hotel: Hotel, checkIn: string | null | undefined, checkOut: string | null | undefined) => {
  const availability = hotel.availability
  if (!availability) return true

  const start = parseIsoDate(checkIn)
  const end = parseIsoDate(checkOut)
  if (!start || !end) return true

  const availableFrom = parseIsoDate(availability.checkInStart)
  const availableUntil = parseIsoDate(availability.checkInEnd)
  if (!availableFrom || !availableUntil) return true

  if (start < availableFrom || start > availableUntil) return false

  const nights = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000))
  if (nights < availability.minNights || nights > availability.maxNights) return false

  const blocked = availability.blockedWeekdays || []
  if (blocked.includes(start.getUTCDay())) return false

  return true
}

const matchesHotelQuery = (hotel: Hotel, query: string) => {
  const q = String(query || '').trim().toLowerCase()
  if (!q || q === 'anywhere') return true

  const haystack = [
    hotel.cityQuery,
    hotel.city,
    hotel.name,
    hotel.neighborhood,
    hotel.region,
    hotel.country,
    hotel.propertyType || '',
  ]
    .join(' ')
    .toLowerCase()

  const normalize = (value: string) => value.replaceAll(/[^a-z0-9]+/g, ' ').trim()
  const normalizedHaystack = normalize(haystack)
  const normalizedQuery = normalize(q)

  return haystack.includes(q) || normalizedHaystack.includes(normalizedQuery)
}

export const mapHotelsToResults = (
  hotels: Hotel[],
  query: string,
  options: { checkIn?: string | null; checkOut?: string | null } = {},
): HotelResult[] => {
  const q = String(query || '').toLowerCase()

  return hotels
    .filter((hotel) => matchesHotelQuery(hotel, query))
    .filter((hotel) => staysWithinAvailability(hotel, options.checkIn, options.checkOut))
    .map((h, i) => {
    const score =
      h.rating * 0.55 +
      h.stars * 0.18 +
      (h.policies.freeCancellation ? 0.25 : 0) +
      (Math.max(0, 240 - h.fromNightly) / 240) * 0.4

    return {
      id: `hotel-${h.slug}-${i}`,
      slug: h.slug,
      name: h.name,
      neighborhood: h.neighborhood,
      stars: h.stars,
      rating: h.rating,
      reviewCount: h.reviewCount,
      priceFrom: h.fromNightly,
      currency: h.currency,
      refundable: h.policies.freeCancellation,
      amenities: h.amenities,
      image: h.images[0] || '/img/demo/hotel-1.jpg',
      badges: [
        h.stars >= 4 ? 'Top rated' : 'Best value',
        h.policies.payLater ? 'Pay later' : 'Deal',
        q && h.cityQuery.includes(q) ? 'Great match' : 'Popular',
      ].slice(0, 3),
      score,
    }
  })
}
