import type { Facets, HotelResult } from '~/types/hotels/search'

export const buildFacets = (items: HotelResult[]): Facets => {
  const stars: Record<string, number> = {}
  const neighborhoods: Record<string, number> = {}
  const amenities: Record<string, number> = {}

  for (const h of items) {
    stars[String(h.stars)] = (stars[String(h.stars)] || 0) + 1
    neighborhoods[h.neighborhood] = (neighborhoods[h.neighborhood] || 0) + 1
    for (const a of h.amenities) {
      amenities[a] = (amenities[a] || 0) + 1
    }
  }

  return {
    stars,
    neighborhoods: Object.entries(neighborhoods)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    amenities: Object.entries(amenities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  }
}
