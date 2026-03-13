import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { ParsedFlightInventoryId } from '~/lib/inventory/inventory-id'
import type {
  ProviderRequestOptions,
  ProviderResolveInventoryRecordInput,
} from '~/lib/providers/providerAdapter'
import { searchFlightsPage, type FlightSearchRow } from '~/lib/repos/flights-repo.server'
import { getDb } from '~/lib/db/client.server'
import {
  airlines,
  airports,
  flightFares,
  flightItineraries,
  flightRoutes,
  flightSegments,
} from '~/lib/db/schema'
import type { FlightItineraryType, FlightSegmentSummary } from '~/types/flights/provider'
import {
  DEFAULT_FLIGHT_PROVIDER_RETRIES,
  DEFAULT_FLIGHT_PROVIDER_SEARCH_LIMIT,
  DEFAULT_FLIGHT_PROVIDER_TIMEOUT_MS,
  FLIGHT_PROVIDER_NAME,
} from './constants.ts'
import type { FlightProviderSearchRequest } from './mapFlightSearchParams.ts'

type FlightOfferRow = {
  id: number
  airlineName: string
  airlineCode: string | null
  itineraryType: FlightItineraryType
  flightNumber: string | null
  serviceDate: string
  originCode: string
  destinationCode: string
  departureAtUtc: Date | string
  arrivalAtUtc: Date | string
  stops: number
  durationMinutes: number
  cabinClass: string | null
  fareCode: string | null
  priceAmountCents: number
  currencyCode: string
  refundable: boolean | null
  changeable: boolean | null
  checkedBagsIncluded: number | null
  seatsRemaining: number | null
  freshnessTimestamp: Date | string | null
}

type FlightSegmentRow = {
  itineraryId: number
  segmentOrder: number
  airlineName: string
  airlineCode: string | null
  flightNumber: string | null
  originCode: string
  destinationCode: string
  departureAtUtc: Date | string
  arrivalAtUtc: Date | string
  durationMinutes: number
}

export type FlightProviderRawOffer = {
  itineraryId: number
  airlineName: string
  airlineCode: string | null
  itineraryType: FlightItineraryType
  serviceDate: string
  requestedServiceDate: string | null
  originCode: string
  destinationCode: string
  departureAt: string | null
  arrivalAt: string | null
  flightNumber: string | null
  stops: number
  durationMinutes: number
  cabinClass: string | null
  fareCode: string | null
  priceAmountCents: number
  currencyCode: string
  refundable: boolean | null
  changeable: boolean | null
  checkedBagsIncluded: number | null
  seatsRemaining: number | null
  freshnessTimestamp: string | null
  segments: FlightSegmentSummary[]
}

export type FlightProviderSearchResponse = {
  provider: string
  request: FlightProviderSearchRequest
  results: FlightProviderRawOffer[]
}

export type FlightProviderInventoryLookup = Pick<
  ProviderResolveInventoryRecordInput,
  'providerInventoryId'
> & {
  parsedInventory: ParsedFlightInventoryId
}

export type FlightProviderPriceResponse = {
  provider: string
  itineraryId: number
  currencyCode: string
  priceAmountCents: number
  refundable: boolean | null
  changeable: boolean | null
  checkedBagsIncluded: number | null
  seatsRemaining: number | null
}

