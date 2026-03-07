export const CAR_RENTAL_CITIES: CarRentalCity[] = [
  { slug: 'las-vegas', name: 'Las Vegas', region: 'NV', country: 'US' },
  { slug: 'orlando', name: 'Orlando', region: 'FL', country: 'US' },
  { slug: 'new-york-city', name: 'New York', region: 'NY', country: 'US' },
]

export const CAR_RENTAL_CITIES_BY_SLUG = Object.fromEntries(
  CAR_RENTAL_CITIES.map((c) => [c.slug, c]),
) as Record<string, CarRentalCity>

export const getCarRentalCityBySlug = (slug: string) => {
  const key = String(slug || '').trim().toLowerCase()
  return CAR_RENTAL_CITIES_BY_SLUG[key] || null
}

/* -----------------------------
   Types
----------------------------- */

export type CarRentalCity = {
  slug: string
  name: string
  region: string
  country: string
}
