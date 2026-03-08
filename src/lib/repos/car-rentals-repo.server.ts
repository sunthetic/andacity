import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import {
  carInventory,
  carInventoryImages,
  carLocations,
  carOffers,
  carProviders,
  carVehicleClasses,
  countries,
  cities,
  regions,
} from '~/lib/db/schema'

export type SearchCarRentalsInput = {
  citySlug: string
  pickupDate?: string
  dropoffDate?: string
  limit?: number
  offset?: number
}

export type CarRentalSearchRow = {
  id: number
  slug: string
  citySlug: string
  cityName: string
  providerName: string
  pickupArea: string
  pickupType: 'airport' | 'city'
  rating: string
  reviewCount: number
  fromDailyCents: number
  currencyCode: string
  freeCancellation: boolean
  payAtCounter: boolean
  inclusions: string[]
  imageUrl: string | null
  score: string | null
  vehicleName: string | null
  category: string | null
  transmission: 'automatic' | 'manual' | null
  seats: number | null
  bagsLabel: string | null
}

export type CarRentalCityRow = {
  cityId: number
  slug: string
  name: string
  region: string | null
  country: string
  inventoryCount: number
}

export type CarRentalListRow = {
  id: number
  slug: string
  providerName: string
  citySlug: string
  cityName: string
}

export type CarRentalOfferRow = {
  offerCode: string
  name: string
  category: string
  transmission: 'automatic' | 'manual'
  seats: number
  doors: number
  bagsLabel: string
  airConditioning: boolean
  priceDailyCents: number
  currencyCode: string
  freeCancellation: boolean
  payAtCounter: boolean
  badges: string[]
  features: string[]
}

export type CarRentalDetailRow = {
  id: number
  slug: string
  providerName: string
  citySlug: string
  cityName: string
  regionName: string | null
  countryName: string
  pickupArea: string
  pickupAddressLine: string
  pickupType: 'airport' | 'city'
  rating: string
  reviewCount: number
  fromDailyCents: number
  currencyCode: string
  summary: string
  freeCancellation: boolean
  payAtCounter: boolean
  securityDepositRequired: boolean
  minDriverAge: number
  fuelPolicy: string
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  depositBlurb: string | null
  inclusions: string[]
  availabilityStart: string
  availabilityEnd: string
  minDays: number
  maxDays: number
  blockedWeekdays: number[]
  score: string | null
  images: string[]
  offers: CarRentalOfferRow[]
}

const DEFAULT_LIMIT = 48

const toUtcDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return new Date(`${value}T00:00:00.000Z`)
}

const toDays = (pickupDate?: string, dropoffDate?: string) => {
  if (!pickupDate || !dropoffDate) return null
  const start = toUtcDate(pickupDate)
  const end = toUtcDate(dropoffDate)
  if (!start || !end) return null
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000)
  return diff > 0 ? diff : null
}

const toPickupWeekday = (pickupDate?: string) => {
  if (!pickupDate) return null
  const start = toUtcDate(pickupDate)
  if (!start) return null
  return start.getUTCDay()
}