export type FlightProviderClient = {
  search(
    request: FlightProviderSearchRequest,
    options?: ProviderRequestOptions,
  ): Promise<FlightProviderSearchResponse>
  resolveInventory(
    lookup: FlightProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<FlightProviderRawOffer | null>
  fetchPrice(
    lookup: FlightProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<FlightProviderPriceResponse | null>
}

export type FlightProviderClientErrorCode =
  | 'aborted'
  | 'timeout'
  | 'provider_failure'

export class FlightProviderClientError extends Error {
  code: FlightProviderClientErrorCode
  override cause?: unknown

  constructor(
    code: FlightProviderClientErrorCode,
    message: string,
    options?: {
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'FlightProviderClientError'
    this.code = code
    this.cause = options?.cause
  }
}

const toIsoTimestamp = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

const toFiniteInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const normalizeCurrencyCode = (value: unknown) => String(value || '').trim().toUpperCase()

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new FlightProviderClientError('aborted', 'Flight provider request was aborted.')
  }
}

const runWithTimeout = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let removeAbortListener: undefined | (() => void)

  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new FlightProviderClientError(
            'timeout',
            `Flight provider ${operationName} timed out after ${DEFAULT_FLIGHT_PROVIDER_TIMEOUT_MS}ms.`,
          ),
        )
      }, DEFAULT_FLIGHT_PROVIDER_TIMEOUT_MS)

      if (signal) {
        const abortHandler = () => {
          reject(
            new FlightProviderClientError('aborted', 'Flight provider request was aborted.'),
          )
        }

        signal.addEventListener('abort', abortHandler, { once: true })
        removeAbortListener = () => {
          signal.removeEventListener('abort', abortHandler)
        }
      }

      operation().then(resolve, reject)
    })
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    const abortCleanup = removeAbortListener
    if (typeof abortCleanup === 'function') {
      abortCleanup()
    }
  }
}

const runProviderOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: ProviderRequestOptions,
): Promise<T> => {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= DEFAULT_FLIGHT_PROVIDER_RETRIES; attempt += 1) {
    throwIfAborted(options?.signal)

    try {
      return await runWithTimeout(operationName, operation, options?.signal)
    } catch (error) {
      lastError = error
      if (
        error instanceof FlightProviderClientError &&
        (error.code === 'aborted' || error.code === 'timeout')
      ) {
        throw error
      }
    }
  }

  throw new FlightProviderClientError(
    'provider_failure',
    `Flight provider ${operationName} failed.`,
    {
      cause: lastError,
    },
  )
}

const toRawOffer = (
  row: FlightOfferRow,
  segments: FlightSegmentRow[],
  requestedServiceDate?: string | null,
): FlightProviderRawOffer => ({
  itineraryId: row.id,
  airlineName: row.airlineName,
  airlineCode: row.airlineCode,
  itineraryType: row.itineraryType,
  serviceDate: row.serviceDate,
  requestedServiceDate: requestedServiceDate || null,
  originCode: row.originCode,
  destinationCode: row.destinationCode,
  departureAt: toIsoTimestamp(row.departureAtUtc),
  arrivalAt: toIsoTimestamp(row.arrivalAtUtc),
  flightNumber: row.flightNumber,
  stops: Math.max(0, Number(row.stops || 0)),
  durationMinutes: Math.max(0, Number(row.durationMinutes || 0)),
  cabinClass: row.cabinClass,
  fareCode: row.fareCode,
  priceAmountCents: Math.max(0, Math.round(Number(row.priceAmountCents || 0))),
  currencyCode: normalizeCurrencyCode(row.currencyCode),
  refundable: row.refundable,
  changeable: row.changeable,
  checkedBagsIncluded: toFiniteInteger(row.checkedBagsIncluded),
  seatsRemaining: toFiniteInteger(row.seatsRemaining),
  freshnessTimestamp: toIsoTimestamp(row.freshnessTimestamp),
  segments: segments.map((segment) => ({
    segmentOrder: segment.segmentOrder,
    marketingCarrier: row.airlineName,
    marketingCarrierCode: row.airlineCode,
    operatingCarrier: segment.airlineName,
    operatingCarrierCode: segment.airlineCode,
    flightNumber: segment.flightNumber,
    originCode: segment.originCode,
    destinationCode: segment.destinationCode,
    departureAt: toIsoTimestamp(segment.departureAtUtc),
    arrivalAt: toIsoTimestamp(segment.arrivalAtUtc),
    durationMinutes: toFiniteInteger(segment.durationMinutes),
  })),
})

