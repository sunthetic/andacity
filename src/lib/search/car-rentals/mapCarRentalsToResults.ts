import type { CarRental } from '~/data/car-rentals'
import type { CarRentalResult } from '~/types/car-rentals/search'

export const mapCarRentalsToResults = (rentals: CarRental[], query: string): CarRentalResult[] => {
  const q = String(query || '').toLowerCase()

  return rentals.map((r, i) => {
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
