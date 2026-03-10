import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { computeDays } from '~/lib/search/car-rentals/dates'
import {
  buildAvailabilityConfidence,
  evaluateFlightAvailabilityContext,
} from '~/lib/inventory/availability-confidence'
import { buildInventoryFreshness, type InventoryFreshnessModel } from '~/lib/inventory/freshness'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'
import { computeNights } from '~/lib/search/hotels/dates'
import { addDays, toUtcDate } from '~/lib/trips/date-utils'
import { getDb } from '~/lib/db/client.server'
import {
  airlines,
  airports,
  carInventory,
  carInventoryImages,
  carLocations,
  carProviders,
  cities,
  flightFares,
  flightItineraries,
  flightRoutes,
  hotelAvailabilitySnapshots,
  hotelImages,
  hotels,
} from '~/lib/db/schema'

type RecommendationInventoryMatch = {
  inventoryId: number
  title: string
  subtitle: string | null
  imageUrl: string | null
  priceCents: number
  currencyCode: string
  meta: string[]
  href: string | null
  availabilityConfidence: import('~/lib/inventory/availability-confidence').AvailabilityConfidenceModel
  freshness: InventoryFreshnessModel
  serviceDate?: string | null
}

type HotelRecommendationInput = {
  cityId: number
  checkIn: string
  checkOut: string
}

type CarRecommendationInput = {
  cityId: number
  pickupDate: string
  dropoffDate: string
  preferredLocationType?: 'airport' | 'city'
}

type FlightRecommendationInput = {
  originCityId: number
  destinationCityId: number
  serviceDates: string[]
}

