import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  countries,
  cities,
  hotelAmenityLinks,
  hotelAmenities,
  hotelAvailabilitySnapshots,
  hotelImages,
  hotelOffers,
  hotels,
  regions,
} from '~/lib/db/schema'

export type HotelSort = 'recommended' | 'price-asc' | 'rating-desc' | 'value'
export type HotelPriceRange = 'under-150' | '150-300' | '300-500' | '500-plus'

export type SearchHotelsInput = {
  citySlug: string
  checkIn?: string
  checkOut?: string
  stars?: number[]
  starsMin?: number
  ratingMin?: number
  priceRanges?: HotelPriceRange[]
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
  amenities: string[]
  freshnessTimestamp: Date | string | null
}

export type HotelListRow = {
  id: number
  slug: string
  name: string
  citySlug: string
  cityName: string
  regionName: string | null
  countryName: string
  neighborhood: string
  addressLine: string
  propertyType: string
  summary: string
  stars: number
  rating: string
  reviewCount: number
  fromNightlyCents: number
  currencyCode: string
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  checkInTime: string | null
  checkOutTime: string | null
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  imageUrl: string | null
  amenities: string[]
  freshnessTimestamp: Date | string | null
}

export type HotelOfferRow = {
  externalOfferId: string
  name: string
  sleeps: number
  beds: string
  sizeSqft: number
  priceNightlyCents: number
  refundable: boolean
  payLater: boolean
  badges: string[]
  features: string[]
}

export type HotelAvailabilityRow = {
  checkInStart: string
  checkInEnd: string
  minNights: number
  maxNights: number
  blockedWeekdays: number[]
}

export type HotelDetailRow = {
  id: number
  slug: string
  name: string
  citySlug: string
  cityName: string
  regionName: string | null
  countryName: string
  neighborhood: string
  propertyType: string
  addressLine: string
  summary: string
  stars: number
  rating: string
  reviewCount: number
  fromNightlyCents: number
  currencyCode: string
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  checkInTime: string | null
  checkOutTime: string | null
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  images: string[]
  amenities: string[]
  offers: HotelOfferRow[]
  availability: HotelAvailabilityRow | null
  freshnessTimestamp: Date | string | null
}

export type HotelCitySummaryRow = {
  cityId: number
  slug: string
  city: string
  region: string | null
  country: string
  hotelCount: number
  fromNightlyCents: number
  topAmenities: { name: string; count: number }[]
  topNeighborhoods: { name: string; count: number }[]
  hotelSlugs: string[]
}

