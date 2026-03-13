import { and, asc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '~/lib/db/client.server'
import {
  airlines,
  airports,
  flightFares,
  flightItineraries,
  flightRoutes,
  flightSegments,
} from '~/lib/db/schema'
import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import { toFlightSearchEntity } from '~/lib/search/search-entity'
import type { ParsedFlightInventoryId } from '~/lib/inventory/inventory-id'
import type { InventoryProviderResolverInput, ResolvedInventoryRecord } from '~/types/inventory'

type FlightInventoryRow = {
  id: number
  airlineName: string
  airlineCode: string | null
  flightNumber: string | null
  serviceDate: string
  originCode: string
  destinationCode: string
  stops: number
  durationMinutes: number
  cabinClass: 'economy' | 'premium-economy' | 'business' | 'first'
  currentPriceCents: number
  currentCurrencyCode: string
  seatsRemaining: number | null
}

const toPriceAmount = (cents: number) => Math.max(0, Math.round(Number(cents || 0) / 100))

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const queryFlightInventoryById = async (itineraryId: number) => {
  const db = getDb()
  const primarySegment = alias(flightSegments, 'inventory_resolver_primary_segment')
  const originAirport = alias(airports, 'inventory_resolver_origin_airport')
  const destinationAirport = alias(airports, 'inventory_resolver_destination_airport')
  const standardFare = alias(flightFares, 'inventory_resolver_standard_fare')

  const rows = await db
    .select({
      id: flightItineraries.id,
      airlineName: airlines.name,
      airlineCode: airlines.iataCode,
      flightNumber: primarySegment.operatingFlightNumber,
      serviceDate: flightItineraries.serviceDate,
      originCode: originAirport.iataCode,
      destinationCode: destinationAirport.iataCode,
      stops: flightItineraries.stops,
      durationMinutes: flightItineraries.durationMinutes,
      cabinClass: flightItineraries.cabinClass,
      currentPriceCents:
        sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currentCurrencyCode:
        sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      seatsRemaining:
        sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(airlines, eq(flightItineraries.airlineId, airlines.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .leftJoin(
      primarySegment,
      and(
        eq(primarySegment.itineraryId, flightItineraries.id),
        eq(primarySegment.segmentOrder, 0),
      ),
    )
    .leftJoin(
      standardFare,
      and(
        eq(standardFare.itineraryId, flightItineraries.id),
        eq(standardFare.fareCode, 'standard'),
        eq(standardFare.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(eq(flightItineraries.id, itineraryId))
    .limit(1)

  return rows[0] || null
}

const queryFlightInventoryByCanonical = async (input: {
  airlineCode: string
  flightNumber: string
  serviceDate: string
  originCode: string
  destinationCode: string
}) => {
  const db = getDb()
  const primarySegment = alias(flightSegments, 'inventory_resolver_match_segment')
  const originAirport = alias(airports, 'inventory_resolver_match_origin_airport')
  const destinationAirport = alias(airports, 'inventory_resolver_match_destination_airport')
  const standardFare = alias(flightFares, 'inventory_resolver_match_standard_fare')

  const rows = await db
    .select({
      id: flightItineraries.id,
      airlineName: airlines.name,
      airlineCode: airlines.iataCode,
      flightNumber: primarySegment.operatingFlightNumber,
      serviceDate: flightItineraries.serviceDate,
      originCode: originAirport.iataCode,
      destinationCode: destinationAirport.iataCode,
      stops: flightItineraries.stops,
      durationMinutes: flightItineraries.durationMinutes,
      cabinClass: flightItineraries.cabinClass,
      currentPriceCents:
        sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currentCurrencyCode:
        sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      seatsRemaining:
        sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(airlines, eq(flightItineraries.airlineId, airlines.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .leftJoin(
      primarySegment,
      and(
        eq(primarySegment.itineraryId, flightItineraries.id),
        eq(primarySegment.segmentOrder, 0),
      ),
    )
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
        eq(flightItineraries.serviceDate, input.serviceDate),
        eq(airlines.iataCode, input.airlineCode),
        eq(originAirport.iataCode, input.originCode),
        eq(destinationAirport.iataCode, input.destinationCode),
        eq(primarySegment.operatingFlightNumber, input.flightNumber),
      ),
    )
    .orderBy(asc(flightItineraries.id))
    .limit(1)

  return rows[0] || null
}

export const resolveFlightInventory = async (
  input: InventoryProviderResolverInput<ParsedFlightInventoryId>,
): Promise<ResolvedInventoryRecord | null> => {
  const providerMatch =
    input.providerInventoryId != null
      ? await queryFlightInventoryById(input.providerInventoryId)
      : null

  const canonicalMatch =
    providerMatch ||
    (await queryFlightInventoryByCanonical({
      airlineCode: input.parsedInventory.airlineCode,
      flightNumber: input.parsedInventory.flightNumber,
      serviceDate: input.parsedInventory.departDate,
      originCode: input.parsedInventory.originCode,
      destinationCode: input.parsedInventory.destinationCode,
    }))

  const row: FlightInventoryRow | null = canonicalMatch
  if (!row) return null

  const searchEntity = toFlightSearchEntity(
    {
      itineraryId: row.id,
      airline: row.airlineName,
      airlineCode: row.airlineCode,
      flightNumber: row.flightNumber,
      serviceDate: row.serviceDate,
      requestedServiceDate: input.parsedInventory.departDate,
      origin: row.originCode,
      destination: row.destinationCode,
      originCode: row.originCode,
      destinationCode: row.destinationCode,
      stops: row.stops,
      duration: formatDuration(row.durationMinutes),
      cabinClass: row.cabinClass,
      fareCode: 'standard',
      price: toPriceAmount(row.currentPriceCents),
      currency: row.currentCurrencyCode,
    },
    {
      departDate: row.serviceDate,
      priceAmountCents: row.currentPriceCents,
      snapshotTimestamp: input.checkedAt,
      durationMinutes: row.durationMinutes,
    },
  )

  return {
    entity: toBookableEntityFromSearchEntity(searchEntity),
    checkedAt: input.checkedAt,
    isAvailable: row.seatsRemaining == null ? true : row.seatsRemaining > 0,
  }
}
