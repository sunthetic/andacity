import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm'
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

export type FlightSort =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'duration'
  | 'departure-asc'

export type SearchFlightsInput = {
  originIata: string
  destinationIata: string
  serviceDate?: string
  itineraryType?: (typeof flightItineraryTypeValues)[number]
  cabinClass?: (typeof flightCabinClassValues)[number]
  maxStops?: 0 | 1 | 2
  departureWindows?: (typeof flightTimeWindowValues)[number][]
  arrivalWindows?: (typeof flightTimeWindowValues)[number][]
  priceMinCents?: number
  priceMaxCents?: number
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
  fareCode: string | null
  priceCents: number
  currencyCode: string
  refundable: boolean | null
  changeable: boolean | null
  checkedBagsIncluded: number | null
  seatsRemaining: number | null
  freshnessTimestamp: Date | string | null
}

export type SearchFlightsResult = {
  totalCount: number
  rows: FlightSearchRow[]
}

export type FlightSearchFacets = {
  departureWindows: (typeof flightTimeWindowValues)[number][]
  arrivalWindows: (typeof flightTimeWindowValues)[number][]
  cabinClasses: (typeof flightCabinClassValues)[number][]
  maxStops: (0 | 1 | 2)[]
}

export type FlightSearchFacetsInput = Pick<
  SearchFlightsInput,
  'originIata' | 'destinationIata' | 'serviceDate' | 'itineraryType'
>

const DEFAULT_LIMIT = 30

const normalizeIata = (value: string) => String(value || '').trim().toUpperCase()

const toUnique = <T>(values: T[]) => Array.from(new Set(values))

const normalizeTimeWindows = (
  values: (typeof flightTimeWindowValues)[number][] | undefined,
) => {
  const allowed = new Set(flightTimeWindowValues)
  return toUnique((values || []).filter((value) => allowed.has(value)))
}

const normalizeCabinClass = (
  value: (typeof flightCabinClassValues)[number] | undefined,
) => {
  if (!value) return undefined
  return flightCabinClassValues.includes(value) ? value : undefined
}

const normalizeMaxStops = (value: 0 | 1 | 2 | undefined) => {
  if (value === 0 || value === 1 || value === 2) return value
  return undefined
}

const normalizePriceCents = (value: number | undefined) => {
  if (!Number.isFinite(value)) return undefined
  return Math.max(0, Math.round(Number(value)))
}

const flightPriceSql = sql<number>`coalesce(${flightFares.priceCents}, ${flightItineraries.basePriceCents})`
const flightCurrencySql = sql<string>`coalesce(${flightFares.currencyCode}, ${flightItineraries.currencyCode})`
const flightSeatsSql = sql<number | null>`coalesce(${flightFares.seatsRemaining}, ${flightItineraries.seatsRemaining})`
const flightFreshnessSql =
  sql<Date | null>`coalesce(${flightFares.updatedAt}, ${flightItineraries.updatedAt})`

const buildBaseConditions = (
  input: SearchFlightsInput,
  originAirport: any,
  destinationAirport: any,
) => {
  const conditions: SQL[] = [
    eq(originAirport.iataCode, normalizeIata(input.originIata)),
    eq(destinationAirport.iataCode, normalizeIata(input.destinationIata)),
  ]

  if (input.serviceDate) {
    conditions.push(eq(flightItineraries.serviceDate, input.serviceDate))
  }

  if (input.itineraryType) {
    conditions.push(eq(flightItineraries.itineraryType, input.itineraryType))
  }

  return conditions
}

const buildSearchConditions = (
  input: SearchFlightsInput,
  originAirport: any,
  destinationAirport: any,
) => {
  const conditions = buildBaseConditions(input, originAirport, destinationAirport)
  const departureWindows = normalizeTimeWindows(input.departureWindows)
  const arrivalWindows = normalizeTimeWindows(input.arrivalWindows)
  const cabinClass = normalizeCabinClass(input.cabinClass)
  const maxStops = normalizeMaxStops(input.maxStops)
  const priceMinCents = normalizePriceCents(input.priceMinCents)
  const priceMaxCents = normalizePriceCents(input.priceMaxCents)

  if (cabinClass) {
    conditions.push(eq(flightItineraries.cabinClass, cabinClass))
  }

  if (maxStops != null) {
    conditions.push(lte(flightItineraries.stops, maxStops))
  }

  if (departureWindows.length) {
    conditions.push(inArray(flightItineraries.departureWindow, departureWindows))
  }

  if (arrivalWindows.length) {
    conditions.push(inArray(flightItineraries.arrivalWindow, arrivalWindows))
  }

  if (priceMinCents != null) {
    conditions.push(gte(flightPriceSql, priceMinCents))
  }

  if (priceMaxCents != null) {
    conditions.push(lte(flightPriceSql, priceMaxCents))
  }

  return conditions
}

