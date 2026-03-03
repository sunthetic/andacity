import { HOTELS } from '~/data/hotels'
import type { Hotel } from '~/data/hotels'

const normalizeCityKey = (city: string) => String(city || '').trim().toLowerCase()

const tallyTop = (items: string[]) => {
  const m: Record<string, number> = {}
  for (const x of items) {
    const k = String(x || '').trim()
    if (!k) continue
    m[k] = (m[k] || 0) + 1
  }
  return Object.entries(m)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

const slugify = (s: string) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')

const buildHotelCities = (hotels: Hotel[]): HotelCity[] => {
  const byCity: Record<string, Hotel[]> = {}

  for (const h of hotels) {
    const key = normalizeCityKey(h.city)
    byCity[key] = byCity[key] || []
    byCity[key].push(h)
  }

  const cities = Object.entries(byCity).map(([key, hs]) => {
    const sample = hs[0]

    const slugs = hs.map((x) => x.slug).sort()
    const priceFrom = Math.min(...hs.map((x) => x.fromNightly))

    const amenities = tallyTop(hs.flatMap((x) => x.amenities)).slice(0, 10)
    const neighborhoods = tallyTop(hs.map((x) => x.neighborhood)).slice(0, 10)

    return {
      slug: slugify(sample.city),
      city: sample.city,
      region: sample.region,
      country: sample.country,
      query: sample.cityQuery || sample.city.toLowerCase(),
      hotelSlugs: slugs,
      priceFrom,
      topAmenities: amenities,
      topNeighborhoods: neighborhoods,
    } satisfies HotelCity
  })

  return cities.sort((a, b) => a.city.localeCompare(b.city))
}

export const HOTEL_CITIES = buildHotelCities(HOTELS)
export const HOTEL_CITIES_BY_SLUG = Object.fromEntries(HOTEL_CITIES.map((c) => [c.slug, c])) as Record<string, HotelCity>

export const getHotelCityBySlug = (slug: string) => {
  const key = String(slug || '').trim().toLowerCase()
  return HOTEL_CITIES_BY_SLUG[key] || null
}

/* -----------------------------
   Types
----------------------------- */

export type HotelCity = {
  slug: string
  city: string
  region: string
  country: string
  query: string
  hotelSlugs: string[]
  priceFrom: number
  topAmenities: { name: string; count: number }[]
  topNeighborhoods: { name: string; count: number }[]
}