const loadOfferSegments = async (itineraryIds: number[]) => {
  if (!itineraryIds.length) {
    return new Map<number, FlightSegmentRow[]>()
  }

  const db = getDb()
  const segmentAirline = alias(airlines, 'flight_provider_segment_airline')
  const originAirport = alias(airports, 'flight_provider_segment_origin_airport')
  const destinationAirport = alias(airports, 'flight_provider_segment_destination_airport')

  const rows = await db
    .select({
      itineraryId: flightSegments.itineraryId,
      segmentOrder: flightSegments.segmentOrder,
      airlineName: segmentAirline.name,
      airlineCode: segmentAirline.iataCode,
      flightNumber: flightSegments.operatingFlightNumber,
      originCode: originAirport.iataCode,
      destinationCode: destinationAirport.iataCode,
      departureAtUtc: flightSegments.departureAtUtc,
      arrivalAtUtc: flightSegments.arrivalAtUtc,
      durationMinutes: flightSegments.durationMinutes,
    })
    .from(flightSegments)
    .innerJoin(segmentAirline, eq(flightSegments.airlineId, segmentAirline.id))
    .innerJoin(originAirport, eq(flightSegments.originAirportId, originAirport.id))
    .innerJoin(destinationAirport, eq(flightSegments.destinationAirportId, destinationAirport.id))
    .where(inArray(flightSegments.itineraryId, itineraryIds))
    .orderBy(asc(flightSegments.itineraryId), asc(flightSegments.segmentOrder))

  const grouped = new Map<number, FlightSegmentRow[]>()

  for (const itineraryId of itineraryIds) {
    grouped.set(itineraryId, [])
  }

  for (const row of rows) {
    const next = grouped.get(row.itineraryId) || []
    next.push(row)
    grouped.set(row.itineraryId, next)
  }

  return grouped
}

const mapSearchRowToOfferRow = (row: FlightSearchRow): FlightOfferRow => ({
  id: row.id,
  airlineName: row.airline,
  airlineCode: row.airlineCode,
  itineraryType: row.itineraryType,
  flightNumber: row.flightNumber,
  serviceDate: row.serviceDate,
  originCode: row.originIata,
  destinationCode: row.destinationIata,
  departureAtUtc: row.departureAtUtc,
  arrivalAtUtc: row.arrivalAtUtc,
  stops: Number(row.stops),
  durationMinutes: Number(row.durationMinutes),
  cabinClass: row.cabinClass,
  fareCode: row.fareCode,
  priceAmountCents: row.priceCents,
  currencyCode: row.currencyCode,
  refundable: row.refundable,
  changeable: row.changeable,
  checkedBagsIncluded: row.checkedBagsIncluded,
  seatsRemaining: row.seatsRemaining,
  freshnessTimestamp: row.freshnessTimestamp,
})

