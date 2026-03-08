import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  cities,
  hotelAmenityLinks,
  hotelAmenities,
  hotelAvailabilitySnapshots,
  hotelImages,
  hotels,
} from '~/lib/db/schema'

export type HotelSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc'

export type SearchHotelsInput = {
  citySlug: string
  checkIn?: string
  checkOut?: string
  starsMin?: number
  priceMaxCents?: number
  amenities?: string[]
  sort?: HotelSort
  limit?: number
  offset?: number
}

export type HotelSearchRow = {
  id: number
  slug: string
  name: string
  citySlug: string
  cityName: string
  neighborhood: string
  stars: number
  rating: string
  reviewCount: number
  fromNightlyCents: number
  currencyCode: string
  freeCancellation: boolean
  payLater: boolean
  imageUrl: string | null
}

const DEFAULT_LIMIT = 24

const toUtcDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return new Date(`${value}T00:00:00.000Z`)
}

const toNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return null
  const start = toUtcDate(checkIn)
  const end = toUtcDate(checkOut)
  if (!start || !end) return null
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000)
  return diff > 0 ? diff : null
}

const toCheckInWeekday = (checkIn?: string) => {
  if (!checkIn) return null
  const start = toUtcDate(checkIn)
  if (!start) return null
  return start.getUTCDay()
}

const getSortOrder = (sort: HotelSort | undefined) => {
  if (sort === 'price-asc') {
    return [asc(hotels.fromNightlyCents), desc(hotels.rating)] as const
  }

  if (sort === 'price-desc') {
    return [desc(hotels.fromNightlyCents), desc(hotels.rating)] as const
  }

  if (sort === 'rating-desc') {
    return [desc(hotels.rating), desc(hotels.reviewCount)] as const
  }

  return [desc(hotels.rating), desc(hotels.reviewCount), asc(hotels.fromNightlyCents)] as const
}

const normalizeAmenitySlugs = (value: string[] | undefined) =>
  Array.from(
    new Set(
      (value || [])
        .map((entry) =>
          String(entry || '')
            .trim()
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, '-')
            .replaceAll(/(^-|-$)/g, ''),
        )
        .filter(Boolean),
    ),
  )

export async function searchHotels(input: SearchHotelsInput): Promise<HotelSearchRow[]> {
  const db = getDb()
  const amenitySlugs = normalizeAmenitySlugs(input.amenities)
  const conditions = [eq(cities.slug, input.citySlug)]

  if (input.starsMin != null) {
    conditions.push(gte(hotels.stars, input.starsMin))
  }

  if (input.priceMaxCents != null) {
    conditions.push(lte(hotels.fromNightlyCents, input.priceMaxCents))
  }

  const nights = toNights(input.checkIn, input.checkOut)
  const checkInWeekday = toCheckInWeekday(input.checkIn)

  if (input.checkIn && nights != null) {
    conditions.push(eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'))
    conditions.push(lte(hotelAvailabilitySnapshots.checkInStart, input.checkIn))
    conditions.push(gte(hotelAvailabilitySnapshots.checkInEnd, input.checkIn))
    conditions.push(lte(hotelAvailabilitySnapshots.minNights, nights))
    conditions.push(gte(hotelAvailabilitySnapshots.maxNights, nights))

    if (checkInWeekday != null) {
      conditions.push(
        sql`not (${checkInWeekday} = any(${hotelAvailabilitySnapshots.blockedWeekdays}))`,
      )
    }
  }

  for (const amenitySlug of amenitySlugs) {
    conditions.push(sql`
      exists (
        select 1
        from ${hotelAmenityLinks} as hal
        inner join ${hotelAmenities} as ha on ha.id = hal.amenity_id
        where hal.hotel_id = ${hotels.id}
          and ha.slug = ${amenitySlug}
      )
    `)
  }

  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      citySlug: cities.slug,
      cityName: cities.name,
      neighborhood: hotels.neighborhood,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      fromNightlyCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      imageUrl: hotelImages.url,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(
      hotelAvailabilitySnapshots,
      eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
    )
    .leftJoin(
      hotelImages,
      and(eq(hotelImages.hotelId, hotels.id), eq(hotelImages.sortOrder, 0)),
    )
    .where(and(...conditions))
    .orderBy(...getSortOrder(input.sort))
    .limit(input.limit ?? DEFAULT_LIMIT)
    .offset(input.offset ?? 0)

  return rows
}

export async function getHotelBySlug(slug: string) {
  const db = getDb()

  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      summary: hotels.summary,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      fromNightlyCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      cityName: cities.name,
      citySlug: cities.slug,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .where(eq(hotels.slug, slug))
    .limit(1)

  return rows[0] ?? null
}