export async function searchCarRentals(
  input: SearchCarRentalsInput,
): Promise<CarRentalSearchRow[]> {
  const db = getDb()
  const conditions = [eq(cities.slug, input.citySlug)]

  const days = toDays(input.pickupDate, input.dropoffDate)
  const pickupWeekday = toPickupWeekday(input.pickupDate)

  if (input.pickupDate && days != null) {
    conditions.push(lte(carInventory.availabilityStart, input.pickupDate))
    conditions.push(gte(carInventory.availabilityEnd, input.pickupDate))
    conditions.push(lte(carInventory.minDays, days))
    conditions.push(gte(carInventory.maxDays, days))

    if (pickupWeekday != null) {
      conditions.push(sql`not (${pickupWeekday} = any(${carInventory.blockedWeekdays}))`)
    }
  }

  const inventoryRows = await db
    .select({
      id: carInventory.id,
      slug: carInventory.slug,
      citySlug: cities.slug,
      cityName: cities.name,
      providerName: carProviders.name,
      pickupArea: carLocations.name,
      pickupType: carLocations.locationType,
      rating: carInventory.rating,
      reviewCount: carInventory.reviewCount,
      fromDailyCents: carInventory.fromDailyCents,
      currencyCode: carInventory.currencyCode,
      freeCancellation: carInventory.freeCancellation,
      payAtCounter: carInventory.payAtCounter,
      inclusions: carInventory.inclusions,
      imageUrl: carInventoryImages.url,
      score: carInventory.score,
    })
    .from(carInventory)
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .leftJoin(
      carInventoryImages,
      and(
        eq(carInventoryImages.inventoryId, carInventory.id),
        eq(carInventoryImages.sortOrder, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(asc(carInventory.fromDailyCents), asc(carInventory.id))
    .limit(input.limit ?? DEFAULT_LIMIT)
    .offset(input.offset ?? 0)

  if (!inventoryRows.length) {
    return []
  }

  const inventoryIds = inventoryRows.map((row) => row.id)

  const offerRows = await db
    .select({
      inventoryId: carOffers.inventoryId,
      name: carOffers.name,
      category: carVehicleClasses.category,
      transmission: carOffers.transmission,
      seats: carOffers.seats,
      bagsLabel: carOffers.bagsLabel,
      priceDailyCents: carOffers.priceDailyCents,
    })
    .from(carOffers)
    .innerJoin(carVehicleClasses, eq(carOffers.vehicleClassId, carVehicleClasses.id))
    .where(inArray(carOffers.inventoryId, inventoryIds))
    .orderBy(asc(carOffers.inventoryId), asc(carOffers.priceDailyCents), asc(carOffers.id))

  const firstOfferByInventoryId = new Map<number, (typeof offerRows)[number]>()
  for (const offer of offerRows) {
    if (firstOfferByInventoryId.has(offer.inventoryId)) continue
    firstOfferByInventoryId.set(offer.inventoryId, offer)
  }

  return inventoryRows.map((row) => {
    const offer = firstOfferByInventoryId.get(row.id)
    return {
      id: row.id,
      slug: row.slug,
      citySlug: row.citySlug,
      cityName: row.cityName,
      providerName: row.providerName,
      pickupArea: row.pickupArea,
      pickupType: row.pickupType,
      rating: row.rating,
      reviewCount: row.reviewCount,
      fromDailyCents: row.fromDailyCents,
      currencyCode: row.currencyCode,
      freeCancellation: row.freeCancellation,
      payAtCounter: row.payAtCounter,
      inclusions: row.inclusions,
      imageUrl: row.imageUrl,
      score: row.score,
      vehicleName: offer?.name || null,
      category: offer?.category || null,
      transmission: offer?.transmission || null,
      seats: offer?.seats ?? null,
      bagsLabel: offer?.bagsLabel || null,
    }
  })
}

export async function listCarRentalCities(): Promise<CarRentalCityRow[]> {
  const db = getDb()
  const inventoryCountSql = sql<number>`count(${carInventory.id})::int`

  return db
    .select({
      cityId: cities.id,
      slug: cities.slug,
      name: cities.name,
      region: regions.name,
      country: countries.name,
      inventoryCount: inventoryCountSql,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(carInventory, eq(carInventory.cityId, cities.id))
    .groupBy(cities.id, cities.slug, cities.name, regions.name, countries.name)
    .orderBy(asc(cities.name))
}

export async function getCarRentalCityBySlug(citySlug: string): Promise<CarRentalCityRow | null> {
  const db = getDb()
  const inventoryCountSql = sql<number>`count(${carInventory.id})::int`

  const rows = await db
    .select({
      cityId: cities.id,
      slug: cities.slug,
      name: cities.name,
      region: regions.name,
      country: countries.name,
      inventoryCount: inventoryCountSql,
    })
    .from(cities)
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(carInventory, eq(carInventory.cityId, cities.id))
    .where(eq(cities.slug, citySlug))
    .groupBy(cities.id, cities.slug, cities.name, regions.name, countries.name)
    .limit(1)

  return rows[0] || null
}

export async function listCarRentals(input: { limit: number; offset: number }): Promise<CarRentalListRow[]> {
  const db = getDb()
  return db
    .select({
      id: carInventory.id,
      slug: carInventory.slug,
      providerName: carProviders.name,
      citySlug: cities.slug,
      cityName: cities.name,
    })
    .from(carInventory)
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .orderBy(asc(carInventory.id))
    .limit(input.limit)
    .offset(input.offset)
}

export async function getCarRentalDetailBySlug(slug: string): Promise<CarRentalDetailRow | null> {
  const db = getDb()

  const rows = await db
    .select({
      id: carInventory.id,
      slug: carInventory.slug,
      providerName: carProviders.name,
      citySlug: cities.slug,
      cityName: cities.name,
      regionName: regions.name,
      countryName: countries.name,
      pickupArea: carLocations.name,
      pickupAddressLine: carLocations.addressLine,
      pickupType: carLocations.locationType,
      rating: carInventory.rating,
      reviewCount: carInventory.reviewCount,
      fromDailyCents: carInventory.fromDailyCents,
      currencyCode: carInventory.currencyCode,
      summary: carInventory.summary,
      freeCancellation: carInventory.freeCancellation,
      payAtCounter: carInventory.payAtCounter,
      securityDepositRequired: carInventory.securityDepositRequired,
      minDriverAge: carInventory.minDriverAge,
      fuelPolicy: carInventory.fuelPolicy,
      cancellationBlurb: carInventory.cancellationBlurb,
      paymentBlurb: carInventory.paymentBlurb,
      feesBlurb: carInventory.feesBlurb,
      depositBlurb: carInventory.depositBlurb,
      inclusions: carInventory.inclusions,
      availabilityStart: carInventory.availabilityStart,
      availabilityEnd: carInventory.availabilityEnd,
      minDays: carInventory.minDays,
      maxDays: carInventory.maxDays,
      blockedWeekdays: carInventory.blockedWeekdays,
      score: carInventory.score,
    })
    .from(carInventory)
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .leftJoin(regions, eq(cities.regionId, regions.id))
    .innerJoin(countries, eq(cities.countryId, countries.id))
    .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .where(eq(carInventory.slug, slug))
    .limit(1)

  const rental = rows[0]
  if (!rental) return null

  const imageRows = await db
    .select({
      url: carInventoryImages.url,
    })
    .from(carInventoryImages)
    .where(eq(carInventoryImages.inventoryId, rental.id))
    .orderBy(asc(carInventoryImages.sortOrder), asc(carInventoryImages.id))

  const offerRows = await db
    .select({
      offerCode: carOffers.offerCode,
      name: carOffers.name,
      category: carVehicleClasses.category,
      transmission: carOffers.transmission,
      seats: carOffers.seats,
      doors: carOffers.doors,
      bagsLabel: carOffers.bagsLabel,
      airConditioning: carOffers.airConditioning,
      priceDailyCents: carOffers.priceDailyCents,
      currencyCode: carOffers.currencyCode,
      freeCancellation: carOffers.freeCancellation,
      payAtCounter: carOffers.payAtCounter,
      badges: carOffers.badges,
      features: carOffers.features,
    })
    .from(carOffers)
    .innerJoin(carVehicleClasses, eq(carOffers.vehicleClassId, carVehicleClasses.id))
    .where(eq(carOffers.inventoryId, rental.id))
    .orderBy(asc(carOffers.priceDailyCents), asc(carOffers.id))

  return {
    ...rental,
    images: imageRows.map((row) => row.url),
    offers: offerRows,
  }
}
