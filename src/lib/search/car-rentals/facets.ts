import type { CarRentalResult, Facets } from '~/types/car-rentals/search'

export const buildFacets = (items: CarRentalResult[]): Facets => {
  const categories: Record<string, number> = {}
  const transmissions: Record<string, number> = {}
  const seats: Record<string, number> = {}
  const inclusions: Record<string, number> = {}

  for (const r of items) {
    if (r.category) categories[r.category] = (categories[r.category] || 0) + 1
    if (r.transmission) transmissions[r.transmission] = (transmissions[r.transmission] || 0) + 1
    if (r.seats != null) seats[String(r.seats)] = (seats[String(r.seats)] || 0) + 1
    for (const x of r.inclusions) {
      inclusions[x] = (inclusions[x] || 0) + 1
    }
  }

  const toList = (m: Record<string, number>) =>
    Object.entries(m)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

  return {
    categories: toList(categories).slice(0, 8),
    transmissions: toList(transmissions).slice(0, 8),
    seats: toList(seats).slice(0, 8),
    inclusions: toList(inclusions).slice(0, 10),
  }
}
