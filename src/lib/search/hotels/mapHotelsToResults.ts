import type { Hotel } from '~/data/hotels'
import type { HotelResult } from '~/types/hotels/search'

export const mapHotelsToResults = (hotels: Hotel[], query: string): HotelResult[] => {
  const q = String(query || '').toLowerCase()

  return hotels.map((h, i) => {
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
