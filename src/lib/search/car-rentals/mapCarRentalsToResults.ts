import type { CarRental } from '~/data/car-rentals'
import type { CarRentalResult } from '~/types/car-rentals/search'

const parseIsoDate = (value: string | null | undefined) => {
  const raw = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const date = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const rentalWithinAvailability = (rental: CarRental, pickupDate: string | null | undefined, dropoffDate: string | null | undefined) => {
  const availability = rental.availability
  if (!availability) return true

  const pickup = parseIsoDate(pickupDate)
  const dropoff = parseIsoDate(dropoffDate)
  if (!pickup || !dropoff) return true

  const availableFrom = parseIsoDate(availability.pickupStart)
  const availableUntil = parseIsoDate(availability.pickupEnd)
  if (!availableFrom || !availableUntil) return true

  if (pickup < availableFrom || pickup > availableUntil) return false

  const days = Math.max(0, Math.floor((dropoff.getTime() - pickup.getTime()) / 86400000))
  if (days < availability.minDays || days > availability.maxDays) return false

  const blocked = availability.blockedWeekdays || []
  if (blocked.includes(pickup.getUTCDay())) return false

  return true
}

const matchesRentalQuery = (rental: CarRental, query: string) => {
  const q = String(query || '').trim().toLowerCase()
  if (!q || q === 'anywhere') return true

  const haystack = [rental.cityQuery, rental.city, rental.name, rental.pickupArea, rental.region, rental.country]
    .join(' ')
    .toLowerCase()

  const normalize = (value: string) => value.replaceAll(/[^a-z0-9]+/g, ' ').trim()
  const normalizedHaystack = normalize(haystack)
  const normalizedQuery = normalize(q)
  return haystack.includes(q) || normalizedHaystack.includes(normalizedQuery)
}

export const mapCarRentalsToResults = (
  rentals: CarRental[],
  query: string,
  options: { pickupDate?: string | null; dropoffDate?: string | null } = {},
): CarRentalResult[] => {
  const q = String(query || '').toLowerCase()

  return rentals
    .filter((rental) => matchesRentalQuery(rental, query))
    .filter((rental) => rentalWithinAvailability(rental, options.pickupDate, options.dropoffDate))
    .map((r, i) => {
    const offer = r.offers[0] || null
    const pickupType = r.pickupArea.toLowerCase().includes('airport') ? 'airport' : 'city'

    const score =
      r.rating * 0.6 +
      (r.policies.freeCancellation ? 0.25 : 0) +
      (r.policies.payAtCounter ? 0.18 : 0) +
      (Math.max(0, 120 - r.fromDaily) / 120) * 0.35

    return {
      id: `car-${r.slug}-${i}`,
      slug: r.slug,
      name: r.name,
      city: r.city,
      pickupArea: r.pickupArea,

      vehicleName: offer?.name || null,
      category: offer?.category || null,
      transmission: offer?.transmission || null,
      seats: offer?.seats ?? null,
      bags: offer?.bags || null,
      pickupType,

      rating: r.rating,
      reviewCount: r.reviewCount,
      priceFrom: r.fromDaily,
      currency: r.currency,

      freeCancellation: r.policies.freeCancellation,
      payAtCounter: r.policies.payAtCounter,

      inclusions: r.inclusions.slice(0, 8),
      image: r.images[0] || '/img/demo/car-1.jpg',

      badges: [
        r.policies.freeCancellation ? 'Free cancellation' : 'Flexible',
        r.policies.payAtCounter ? 'Pay at counter' : 'Deal',
        q && r.cityQuery.includes(q) ? 'Great match' : 'Popular',
      ].slice(0, 3),

      score,
    }
  })
}