const getSortOrder = (sort: FlightSort | undefined) => {
  if (sort === 'price-asc') {
    return [asc(flightPriceSql), asc(flightItineraries.durationMinutes), asc(flightItineraries.id)] as const
  }

  if (sort === 'price-desc') {
    return [desc(flightPriceSql), asc(flightItineraries.durationMinutes), asc(flightItineraries.id)] as const
  }

  if (sort === 'duration') {
    return [asc(flightItineraries.durationMinutes), asc(flightPriceSql), asc(flightItineraries.id)] as const
  }

  if (sort === 'departure-asc') {
    return [asc(flightItineraries.departureMinutes), asc(flightPriceSql), asc(flightItineraries.id)] as const
  }

  return [asc(flightItineraries.stops), asc(flightItineraries.durationMinutes), asc(flightPriceSql), asc(flightItineraries.id)] as const
}

export async function searchFlightsPage(input: SearchFlightsInput): Promise<SearchFlightsResult> {
  const db = getDb()
  const originAirport = alias(airports, 'origin_airport')
  const destinationAirport = alias(airports, 'destination_airport')
  const conditions = buildSearchConditions(input, originAirport, destinationAirport)

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
      fareCode: flightFares.fareCode,
      priceCents: flightPriceSql,
      currencyCode: flightCurrencySql,
      refundable: flightFares.refundable,
      changeable: flightFares.changeable,
      checkedBagsIncluded: flightFares.checkedBagsIncluded,
      seatsRemaining: flightSeatsSql,
      freshnessTimestamp: flightFreshnessSql,
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

  const countRows = await db
    .select({
      count: sql<number>`count(distinct ${flightItineraries.id})::int`,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .leftJoin(
      flightFares,
      and(
        eq(flightFares.itineraryId, flightItineraries.id),
        eq(flightFares.fareCode, 'standard'),
        eq(flightFares.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(and(...conditions))

  return {
    rows,
    totalCount: countRows[0]?.count ?? 0,
  }
}

export async function searchFlights(input: SearchFlightsInput): Promise<FlightSearchRow[]> {
  const source = await searchFlightsPage(input)
  return source.rows
}

export async function listFlightSearchFacets(
  input: FlightSearchFacetsInput,
): Promise<FlightSearchFacets> {
  const db = getDb()
  const originAirport = alias(airports, 'origin_airport')
  const destinationAirport = alias(airports, 'destination_airport')
  const conditions = buildBaseConditions(input, originAirport, destinationAirport)

  const rows = await db
    .selectDistinct({
      departureWindow: flightItineraries.departureWindow,
      arrivalWindow: flightItineraries.arrivalWindow,
      cabinClass: flightItineraries.cabinClass,
      stops: flightItineraries.stops,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(originAirport, eq(flightRoutes.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightRoutes.destinationAirportId, destinationAirport.id))
    .where(and(...conditions))

  const departureWindows = toUnique(rows.map((row) => row.departureWindow)).sort(
    (a, b) => flightTimeWindowValues.indexOf(a) - flightTimeWindowValues.indexOf(b),
  )
  const arrivalWindows = toUnique(rows.map((row) => row.arrivalWindow)).sort(
    (a, b) => flightTimeWindowValues.indexOf(a) - flightTimeWindowValues.indexOf(b),
  )
  const cabinClasses = toUnique(rows.map((row) => row.cabinClass)).sort(
    (a, b) => flightCabinClassValues.indexOf(a) - flightCabinClassValues.indexOf(b),
  )
  const maxStops = toUnique(
    rows
      .map((row) => Number(row.stops))
      .filter((value): value is 0 | 1 | 2 => value === 0 || value === 1 || value === 2),
  ).sort((a, b) => a - b)

  return {
    departureWindows,
    arrivalWindows,
    cabinClasses,
    maxStops,
  }
}
