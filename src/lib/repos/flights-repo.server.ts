import { and, asc, desc, eq, inArray, lte } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '~/lib/db/client.server'
import {
  airlines,
  airports,
  flightCabinClassEnum,
  flightFares,
  flightItineraries,
  flightRoutes,
  flightTimeWindowEnum,
} from '~/lib/db/schema'

export type FlightSort = 'recommended' | 'price-asc' | 'duration' | 'departure-asc'

export type SearchFlightsInput = {
  originIata: string
  destinationIata: string
  serviceDate?: string
  itineraryType?: (typeof flightItineraryTypeValues)[number]
  cabinClass?: (typeof flightCabinClassValues)[number]
  maxStops?: 0 | 1 | 2
  departureWindows?: (typeof flightTimeWindowValues)[number][]
  sort?: FlightSort
  limit?: number
  offset?: number
}

export const flightItineraryTypeValues = ['one-way', 'round-trip'] as const
export const flightCabinClassValues = flightCabinClassEnum.enumValues
export const flightTimeWindowValues = flightTimeWindowEnum.enumValues

export type FlightSearchRow = {
  id: number
  seedKey: string
  airline: string
  originIata: string
  destinationIata: string
  itineraryType: 'one-way' | 'round-trip'
  serviceDate: string
  departureAtUtc: Date
  arrivalAtUtc: Date
  departureMinutes: number
  arrivalMinutes: number
  departureWindow: (typeof flightTimeWindowValues)[number]
  arrivalWindow: (typeof flightTimeWindowValues)[number]
  stops: number
  durationMinutes: number
  cabinClass: (typeof flightCabinClassValues)[number]
  priceCents: number
  currencyCode: string
  seatsRemaining: number
}

const DEFAULT_LIMIT = 30

const normalizeIata = (value: string) => String(value || '').trim().toUpperCase()

const getSortOrder = (sort: FlightSort | undefined) => {
  if (sort === 'price-asc') {
    return [asc(flightItineraries.basePriceCents), asc(flightItineraries.durationMinutes)] as const
  }

  if (sort === 'duration') {
    return [asc(flightItineraries.durationMinutes), asc(flightItineraries.basePriceCents)] as const
  }

  if (sort === 'departure-asc') {
    return [asc(flightItineraries.departureMinutes), asc(flightItineraries.basePriceCents)] as const
  }

  return [asc(flightItineraries.stops), asc(flightItineraries.durationMinutes), asc(flightItineraries.basePriceCents)] as const
}

export async function searchFlights(input: SearchFlightsInput): Promise<FlightSearchRow[]> {
  const db = getDb()
  const originAirport = alias(airports, 'origin_airport')
  const destinationAirport = alias(airports, 'destination_airport')

  const conditions = [
    eq(originAirport.iataCode, normalizeIata(input.originIata)),
    eq(destinationAirport.iataCode, normalizeIata(input.destinationIata)),
  ]

  if (input.serviceDate) {
    conditions.push(eq(flightItineraries.serviceDate, input.serviceDate))
  }

  if (input.itineraryType) {
    conditions.push(eq(flightItineraries.itineraryType, input.itineraryType))
  }

  if (input.cabinClass) {
    conditions.push(eq(flightItineraries.cabinClass, input.cabinClass))
  }

  if (input.maxStops != null) {
    conditions.push(lte(flightItineraries.stops, input.maxStops))
  }

  if (input.departureWindows?.length) {
    conditions.push(inArray(flightItineraries.departureWindow, input.departureWindows))
  }

  const rows = await db
    .select({
      id: flightItineraries.id,
      seedKey: flightItineraries.seedKey,
      airline: airlines.name,
      originIata: originAirport.iataCode,
      destinationIata: destinationAirport.iataCode,
      itineraryType: flightItineraries.itineraryType,
      serviceDate: flightItineraries.serviceDate,
      departureAtUtc: flightItineraries.departureAtUtc,
      arrivalAtUtc: flightItineraries.arrivalAtUtc,
      departureMinutes: flightItineraries.departureMinutes,
      arrivalMinutes: flightItineraries.arrivalMinutes,
      departureWindow: flightItineraries.departureWindow,
      arrivalWindow: flightItineraries.arrivalWindow,
      stops: flightItineraries.stops,
      durationMinutes: flightItineraries.durationMinutes,
      cabinClass: flightItineraries.cabinClass,
      priceCents: flightItineraries.basePriceCents,
      currencyCode: flightItineraries.currencyCode,
      seatsRemaining: flightItineraries.seatsRemaining,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .innerJoin(airlines, eq(flightItineraries.airlineId, airlines.id))
    .leftJoin(
      flightFares,
      and(
        eq(flightFares.itineraryId, flightItineraries.id),
        eq(flightFares.fareCode, 'standard'),
        eq(flightFares.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(and(...conditions))
    .orderBy(...getSortOrder(input.sort))
    .limit(input.limit ?? DEFAULT_LIMIT)
    .offset(input.offset ?? 0)

  return rows
}