const titleCaseToken = (value: string) => {
  return String(value || '')
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const formatFlightTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

const toIsoDateList = (dates: string[]) => {
  return Array.from(
    new Set(
      dates
        .map((value) => String(value || '').trim())
        .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
    ),
  )
}

const buildForwardDateCandidates = (startDate: string | null, endDate: string | null) => {
  if (!startDate) return []

  const candidates: string[] = []
  const maxDays = endDate ? Math.max(1, Math.min(4, computeDays(startDate, endDate) || 1)) : 4

  for (let offset = 0; offset < maxDays; offset += 1) {
    const next = addDays(startDate, offset)
    if (!next) continue
    if (endDate && next >= endDate) break
    candidates.push(next)
  }

  return candidates.length ? candidates : [startDate]
}

const buildFlightHref = (
  originCityName: string,
  destinationCityName: string,
  serviceDate: string,
) => {
  const path = buildFlightsSearchPath(
    slugifyLocation(originCityName),
    slugifyLocation(destinationCityName),
    'one-way',
    1,
  )
  const params = new URLSearchParams()
  params.set('depart', serviceDate)
  return `${path}?${params.toString()}`
}

const getUtcWeekday = (value: string) => {
  const date = toUtcDate(value)
  return date ? date.getUTCDay() : null
}

const findHotelRecommendation = async (
  input: HotelRecommendationInput,
): Promise<RecommendationInventoryMatch | null> => {
  const nights = computeNights(input.checkIn, input.checkOut)
  if (nights == null) return null

  const weekday = getUtcWeekday(input.checkIn)
  const hotelImage = alias(hotelImages, 'trip_bundle_hotel_image')
  const db = getDb()
  const conditions = [
    eq(hotels.cityId, input.cityId),
    lte(hotelAvailabilitySnapshots.checkInStart, input.checkIn),
    gte(hotelAvailabilitySnapshots.checkInEnd, input.checkIn),
    lte(hotelAvailabilitySnapshots.minNights, nights),
    gte(hotelAvailabilitySnapshots.maxNights, nights),
  ]

  if (weekday != null) {
    conditions.push(sql`not (${weekday} = any(${hotelAvailabilitySnapshots.blockedWeekdays}))`)
  }

  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      neighborhood: hotels.neighborhood,
      cityName: cities.name,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      priceCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      imageUrl: hotelImage.url,
      freshnessTimestamp: hotelAvailabilitySnapshots.snapshotAt,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .innerJoin(hotelAvailabilitySnapshots, eq(hotelAvailabilitySnapshots.hotelId, hotels.id))
    .leftJoin(
      hotelImage,
      and(eq(hotelImage.hotelId, hotels.id), eq(hotelImage.sortOrder, 0)),
    )
    .where(and(...conditions))
    .orderBy(desc(hotels.rating), desc(hotels.reviewCount), asc(hotels.fromNightlyCents), asc(hotels.id))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const freshness = buildInventoryFreshness({
    checkedAt: row.freshnessTimestamp,
    profile: 'inventory_snapshot',
  })

  return {
    inventoryId: row.id,
    title: row.name,
    subtitle: `${row.neighborhood} · ${row.cityName}`,
    imageUrl: row.imageUrl,
    priceCents: row.priceCents,
    currencyCode: row.currencyCode,
    meta: [
      `${row.stars}★`,
      `${row.rating} rating`,
      `${row.reviewCount.toLocaleString('en-US')} reviews`,
      ...(row.freeCancellation ? ['Free cancellation'] : []),
      ...(row.payLater ? ['Pay later'] : []),
    ],
    href: `/hotels/${encodeURIComponent(row.slug)}`,
    availabilityConfidence: buildAvailabilityConfidence({
      freshness,
      match: 'exact',
    }),
    freshness,
  }
}

const readCarRecommendation = async (
  input: CarRecommendationInput,
  locationType?: 'airport' | 'city',
) => {
  const rentalDays = computeDays(input.pickupDate, input.dropoffDate)
  if (rentalDays == null) return null

  const weekday = getUtcWeekday(input.pickupDate)
  const inventoryImage = alias(carInventoryImages, 'trip_bundle_car_image')
  const db = getDb()
  const conditions = [
    eq(carInventory.cityId, input.cityId),
    lte(carInventory.availabilityStart, input.pickupDate),
    gte(carInventory.availabilityEnd, input.pickupDate),
    lte(carInventory.minDays, rentalDays),
    gte(carInventory.maxDays, rentalDays),
  ]

  if (weekday != null) {
    conditions.push(sql`not (${weekday} = any(${carInventory.blockedWeekdays}))`)
  }

  if (locationType) {
    conditions.push(eq(carLocations.locationType, locationType))
  }

  const rows = await db
    .select({
      id: carInventory.id,
      slug: carInventory.slug,
      providerName: carProviders.name,
      cityName: cities.name,
      locationName: carLocations.name,
      locationType: carLocations.locationType,
      priceCents: carInventory.fromDailyCents,
      currencyCode: carInventory.currencyCode,
      freeCancellation: carInventory.freeCancellation,
      payAtCounter: carInventory.payAtCounter,
      imageUrl: inventoryImage.url,
      freshnessTimestamp: carInventory.updatedAt,
    })
    .from(carInventory)
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .leftJoin(
      inventoryImage,
      and(
        eq(inventoryImage.inventoryId, carInventory.id),
        eq(inventoryImage.sortOrder, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(desc(carInventory.score), desc(carInventory.rating), asc(carInventory.fromDailyCents), asc(carInventory.id))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const freshness = buildInventoryFreshness({
    checkedAt: row.freshnessTimestamp,
    profile: 'inventory_snapshot',
  })

  return {
    inventoryId: row.id,
    title: row.providerName,
    subtitle: `${row.locationName} · ${row.cityName}`,
    imageUrl: row.imageUrl,
    priceCents: row.priceCents,
    currencyCode: row.currencyCode,
    meta: [
      row.locationType === 'airport' ? 'Airport pickup' : 'City pickup',
      ...(row.freeCancellation ? ['Free cancellation'] : []),
      ...(row.payAtCounter ? ['Pay at counter'] : []),
    ],
    href: `/car-rentals/${encodeURIComponent(row.slug)}`,
    availabilityConfidence: buildAvailabilityConfidence({
      freshness,
      match: 'exact',
    }),
    freshness,
  } satisfies RecommendationInventoryMatch
}

const findCarRecommendation = async (
  input: CarRecommendationInput,
): Promise<RecommendationInventoryMatch | null> => {
  if (input.preferredLocationType) {
    const preferred = await readCarRecommendation(input, input.preferredLocationType)
    if (preferred) return preferred
  }

  return readCarRecommendation(input)
}

const readFlightRecommendationForDate = async (
  input: FlightRecommendationInput,
  serviceDate: string,
) => {
  const originAirport = alias(airports, 'trip_bundle_origin_airport')
  const destinationAirport = alias(airports, 'trip_bundle_destination_airport')
  const originCity = alias(cities, 'trip_bundle_origin_city')
  const destinationCity = alias(cities, 'trip_bundle_destination_city')
  const standardFare = alias(flightFares, 'trip_bundle_standard_fare')
  const priceSql = sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`
  const currencySql = sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`
  const freshnessSql = sql<Date | null>`coalesce(${standardFare.updatedAt}, ${flightItineraries.updatedAt})`
  const oneWayRankSql = sql<number>`case when ${flightItineraries.itineraryType} = 'one-way' then 0 else 1 end`
  const db = getDb()

  const rows = await db
    .select({
      id: flightItineraries.id,
      serviceDate: flightItineraries.serviceDate,
      itineraryType: flightItineraries.itineraryType,
      airlineName: airlines.name,
      originCityName: originCity.name,
      destinationCityName: destinationCity.name,
      originIata: originAirport.iataCode,
      destinationIata: destinationAirport.iataCode,
      departureAt: flightItineraries.departureAtUtc,
      arrivalAt: flightItineraries.arrivalAtUtc,
      stopsLabel: flightItineraries.stopsLabel,
      cabinClass: flightItineraries.cabinClass,
      priceCents: priceSql,
      currencyCode: currencySql,
      freshnessTimestamp: freshnessSql,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(airlines, eq(flightItineraries.airlineId, airlines.id))
    .innerJoin(originCity, eq(flightRoutes.originCityId, originCity.id))
    .innerJoin(destinationCity, eq(flightRoutes.destinationCityId, destinationCity.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .leftJoin(
      standardFare,
      and(
        eq(standardFare.itineraryId, flightItineraries.id),
        eq(standardFare.fareCode, 'standard'),
        eq(standardFare.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(
      and(
        eq(flightRoutes.originCityId, input.originCityId),
        eq(flightRoutes.destinationCityId, input.destinationCityId),
        eq(flightItineraries.serviceDate, serviceDate),
      ),
    )
    .orderBy(desc(flightRoutes.isPopular), asc(oneWayRankSql), asc(flightItineraries.stops), asc(priceSql), asc(flightItineraries.departureMinutes), asc(flightItineraries.id))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const departureLabel = formatFlightTime(row.departureAt)
  const arrivalLabel = formatFlightTime(row.arrivalAt)
  const freshness = buildInventoryFreshness({
    checkedAt: row.freshnessTimestamp,
    profile: 'inventory_snapshot',
  })
  const flightAssessment = evaluateFlightAvailabilityContext({
    requestedServiceDate: serviceDate,
    actualServiceDate: row.serviceDate,
  })

  return {
    inventoryId: row.id,
    title: row.airlineName,
    subtitle: `${row.originCityName} → ${row.destinationCityName}`,
    imageUrl: null,
    priceCents: row.priceCents,
    currencyCode: row.currencyCode,
    meta: [
      `${row.originIata} → ${row.destinationIata}`,
      ...(departureLabel ? [`Depart ${departureLabel}`] : []),
      ...(arrivalLabel ? [`Arrive ${arrivalLabel}`] : []),
      row.stopsLabel,
      titleCaseToken(row.cabinClass),
    ],
    href: buildFlightHref(row.originCityName, row.destinationCityName, row.serviceDate),
    availabilityConfidence: buildAvailabilityConfidence({
      freshness,
      ...flightAssessment,
    }),
    freshness,
    serviceDate: row.serviceDate,
  } satisfies RecommendationInventoryMatch
}

const findFlightRecommendation = async (
  input: FlightRecommendationInput,
): Promise<RecommendationInventoryMatch | null> => {
  for (const serviceDate of toIsoDateList(input.serviceDates)) {
    const match = await readFlightRecommendationForDate(input, serviceDate)
    if (match) return match
  }

  return null
}

export const recommendationQueryHelpers = {
  buildForwardDateCandidates,
  findCarRecommendation,
  findFlightRecommendation,
  findHotelRecommendation,
}