export type SearchHotelsResult = {
  totalCount: number
  rows: HotelSearchRow[]
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
  const ratingSql = sql<number>`(${hotels.rating})::numeric`
  const valueSql = sql<number>`
    (
      ((${ratingSql}) * 100.0) +
      (${hotels.stars} * 22.0) +
      (case when ${hotels.freeCancellation} then 18.0 else 0.0 end) +
      (case when ${hotels.payLater} then 12.0 else 0.0 end)
    ) / greatest(${hotels.fromNightlyCents}, 1)
  `

  if (sort === 'price-asc') {
    return [asc(hotels.fromNightlyCents), desc(hotels.rating)] as const
  }

  if (sort === 'rating-desc') {
    return [desc(hotels.rating), desc(hotels.reviewCount)] as const
  }

  if (sort === 'value') {
    return [desc(valueSql), desc(hotels.rating), asc(hotels.fromNightlyCents)] as const
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

const normalizeStars = (stars: number[] | undefined) =>
  Array.from(
    new Set(
      (stars || [])
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5),
    ),
  ).sort((a, b) => a - b)

const normalizePriceRanges = (ranges: HotelPriceRange[] | undefined) => {
  const allowed: HotelPriceRange[] = ['under-150', '150-300', '300-500', '500-plus']
  return Array.from(new Set((ranges || []).filter((value): value is HotelPriceRange => allowed.includes(value))))
}

const buildHotelSearchConditions = (input: SearchHotelsInput) => {
  const amenitySlugs = normalizeAmenitySlugs(input.amenities)
  const stars = normalizeStars(input.stars)
  const priceRanges = normalizePriceRanges(input.priceRanges)
  const conditions = [eq(cities.slug, input.citySlug)]

  if (stars.length) {
    conditions.push(inArray(hotels.stars, stars))
  } else if (input.starsMin != null) {
    conditions.push(gte(hotels.stars, input.starsMin))
  }

  if (input.ratingMin != null) {
    conditions.push(gte(hotels.rating, String(input.ratingMin)))
  }

  if (priceRanges.length) {
    const priceConditions: SQL[] = []
    for (const range of priceRanges) {
      if (range === 'under-150') {
        priceConditions.push(lte(hotels.fromNightlyCents, 14999))
        continue
      }

      if (range === '150-300') {
        const between150And300 = and(gte(hotels.fromNightlyCents, 15000), lte(hotels.fromNightlyCents, 30000))
        if (between150And300) {
          priceConditions.push(between150And300)
        }
        continue
      }

      if (range === '300-500') {
        const between300And500 = and(gte(hotels.fromNightlyCents, 30001), lte(hotels.fromNightlyCents, 50000))
        if (between300And500) {
          priceConditions.push(between300And500)
        }
        continue
      }

      priceConditions.push(gte(hotels.fromNightlyCents, 50001))
    }

    if (priceConditions.length) {
      const priceCondition = or(...priceConditions)
      if (priceCondition) {
        conditions.push(priceCondition)
      }
    }
  }

  if (input.priceMaxCents != null) {
    conditions.push(lte(hotels.fromNightlyCents, input.priceMaxCents))
  }

  const nights = toNights(input.checkIn, input.checkOut)
  const checkInWeekday = toCheckInWeekday(input.checkIn)

  if (input.checkIn && nights != null) {
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

  return conditions
}

export async function searchHotels(input: SearchHotelsInput): Promise<SearchHotelsResult> {
  const db = getDb()
  const conditions = buildHotelSearchConditions(input)
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
      freshnessTimestamp: hotelAvailabilitySnapshots.snapshotAt,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(
      hotelAvailabilitySnapshots,
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .leftJoin(
      hotelImages,
      and(eq(hotelImages.hotelId, hotels.id), eq(hotelImages.sortOrder, 0)),
    )
    .where(and(...conditions))
    .orderBy(...getSortOrder(input.sort))
    .limit(input.limit ?? DEFAULT_LIMIT)
    .offset(input.offset ?? 0)

  const countRows = await db
    .select({
      count: sql<number>`count(distinct ${hotels.id})::int`,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(
      hotelAvailabilitySnapshots,
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .where(and(...conditions))

  const totalCount = countRows[0]?.count ?? 0

  if (!rows.length) {
    return {
      totalCount,
      rows: [],
    }
  }

  const hotelIds = rows.map((row) => row.id)
  const amenityRows = await db
    .select({
      hotelId: hotelAmenityLinks.hotelId,
      label: hotelAmenities.label,
    })
    .from(hotelAmenityLinks)
    .innerJoin(hotelAmenities, eq(hotelAmenityLinks.amenityId, hotelAmenities.id))
    .where(inArray(hotelAmenityLinks.hotelId, hotelIds))
    .orderBy(hotelAmenityLinks.hotelId, hotelAmenities.label)

  const amenitiesByHotelId = new Map<number, string[]>()
  for (const entry of amenityRows) {
    const existing = amenitiesByHotelId.get(entry.hotelId)
    if (existing) {
      existing.push(entry.label)
      continue
    }
    amenitiesByHotelId.set(entry.hotelId, [entry.label])
  }

  return {
    totalCount,
    rows: rows.map((row) => ({
      ...row,
      amenities: amenitiesByHotelId.get(row.id) || [],
    })),
  }
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

export async function listHotelsByCitySlug(
  citySlug: string,
  options: { limit?: number; offset?: number } = {},
): Promise<HotelListRow[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      citySlug: cities.slug,
      cityName: cities.name,
      regionName: regions.name,
      countryName: countries.name,
      neighborhood: hotels.neighborhood,
      addressLine: hotels.addressLine,
      propertyType: hotels.propertyType,
      summary: hotels.summary,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      fromNightlyCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      noResortFees: hotels.noResortFees,
      checkInTime: hotels.checkInTime,
      checkOutTime: hotels.checkOutTime,
      cancellationBlurb: hotels.cancellationBlurb,
      paymentBlurb: hotels.paymentBlurb,
      feesBlurb: hotels.feesBlurb,
      imageUrl: hotelImages.url,
      freshnessTimestamp: hotelAvailabilitySnapshots.snapshotAt,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(
      hotelAvailabilitySnapshots,
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .leftJoin(
      hotelImages,
      and(eq(hotelImages.hotelId, hotels.id), eq(hotelImages.sortOrder, 0)),
    )
    .where(eq(cities.slug, citySlug))
    .orderBy(desc(hotels.rating), asc(hotels.fromNightlyCents), asc(hotels.id))
    .limit(options.limit ?? 200)
    .offset(options.offset ?? 0)

  if (!rows.length) return []

  const hotelIds = rows.map((row) => row.id)
  const amenityRows = await db
    .select({
      hotelId: hotelAmenityLinks.hotelId,
      label: hotelAmenities.label,
    })
    .from(hotelAmenityLinks)
    .innerJoin(hotelAmenities, eq(hotelAmenityLinks.amenityId, hotelAmenities.id))
    .where(inArray(hotelAmenityLinks.hotelId, hotelIds))
    .orderBy(hotelAmenityLinks.hotelId, hotelAmenities.label)

  const amenitiesByHotelId = new Map<number, string[]>()
  for (const entry of amenityRows) {
    const existing = amenitiesByHotelId.get(entry.hotelId)
    if (existing) {
      existing.push(entry.label)
      continue
    }
    amenitiesByHotelId.set(entry.hotelId, [entry.label])
  }

  return rows.map((row) => ({
    ...row,
    amenities: amenitiesByHotelId.get(row.id) || [],
  }))
}

export async function getHotelDetailBySlug(slug: string): Promise<HotelDetailRow | null> {
  const db = getDb()

  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      citySlug: cities.slug,
      cityName: cities.name,
      regionName: regions.name,
      countryName: countries.name,
      neighborhood: hotels.neighborhood,
      propertyType: hotels.propertyType,
      addressLine: hotels.addressLine,
      summary: hotels.summary,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      fromNightlyCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      noResortFees: hotels.noResortFees,
      checkInTime: hotels.checkInTime,
      checkOutTime: hotels.checkOutTime,
      cancellationBlurb: hotels.cancellationBlurb,
      paymentBlurb: hotels.paymentBlurb,
      feesBlurb: hotels.feesBlurb,
      freshnessTimestamp: hotelAvailabilitySnapshots.snapshotAt,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(
      hotelAvailabilitySnapshots,
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .where(eq(hotels.slug, slug))
    .limit(1)

  const hotel = rows[0]
  if (!hotel) return null

  const imageRows = await db
    .select({
      url: hotelImages.url,
    })
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotel.id))
    .orderBy(asc(hotelImages.sortOrder), asc(hotelImages.id))

  const amenityRows = await db
    .select({
      label: hotelAmenities.label,
    })
    .from(hotelAmenityLinks)
    .innerJoin(hotelAmenities, eq(hotelAmenityLinks.amenityId, hotelAmenities.id))
    .where(eq(hotelAmenityLinks.hotelId, hotel.id))
    .orderBy(hotelAmenities.label)

  const offerRows = await db
    .select({
      externalOfferId: hotelOffers.externalOfferId,
      name: hotelOffers.name,
      sleeps: hotelOffers.sleeps,
      beds: hotelOffers.beds,
      sizeSqft: hotelOffers.sizeSqft,
      priceNightlyCents: hotelOffers.priceNightlyCents,
      refundable: hotelOffers.refundable,
      payLater: hotelOffers.payLater,
      badges: hotelOffers.badges,
      features: hotelOffers.features,
    })
    .from(hotelOffers)
    .where(eq(hotelOffers.hotelId, hotel.id))
    .orderBy(asc(hotelOffers.priceNightlyCents), asc(hotelOffers.id))

  const availabilityRows = await db
    .select({
      checkInStart: hotelAvailabilitySnapshots.checkInStart,
      checkInEnd: hotelAvailabilitySnapshots.checkInEnd,
      minNights: hotelAvailabilitySnapshots.minNights,
      maxNights: hotelAvailabilitySnapshots.maxNights,
      blockedWeekdays: hotelAvailabilitySnapshots.blockedWeekdays,
    })
    .from(hotelAvailabilitySnapshots)
    .where(
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotel.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .limit(1)

  return {
    ...hotel,
    images: imageRows.map((row) => row.url),
    amenities: amenityRows.map((row) => row.label),
    offers: offerRows,
    availability: availabilityRows[0] || null,
    freshnessTimestamp: hotel.freshnessTimestamp,
  }
}

export async function countHotels(): Promise<number> {
  const db = getDb()
  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(hotels)

  return rows[0]?.count ?? 0
}

export async function listHotelSlugs(input: { limit: number; offset: number }): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .select({
      slug: hotels.slug,
    })
    .from(hotels)
    .orderBy(asc(hotels.id))
    .limit(input.limit)
    .offset(input.offset)

  return rows.map((row) => row.slug)
}

export async function listHotelCitySummaries(): Promise<HotelCitySummaryRow[]> {
  const db = getDb()
  const cityHotelCountSql = sql<number>`count(${hotels.id})::int`
  const cityMinPriceSql = sql<number>`min(${hotels.fromNightlyCents})::int`

  const cityRows = await db
    .select({
      cityId: cities.id,
      slug: cities.slug,
      city: cities.name,
      region: regions.name,
      country: countries.name,
      hotelCount: cityHotelCountSql,
      fromNightlyCents: cityMinPriceSql,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(hotels, eq(hotels.cityId, cities.id))
    .groupBy(cities.id, cities.slug, cities.name, regions.name, countries.name)
    .orderBy(asc(cities.name))

  if (!cityRows.length) return []

  const amenityCountSql = sql<number>`count(*)::int`
  const amenityRows = await db
    .select({
      cityId: hotels.cityId,
      name: hotelAmenities.label,
      count: amenityCountSql,
    })
    .from(hotels)
    .innerJoin(hotelAmenityLinks, eq(hotelAmenityLinks.hotelId, hotels.id))
    .innerJoin(hotelAmenities, eq(hotelAmenities.id, hotelAmenityLinks.amenityId))
    .groupBy(hotels.cityId, hotelAmenities.label)
    .orderBy(asc(hotels.cityId), desc(amenityCountSql), asc(hotelAmenities.label))

  const neighborhoodCountSql = sql<number>`count(*)::int`
  const neighborhoodRows = await db
    .select({
      cityId: hotels.cityId,
      name: hotels.neighborhood,
      count: neighborhoodCountSql,
    })
    .from(hotels)
    .groupBy(hotels.cityId, hotels.neighborhood)
    .orderBy(asc(hotels.cityId), desc(neighborhoodCountSql), asc(hotels.neighborhood))

  const hotelSlugRows = await db
    .select({
      cityId: hotels.cityId,
      slug: hotels.slug,
    })
    .from(hotels)
    .orderBy(asc(hotels.cityId), asc(hotels.slug))

  const amenitiesByCityId = new Map<number, { name: string; count: number }[]>()
  for (const row of amenityRows) {
    const current = amenitiesByCityId.get(row.cityId) || []
    if (current.length >= 10) continue
    current.push({
      name: row.name,
      count: row.count,
    })
    amenitiesByCityId.set(row.cityId, current)
  }

  const neighborhoodsByCityId = new Map<number, { name: string; count: number }[]>()
  for (const row of neighborhoodRows) {
    const current = neighborhoodsByCityId.get(row.cityId) || []
    if (current.length >= 10) continue
    current.push({
      name: row.name,
      count: row.count,
    })
    neighborhoodsByCityId.set(row.cityId, current)
  }

  const slugsByCityId = new Map<number, string[]>()
  for (const row of hotelSlugRows) {
    const current = slugsByCityId.get(row.cityId)
    if (current) {
      current.push(row.slug)
      continue
    }
    slugsByCityId.set(row.cityId, [row.slug])
  }

  return cityRows.map((row) => ({
    ...row,
    topAmenities: amenitiesByCityId.get(row.cityId) || [],
    topNeighborhoods: neighborhoodsByCityId.get(row.cityId) || [],
    hotelSlugs: slugsByCityId.get(row.cityId) || [],
  }))
}

export async function getHotelCitySummaryBySlug(citySlug: string): Promise<HotelCitySummaryRow | null> {
  const db = getDb()
  const cityHotelCountSql = sql<number>`count(${hotels.id})::int`
  const cityMinPriceSql = sql<number>`min(${hotels.fromNightlyCents})::int`

  const cityRows = await db
    .select({
      cityId: cities.id,
      slug: cities.slug,
      city: cities.name,
      region: regions.name,
      country: countries.name,
      hotelCount: cityHotelCountSql,
      fromNightlyCents: cityMinPriceSql,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(hotels, eq(hotels.cityId, cities.id))
    .where(eq(cities.slug, citySlug))
    .groupBy(cities.id, cities.slug, cities.name, regions.name, countries.name)
    .limit(1)

  const cityRow = cityRows[0]
  if (!cityRow) return null

  const amenityCountSql = sql<number>`count(*)::int`
  const amenityRows = await db
    .select({
      name: hotelAmenities.label,
      count: amenityCountSql,
    })
    .from(hotels)
    .innerJoin(hotelAmenityLinks, eq(hotelAmenityLinks.hotelId, hotels.id))
    .innerJoin(hotelAmenities, eq(hotelAmenities.id, hotelAmenityLinks.amenityId))
    .where(eq(hotels.cityId, cityRow.cityId))
    .groupBy(hotelAmenities.label)
    .orderBy(desc(amenityCountSql), asc(hotelAmenities.label))
    .limit(10)

  const neighborhoodCountSql = sql<number>`count(*)::int`
  const neighborhoodRows = await db
    .select({
      name: hotels.neighborhood,
      count: neighborhoodCountSql,
    })
    .from(hotels)
    .where(eq(hotels.cityId, cityRow.cityId))
    .groupBy(hotels.neighborhood)
    .orderBy(desc(neighborhoodCountSql), asc(hotels.neighborhood))
    .limit(10)

  const hotelSlugRows = await db
    .select({
      slug: hotels.slug,
    })
    .from(hotels)
    .where(eq(hotels.cityId, cityRow.cityId))
    .orderBy(asc(hotels.slug))

  return {
    ...cityRow,
    topAmenities: amenityRows,
    topNeighborhoods: neighborhoodRows,
    hotelSlugs: hotelSlugRows.map((row) => row.slug),
  }
}