const loadOfferRowByProviderInventoryId = async (itineraryId: number) => {
  const db = getDb()
  const primarySegment = alias(flightSegments, 'flight_provider_primary_segment_by_id')
  const originAirport = alias(airports, 'flight_provider_origin_airport_by_id')
  const destinationAirport = alias(airports, 'flight_provider_destination_airport_by_id')
  const standardFare = alias(flightFares, 'flight_provider_standard_fare_by_id')

  const rows = await db
    .select({
      id: flightItineraries.id,
      airlineName: airlines.name,
      airlineCode: airlines.iataCode,
      itineraryType: flightItineraries.itineraryType,
      flightNumber: primarySegment.operatingFlightNumber,
      serviceDate: flightItineraries.serviceDate,
      originCode: originAirport.iataCode,
      destinationCode: destinationAirport.iataCode,
      departureAtUtc: flightItineraries.departureAtUtc,
      arrivalAtUtc: flightItineraries.arrivalAtUtc,
      stops: flightItineraries.stops,
      durationMinutes: flightItineraries.durationMinutes,
      cabinClass: flightItineraries.cabinClass,
      fareCode: standardFare.fareCode,
      priceAmountCents:
        sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currencyCode:
        sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      refundable: standardFare.refundable,
      changeable: standardFare.changeable,
      checkedBagsIncluded: standardFare.checkedBagsIncluded,
      seatsRemaining:
        sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
      freshnessTimestamp:
        sql<Date | null>`coalesce(${standardFare.updatedAt}, ${flightItineraries.updatedAt})`,
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

const loadOfferRowByCanonical = async (parsedInventory: ParsedFlightInventoryId) => {
  const db = getDb()
  const primarySegment = alias(flightSegments, 'flight_provider_primary_segment_by_canonical')
  const originAirport = alias(airports, 'flight_provider_origin_airport_by_canonical')
  const destinationAirport = alias(airports, 'flight_provider_destination_airport_by_canonical')
  const standardFare = alias(flightFares, 'flight_provider_standard_fare_by_canonical')

  const rows = await db
    .select({
      id: flightItineraries.id,
      airlineName: airlines.name,
      airlineCode: airlines.iataCode,
      itineraryType: flightItineraries.itineraryType,
      flightNumber: primarySegment.operatingFlightNumber,
      serviceDate: flightItineraries.serviceDate,
      originCode: originAirport.iataCode,
      destinationCode: destinationAirport.iataCode,
      departureAtUtc: flightItineraries.departureAtUtc,
      arrivalAtUtc: flightItineraries.arrivalAtUtc,
      stops: flightItineraries.stops,
      durationMinutes: flightItineraries.durationMinutes,
      cabinClass: flightItineraries.cabinClass,
      fareCode: standardFare.fareCode,
      priceAmountCents:
        sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currencyCode:
        sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      refundable: standardFare.refundable,
      changeable: standardFare.changeable,
      checkedBagsIncluded: standardFare.checkedBagsIncluded,
      seatsRemaining:
        sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
      freshnessTimestamp:
        sql<Date | null>`coalesce(${standardFare.updatedAt}, ${flightItineraries.updatedAt})`,
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
        eq(flightItineraries.serviceDate, parsedInventory.departDate),
        eq(airlines.iataCode, parsedInventory.airlineCode),
        eq(originAirport.iataCode, parsedInventory.originCode),
        eq(destinationAirport.iataCode, parsedInventory.destinationCode),
        eq(primarySegment.operatingFlightNumber, parsedInventory.flightNumber),
      ),
    )
    .orderBy(asc(flightItineraries.id))
    .limit(1)

  return rows[0] || null
}

const loadOfferByLookup = async (lookup: FlightProviderInventoryLookup) => {
  const offerRow =
    lookup.providerInventoryId != null
      ? await loadOfferRowByProviderInventoryId(lookup.providerInventoryId)
      : null

  const matchedRow = offerRow || (await loadOfferRowByCanonical(lookup.parsedInventory))
  if (!matchedRow) return null

  const segmentsByItinerary = await loadOfferSegments([matchedRow.id])
  return toRawOffer(
    matchedRow,
    segmentsByItinerary.get(matchedRow.id) || [],
    lookup.parsedInventory.departDate,
  )
}

export const createFlightProviderClient = (): FlightProviderClient => ({
  async search(request, options) {
    return runProviderOperation(
      'search',
      async () => {
        const searchInput = {
          originIata: request.originIata,
          destinationIata: request.destinationIata,
          itineraryType: request.itineraryType,
          serviceDate: request.departDate || undefined,
          sort: 'recommended' as const,
          limit: DEFAULT_FLIGHT_PROVIDER_SEARCH_LIMIT,
          offset: 0,
        }

        let response = await searchFlightsPage(searchInput)
        if (!response.totalCount && request.departDate) {
          response = await searchFlightsPage({
            ...searchInput,
            serviceDate: undefined,
          })
        }

        const offerRows = response.rows.map(mapSearchRowToOfferRow)
        const itineraryIds = offerRows.map((row) => row.id)
        const segmentsByItinerary = await loadOfferSegments(itineraryIds)

        return {
          provider: FLIGHT_PROVIDER_NAME,
          request,
          results: offerRows.map((row) =>
            toRawOffer(
              row,
              segmentsByItinerary.get(row.id) || [],
              request.departDate || null,
            ),
          ),
        }
      },
      options,
    )
  },

  async resolveInventory(lookup, options) {
    return runProviderOperation('resolveInventory', () => loadOfferByLookup(lookup), options)
  },

  async fetchPrice(lookup, options) {
    return runProviderOperation(
      'fetchPrice',
      async () => {
        const offer = await loadOfferByLookup(lookup)
        if (!offer) return null

        return {
          provider: FLIGHT_PROVIDER_NAME,
          itineraryId: offer.itineraryId,
          currencyCode: offer.currencyCode,
          priceAmountCents: offer.priceAmountCents,
          refundable: offer.refundable,
          changeable: offer.changeable,
          checkedBagsIncluded: offer.checkedBagsIncluded,
          seatsRemaining: offer.seatsRemaining,
        }
      },
      options,
    )
  },
})

export const defaultFlightProviderClient = createFlightProviderClient()
