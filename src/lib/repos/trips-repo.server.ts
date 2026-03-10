import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '~/lib/db/client.server'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import {
  airlines,
  carInventory,
  carLocations,
  carProviders,
  cities,
  flightFares,
  flightItineraries,
  flightRoutes,
  hotelAvailabilitySnapshots,
  hotels,
  tripDates,
  tripItems,
  trips,
} from '~/lib/db/schema'
import {
  applyPriceDriftToAvailabilityStatus,
  isStoredTripItemAvailabilityFresh,
  readStoredTripItemAvailability,
  validateTripItemAvailability,
  writeStoredTripItemAvailability,
  type TripItemAvailabilityValidationResult,
} from '~/lib/trips/availability-validation'
import {
  validateTripItineraryCoherence,
  type TripItineraryValidationItem,
} from '~/lib/trips/itinerary-coherence'
import { bundlingSuggestionService } from '~/lib/trips/bundling-suggestion-service.server'
import { buildTripIntelligenceSummary } from '~/lib/trips/status-aggregation'
import type { TripGapAnalyzerItem } from '~/lib/trips/trip-gap-analyzer'
import {
  TRIP_ITEM_TYPES,
  type TripBundlingSummary,
  type TripDetails,
  type TripIntelligenceSummary,
  type TripItem,
  type TripItemCandidate,
  type TripItemType,
  type TripItemValidityStatus,
  type TripListItem,
  type TripPriceDriftStatus,
  type TripPricingSummary,
  type TripStatus,
  type TripValidationIssue,
  type TripVerticalPricing,
} from '~/types/trips/trip'

export class TripRepoError extends Error {
  constructor(
    readonly code:
      | 'trip_not_found'
      | 'trip_item_not_found'
      | 'inventory_not_found'
      | 'invalid_reorder'
      | 'trip_schema_missing'
      | 'trip_runtime_stale',
    message: string,
  ) {
    super(message)
    this.name = 'TripRepoError'
  }
}

type CreateTripInput = {
  name?: string
  status?: TripStatus
  notes?: string | null
  metadata?: Record<string, unknown>
  startDate?: string | null
  endDate?: string | null
}

type UpdateTripMetadataInput = {
  name?: string
  status?: TripStatus
  notes?: string | null
  metadata?: Record<string, unknown>
  startDate?: string | null
  endDate?: string | null
  dateSource?: 'auto' | 'manual'
}

type ResolvedTripItemSnapshot = {
  itemType: TripItemType
  hotelId: number | null
  flightItineraryId: number | null
  carInventoryId: number | null
  startCityId: number | null
  endCityId: number | null
  startDate: string | null
  endDate: string | null
  snapshotPriceCents: number
  snapshotCurrencyCode: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  meta: string[]
  metadata: Record<string, unknown>
}

type TripItemRecord = {
  id: number
  tripId: number
  itemType: TripItemType
  position: number
  title: string
  subtitle: string | null
  startDate: string | null
  endDate: string | null
  snapshotPriceCents: number
  snapshotCurrencyCode: string
  snapshotTimestamp: string
  currentPriceCents: number | null
  currentCurrencyCode: string | null
  priceDriftStatus: TripPriceDriftStatus
  priceDriftCents: number | null
  imageUrl: string | null
  meta: string[]
  metadata: Record<string, unknown>
  hotelId: number | null
  flightItineraryId: number | null
  carInventoryId: number | null
  startCityId: number | null
  endCityId: number | null
  startCityName: string | null
  endCityName: string | null
  liveHotelExists: boolean
  liveCarExists: boolean
  liveFlightExists: boolean
  liveCarAvailabilityStart: string | null
  liveCarAvailabilityEnd: string | null
  liveCarMinDays: number | null
  liveCarMaxDays: number | null
  liveCarBlockedWeekdays: number[]
  liveCarLocationType: 'airport' | 'city' | null
  liveCarLocationName: string | null
  liveFlightServiceDate: string | null
  liveFlightDepartureAt: string | null
  liveFlightArrivalAt: string | null
  liveFlightSeatsRemaining: number | null
  liveFlightItineraryType: 'one-way' | 'round-trip' | null
  createdAt: string
  updatedAt: string
}

const DEFAULT_TRIP_NAME = 'Untitled trip'
const DEFAULT_CURRENCY = 'USD'
const LATEST_TRIP_MIGRATION = '0003_trip_price_snapshots.sql'

const TRIP_SCHEMA_IDENTIFIERS = [
  'trip_items',
  'trip_dates',
  'trips',
  'snapshot_price_cents',
  'snapshot_currency_code',
  'snapshot_timestamp',
  'prevent_trip_item_snapshot_updates',
] as const

const isMissingTripSchemaError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const source = error as {
    code?: string
    cause?: {
      code?: string
      message?: string
    }
    message?: string
  }

  const code = source.code || source.cause?.code
  if (code === '42P01' || code === '3F000' || code === '42704' || code === '42703') return true

  const message = String(source.message || source.cause?.message || '').toLowerCase()
  if (!message) return false

  const missingSchemaObject =
    message.includes('does not exist') ||
    message.includes('undefined column') ||
    message.includes('undefined function')

  return missingSchemaObject && TRIP_SCHEMA_IDENTIFIERS.some((identifier) => message.includes(identifier))
}

const withTripSchemaGuard = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    if (isMissingTripSchemaError(error)) {
      throw new TripRepoError(
        'trip_schema_missing',
        `Trip schema is not available or is outdated in Postgres. Apply migrations through ${LATEST_TRIP_MIGRATION}.`,
      )
    }

    throw error
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toIsoTimestamp = (value: Date | string | null | undefined) => {
  const date =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : new Date()

  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const toOptionalIsoTimestamp = (value: Date | string | null | undefined) => {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const toIsoDate = (value: string | null | undefined): string | null => {
  if (value == null) return null
  const text = String(value).trim()
  if (!text) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const normalizeTripName = (value: string | null | undefined) => {
  const text = String(value || '').trim()
  return text ? text.slice(0, 180) : DEFAULT_TRIP_NAME
}

const normalizeCurrencyCode = (value: string | null | undefined) => {
  const token = String(value || '')
    .trim()
    .toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : DEFAULT_CURRENCY
}

const toComparableCurrencyCode = (value: string | null | undefined) => {
  const token = String(value || '')
    .trim()
    .toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : null
}

const normalizePriceCents = (value: number | null | undefined, fallback: number) => {
  if (!Number.isFinite(value)) return Math.max(0, Math.round(fallback))
  return Math.max(0, Math.round(Number(value)))
}

const normalizeMeta = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .slice(0, 8)
}

const normalizeMetadata = (value: unknown): Record<string, unknown> => {
  return isRecord(value) ? value : {}
}

const toIntList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry))
    .map((entry) => Math.round(entry))
}

const normalizeTripStatus = (value: unknown): TripStatus => {
  if (value === 'planning') return 'planning'
  if (value === 'ready') return 'ready'
  if (value === 'archived') return 'archived'
  return 'draft'
}

const requireTripSchemaValue = <T>(value: T | null | undefined, label: string): T => {
  if (value == null) {
    throw new TripRepoError(
      'trip_runtime_stale',
      `Trip runtime is stale. Reload the server so "${label}" is available before using snapshot pricing.`,
    )
  }

  return value
}

const requireTripSnapshotColumns = () => ({
  snapshotPriceCents: requireTripSchemaValue(
    tripItems.snapshotPriceCents,
    'tripItems.snapshotPriceCents',
  ),
  snapshotCurrencyCode: requireTripSchemaValue(
    tripItems.snapshotCurrencyCode,
    'tripItems.snapshotCurrencyCode',
  ),
  snapshotTimestamp: requireTripSchemaValue(
    tripItems.snapshotTimestamp,
    'tripItems.snapshotTimestamp',
  ),
})

const titleCaseToken = (value: string) => {
  return String(value || '')
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const createDriftCounts = (): Record<TripPriceDriftStatus, number> => ({
  increased: 0,
  decreased: 0,
  unchanged: 0,
  unavailable: 0,
})

const resolveComparableCurrentPrice = (
  snapshotCurrencyCode: string,
  currentPriceCents: number | null,
  currentCurrencyCode: string | null,
) => {
  if (currentPriceCents == null) return null

  const snapshotCurrency = normalizeCurrencyCode(snapshotCurrencyCode)
  const currentCurrency = toComparableCurrencyCode(currentCurrencyCode)
  if (!currentCurrency || currentCurrency !== snapshotCurrency) return null

  return {
    amountCents: normalizePriceCents(currentPriceCents, currentPriceCents),
    currencyCode: currentCurrency,
  }
}

const getPriceDriftStatus = (
  snapshotPriceCents: number,
  snapshotCurrencyCode: string,
  currentPriceCents: number | null,
  currentCurrencyCode: string | null,
): TripPriceDriftStatus => {
  const comparable = resolveComparableCurrentPrice(
    snapshotCurrencyCode,
    currentPriceCents,
    currentCurrencyCode,
  )

  if (!comparable) return 'unavailable'
  if (comparable.amountCents > snapshotPriceCents) return 'increased'
  if (comparable.amountCents < snapshotPriceCents) return 'decreased'
  return 'unchanged'
}

const getPriceDriftCents = (
  snapshotPriceCents: number,
  snapshotCurrencyCode: string,
  currentPriceCents: number | null,
  currentCurrencyCode: string | null,
) => {
  const comparable = resolveComparableCurrentPrice(
    snapshotCurrencyCode,
    currentPriceCents,
    currentCurrencyCode,
  )

  return comparable ? comparable.amountCents - snapshotPriceCents : null
}

const summarizePricingGroup = (items: TripItem[]) => {
  if (!items.length) {
    return {
      currencyCode: DEFAULT_CURRENCY,
      snapshotTotalCents: 0,
      currentTotalCents: 0,
      priceDeltaCents: 0,
      hasMixedCurrencies: false,
    }
  }

  const snapshotCurrencies = Array.from(
    new Set(items.map((item) => normalizeCurrencyCode(item.snapshotCurrencyCode))),
  )
  const hasMixedCurrencies = snapshotCurrencies.length > 1
  const currencyCode = hasMixedCurrencies ? null : (snapshotCurrencies[0] || DEFAULT_CURRENCY)
  const snapshotTotalCents = hasMixedCurrencies
    ? null
    : items.reduce((sum, item) => sum + item.snapshotPriceCents, 0)

  const currentTotalCents =
    hasMixedCurrencies || !currencyCode
      ? null
      : items.every(
            (item) =>
              item.currentPriceCents != null &&
              toComparableCurrencyCode(item.currentCurrencyCode) === currencyCode,
          )
        ? items.reduce(
            (sum, item) => sum + normalizePriceCents(item.currentPriceCents, 0),
            0,
          )
        : null

  return {
    currencyCode,
    snapshotTotalCents,
    currentTotalCents,
    priceDeltaCents:
      snapshotTotalCents != null && currentTotalCents != null
        ? currentTotalCents - snapshotTotalCents
        : null,
    hasMixedCurrencies,
  }
}

const buildTripPricingSummary = (items: TripItem[]): TripPricingSummary => {
  const driftCounts = createDriftCounts()
  for (const item of items) {
    driftCounts[item.priceDriftStatus] += 1
  }

  const verticals: TripVerticalPricing[] = TRIP_ITEM_TYPES.map((itemType) => {
    const verticalItems = items.filter((item) => item.itemType === itemType)
    const totals = summarizePricingGroup(verticalItems)

    return {
      itemType,
      itemCount: verticalItems.length,
      currencyCode: verticalsCurrencyCode(totals.currencyCode, verticalItems),
      snapshotSubtotalCents: totals.snapshotTotalCents,
      currentSubtotalCents: totals.currentTotalCents,
      priceDeltaCents: totals.priceDeltaCents,
      hasMixedCurrencies: totals.hasMixedCurrencies,
    }
  }).filter((vertical) => vertical.itemCount > 0)

  const totals = summarizePricingGroup(items)

  return {
    currencyCode: totals.currencyCode,
    snapshotTotalCents: totals.snapshotTotalCents,
    currentTotalCents: totals.currentTotalCents,
    priceDeltaCents: totals.priceDeltaCents,
    hasMixedCurrencies: totals.hasMixedCurrencies,
    driftCounts,
    verticals,
  }
}

const verticalsCurrencyCode = (currencyCode: string | null, items: TripItem[]) => {
  if (currencyCode) return currencyCode
  return items.length ? normalizeCurrencyCode(items[0].snapshotCurrencyCode) : DEFAULT_CURRENCY
}

const toListItem = (input: {
  id: number
  name: string
  status: TripStatus
  startDate: string | null
  endDate: string | null
  itemCount: number
  estimatedTotalCents: number
  currencyCode: string
  hasMixedCurrencies: boolean
  updatedAt: Date | string
}): TripListItem => ({
  id: input.id,
  name: input.name,
  status: input.status,
  startDate: input.startDate,
  endDate: input.endDate,
  itemCount: input.itemCount,
  estimatedTotalCents: input.estimatedTotalCents,
  currencyCode: normalizeCurrencyCode(input.currencyCode),
  hasMixedCurrencies: input.hasMixedCurrencies,
  updatedAt: toIsoTimestamp(input.updatedAt),
})

const ensureTripDatesRow = async (tx: any, tripId: number) => {
  const existing = await tx
    .select({
      tripId: tripDates.tripId,
    })
    .from(tripDates)
    .where(eq(tripDates.tripId, tripId))
    .limit(1)

  if (existing.length) return

  await tx.insert(tripDates).values({
    tripId,
    source: 'auto',
    startDate: null,
    endDate: null,
  })
}

const assertTripExists = async (tx: any, tripId: number) => {
  const rows = await tx
    .select({ id: trips.id })
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1)

  if (!rows.length) {
    throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found.`)
  }
}

const syncTripDatesIfAuto = async (tx: any, tripId: number) => {
  await ensureTripDatesRow(tx, tripId)

  const [dateRow] = await tx
    .select({
      source: tripDates.source,
    })
    .from(tripDates)
    .where(eq(tripDates.tripId, tripId))
    .limit(1)

  if (!dateRow || dateRow.source === 'manual') return

  const [span] = await tx
    .select({
      startDate: sql<string | null>`min(${tripItems.startDate})`,
      endDate: sql<string | null>`max(${tripItems.endDate})`,
    })
    .from(tripItems)
    .where(eq(tripItems.tripId, tripId))

  await tx
    .update(tripDates)
    .set({
      source: 'auto',
      startDate: span?.startDate || null,
      endDate: span?.endDate || null,
      updatedAt: new Date(),
    })
    .where(eq(tripDates.tripId, tripId))
}

const normalizeTripItemPositions = async (tx: any, tripId: number) => {
  const rows = await tx
    .select({ id: tripItems.id })
    .from(tripItems)
    .where(eq(tripItems.tripId, tripId))
    .orderBy(asc(tripItems.position), asc(tripItems.id))

  for (const [index, row] of rows.entries()) {
    await tx
      .update(tripItems)
      .set({
        position: index,
        updatedAt: new Date(),
      })
      .where(eq(tripItems.id, row.id))
  }
}

const touchTrip = async (tx: any, tripId: number) => {
  await tx
    .update(trips)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(trips.id, tripId))
}

const resolveHotelTripItem = async (
  tx: any,
  candidate: TripItemCandidate,
): Promise<ResolvedTripItemSnapshot> => {
  const rows = await tx
    .select({
      id: hotels.id,
      name: hotels.name,
      neighborhood: hotels.neighborhood,
      cityId: cities.id,
      cityName: cities.name,
      currencyCode: hotels.currencyCode,
      priceCents: hotels.fromNightlyCents,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .where(eq(hotels.id, candidate.inventoryId))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TripRepoError(
      'inventory_not_found',
      `Hotel inventory ${candidate.inventoryId} was not found.`,
    )
  }

  const startDate = toIsoDate(candidate.startDate)
  const endDate = toIsoDate(candidate.endDate)
  const fallbackSubtitle = `${row.neighborhood} · ${row.cityName}`

  return {
    itemType: 'hotel',
    hotelId: row.id,
    flightItineraryId: null,
    carInventoryId: null,
    startCityId: row.cityId,
    endCityId: row.cityId,
    startDate,
    endDate,
    snapshotPriceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    snapshotCurrencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.name,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizeMeta(candidate.meta),
    metadata: normalizeMetadata(candidate.metadata),
  }
}

const resolveCarTripItem = async (
  tx: any,
  candidate: TripItemCandidate,
): Promise<ResolvedTripItemSnapshot> => {
  const rows = await tx
    .select({
      id: carInventory.id,
      cityId: cities.id,
      cityName: cities.name,
      providerName: carProviders.name,
      locationName: carLocations.name,
      currencyCode: carInventory.currencyCode,
      priceCents: carInventory.fromDailyCents,
    })
    .from(carInventory)
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .where(eq(carInventory.id, candidate.inventoryId))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TripRepoError(
      'inventory_not_found',
      `Car inventory ${candidate.inventoryId} was not found.`,
    )
  }

  const startDate = toIsoDate(candidate.startDate)
  const endDate = toIsoDate(candidate.endDate)
  const fallbackSubtitle = `${row.locationName} · ${row.cityName}`

  return {
    itemType: 'car',
    hotelId: null,
    flightItineraryId: null,
    carInventoryId: row.id,
    startCityId: row.cityId,
    endCityId: row.cityId,
    startDate,
    endDate,
    snapshotPriceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    snapshotCurrencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.providerName,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizeMeta(candidate.meta),
    metadata: normalizeMetadata(candidate.metadata),
  }
}

const resolveFlightTripItem = async (
  tx: any,
  candidate: TripItemCandidate,
): Promise<ResolvedTripItemSnapshot> => {
  const originCity = alias(cities, 'trip_origin_city')
  const destinationCity = alias(cities, 'trip_destination_city')
  const standardFare = alias(flightFares, 'trip_snapshot_standard_fare')

  const rows = await tx
    .select({
      id: flightItineraries.id,
      serviceDate: flightItineraries.serviceDate,
      currencyCode: sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      priceCents: sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      stopsLabel: flightItineraries.stopsLabel,
      cabinClass: flightItineraries.cabinClass,
      airlineName: airlines.name,
      originCityId: originCity.id,
      originCityName: originCity.name,
      destinationCityId: destinationCity.id,
      destinationCityName: destinationCity.name,
    })
    .from(flightItineraries)
    .innerJoin(flightRoutes, eq(flightItineraries.routeId, flightRoutes.id))
    .innerJoin(airlines, eq(flightItineraries.airlineId, airlines.id))
    .innerJoin(originCity, eq(flightRoutes.originCityId, originCity.id))
    .innerJoin(destinationCity, eq(flightRoutes.destinationCityId, destinationCity.id))
    .leftJoin(
      standardFare,
      and(
        eq(standardFare.itineraryId, flightItineraries.id),
        eq(standardFare.fareCode, 'standard'),
        eq(standardFare.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(eq(flightItineraries.id, candidate.inventoryId))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TripRepoError(
      'inventory_not_found',
      `Flight itinerary ${candidate.inventoryId} was not found.`,
    )
  }

  const serviceDate = toIsoDate(row.serviceDate)
  const fallbackSubtitle = `${row.originCityName} → ${row.destinationCityName}`
  const normalizedMeta = normalizeMeta(candidate.meta)
  const fallbackMeta = [row.stopsLabel, titleCaseToken(row.cabinClass)]

  return {
    itemType: 'flight',
    hotelId: null,
    flightItineraryId: row.id,
    carInventoryId: null,
    startCityId: row.originCityId,
    endCityId: row.destinationCityId,
    // Flight inventory is bound to a single service date. Persist the actual
    // itinerary date instead of the search request date so revalidation can
    // compare like-for-like.
    startDate: serviceDate,
    endDate: serviceDate,
    snapshotPriceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    snapshotCurrencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.airlineName,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizedMeta.length ? normalizedMeta : fallbackMeta,
    metadata: normalizeMetadata(candidate.metadata),
  }
}

const resolveTripItemSnapshot = async (tx: any, candidate: TripItemCandidate) => {
  if (candidate.itemType === 'hotel') return resolveHotelTripItem(tx, candidate)
  if (candidate.itemType === 'car') return resolveCarTripItem(tx, candidate)
  return resolveFlightTripItem(tx, candidate)
}

const readTripBase = async (tripId: number) => {
  const db = getDb()
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      status: trips.status,
      notes: trips.notes,
      metadata: trips.metadata,
      startDate: tripDates.startDate,
      endDate: tripDates.endDate,
      updatedAt: trips.updatedAt,
    })
    .from(trips)
    .leftJoin(tripDates, eq(tripDates.tripId, trips.id))
    .where(eq(trips.id, tripId))
    .limit(1)

  return rows[0] || null
}

const readTripItems = async (tripId: number): Promise<TripItemRecord[]> => {
  const db = getDb()
  const startCity = alias(cities, 'trip_items_start_city')
  const endCity = alias(cities, 'trip_items_end_city')
  const standardFare = alias(flightFares, 'trip_items_standard_fare')
  const snapshotColumns = requireTripSnapshotColumns()

  const rows = await db
    .select({
      id: tripItems.id,
      tripId: tripItems.tripId,
      itemType: tripItems.itemType,
      position: tripItems.position,
      title: tripItems.title,
      subtitle: tripItems.subtitle,
      startCityId: tripItems.startCityId,
      endCityId: tripItems.endCityId,
      startDate: tripItems.startDate,
      endDate: tripItems.endDate,
      snapshotPriceCents: snapshotColumns.snapshotPriceCents,
      snapshotCurrencyCode: snapshotColumns.snapshotCurrencyCode,
      snapshotTimestamp: snapshotColumns.snapshotTimestamp,
      imageUrl: tripItems.imageUrl,
      meta: tripItems.meta,
      metadata: tripItems.metadata,
      hotelId: tripItems.hotelId,
      flightItineraryId: tripItems.flightItineraryId,
      carInventoryId: tripItems.carInventoryId,
      startCityName: startCity.name,
      endCityName: endCity.name,
      liveHotelId: hotels.id,
      currentHotelPriceCents: hotels.fromNightlyCents,
      currentHotelCurrencyCode: hotels.currencyCode,
      liveCarId: carInventory.id,
      currentCarPriceCents: carInventory.fromDailyCents,
      currentCarCurrencyCode: carInventory.currencyCode,
      liveCarAvailabilityStart: carInventory.availabilityStart,
      liveCarAvailabilityEnd: carInventory.availabilityEnd,
      liveCarMinDays: carInventory.minDays,
      liveCarMaxDays: carInventory.maxDays,
      liveCarBlockedWeekdays: carInventory.blockedWeekdays,
      liveCarLocationType: carLocations.locationType,
      liveCarLocationName: carLocations.name,
      liveFlightId: flightItineraries.id,
      currentFlightPriceCents:
        sql<number | null>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currentFlightCurrencyCode:
        sql<string | null>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      liveFlightServiceDate: flightItineraries.serviceDate,
      liveFlightDepartureAt: flightItineraries.departureAtUtc,
      liveFlightArrivalAt: flightItineraries.arrivalAtUtc,
      liveFlightSeatsRemaining:
        sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
      liveFlightItineraryType: flightItineraries.itineraryType,
      createdAt: tripItems.createdAt,
      updatedAt: tripItems.updatedAt,
    })
    .from(tripItems)
    .leftJoin(startCity, eq(tripItems.startCityId, startCity.id))
    .leftJoin(endCity, eq(tripItems.endCityId, endCity.id))
    .leftJoin(hotels, eq(tripItems.hotelId, hotels.id))
    .leftJoin(carInventory, eq(tripItems.carInventoryId, carInventory.id))
    .leftJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .leftJoin(flightItineraries, eq(tripItems.flightItineraryId, flightItineraries.id))
    .leftJoin(
      standardFare,
      and(
        eq(standardFare.itineraryId, flightItineraries.id),
        eq(standardFare.fareCode, 'standard'),
        eq(standardFare.cabinClass, flightItineraries.cabinClass),
      ),
    )
    .where(eq(tripItems.tripId, tripId))
    .orderBy(asc(tripItems.position), asc(tripItems.id))

  return rows.map((row) => {
    const currentPriceCents =
      row.itemType === 'hotel'
        ? row.currentHotelPriceCents
        : row.itemType === 'car'
          ? row.currentCarPriceCents
          : row.currentFlightPriceCents

    const currentCurrencyCode =
      row.itemType === 'hotel'
        ? row.currentHotelCurrencyCode
        : row.itemType === 'car'
          ? row.currentCarCurrencyCode
          : row.currentFlightCurrencyCode

    const snapshotCurrencyCode = normalizeCurrencyCode(row.snapshotCurrencyCode)
    const normalizedCurrentCurrencyCode = toComparableCurrencyCode(currentCurrencyCode)

    return {
      id: row.id,
      tripId: row.tripId,
      itemType: row.itemType,
      position: row.position,
      title: row.title,
      subtitle: row.subtitle,
      startCityId: row.startCityId,
      endCityId: row.endCityId,
      startDate: row.startDate,
      endDate: row.endDate,
      snapshotPriceCents: normalizePriceCents(row.snapshotPriceCents, 0),
      snapshotCurrencyCode: snapshotCurrencyCode,
      snapshotTimestamp: toIsoTimestamp(row.snapshotTimestamp),
      currentPriceCents:
        currentPriceCents == null ? null : normalizePriceCents(currentPriceCents, currentPriceCents),
      currentCurrencyCode: normalizedCurrentCurrencyCode,
      priceDriftStatus: getPriceDriftStatus(
        row.snapshotPriceCents,
        snapshotCurrencyCode,
        currentPriceCents,
        normalizedCurrentCurrencyCode,
      ),
      priceDriftCents: getPriceDriftCents(
        row.snapshotPriceCents,
        snapshotCurrencyCode,
        currentPriceCents,
        normalizedCurrentCurrencyCode,
      ),
      imageUrl: row.imageUrl,
      meta: normalizeMeta(row.meta),
      metadata: normalizeMetadata(row.metadata),
      hotelId: row.hotelId,
      flightItineraryId: row.flightItineraryId,
      carInventoryId: row.carInventoryId,
      startCityName: row.startCityName,
      endCityName: row.endCityName,
      liveHotelExists: row.liveHotelId != null,
      liveCarExists: row.liveCarId != null,
      liveFlightExists: row.liveFlightId != null,
      liveCarAvailabilityStart: row.liveCarAvailabilityStart,
      liveCarAvailabilityEnd: row.liveCarAvailabilityEnd,
      liveCarMinDays: row.liveCarMinDays,
      liveCarMaxDays: row.liveCarMaxDays,
      liveCarBlockedWeekdays: toIntList(row.liveCarBlockedWeekdays),
      liveCarLocationType:
        row.liveCarLocationType === 'airport' || row.liveCarLocationType === 'city'
          ? row.liveCarLocationType
          : null,
      liveCarLocationName: row.liveCarLocationName,
      liveFlightServiceDate: row.liveFlightServiceDate,
      liveFlightDepartureAt: toOptionalIsoTimestamp(row.liveFlightDepartureAt),
      liveFlightArrivalAt: toOptionalIsoTimestamp(row.liveFlightArrivalAt),
      liveFlightSeatsRemaining:
        row.liveFlightSeatsRemaining == null
          ? null
          : Math.max(0, Math.round(Number(row.liveFlightSeatsRemaining))),
      liveFlightItineraryType:
        row.liveFlightItineraryType === 'round-trip' || row.liveFlightItineraryType === 'one-way'
          ? row.liveFlightItineraryType
          : null,
      createdAt: toIsoTimestamp(row.createdAt),
      updatedAt: toIsoTimestamp(row.updatedAt),
    }
  })
}

const dedupeIssues = (issues: TripValidationIssue[]) => {
  const seen = new Set<string>()
  const next: TripValidationIssue[] = []

  for (const issue of issues) {
    const key = [
      issue.code,
      issue.scope,
      issue.severity,
      issue.message,
      issue.itemId || '',
      (issue.relatedItemIds || []).join(','),
    ].join('|')

    if (seen.has(key)) continue
    seen.add(key)
    next.push(issue)
  }

  return next
}

const isLiveInventoryPresent = (item: TripItemRecord) => {
  if (item.itemType === 'hotel') return item.liveHotelExists
  if (item.itemType === 'car') return item.liveCarExists
  return item.liveFlightExists
}

const readLatestHotelAvailabilitySnapshots = async (hotelIds: number[]) => {
  const ids = Array.from(new Set(hotelIds.filter((hotelId) => hotelId > 0)))
  if (!ids.length) {
    return new Map<
      number,
      {
        checkInStart: string
        checkInEnd: string
        minNights: number
        maxNights: number
        blockedWeekdays: number[]
      }
    >()
  }

  const db = getDb()
  const rows = await db
    .select({
      hotelId: hotelAvailabilitySnapshots.hotelId,
      checkInStart: hotelAvailabilitySnapshots.checkInStart,
      checkInEnd: hotelAvailabilitySnapshots.checkInEnd,
      minNights: hotelAvailabilitySnapshots.minNights,
      maxNights: hotelAvailabilitySnapshots.maxNights,
      blockedWeekdays: hotelAvailabilitySnapshots.blockedWeekdays,
      snapshotAt: hotelAvailabilitySnapshots.snapshotAt,
    })
    .from(hotelAvailabilitySnapshots)
    .where(inArray(hotelAvailabilitySnapshots.hotelId, ids))
    .orderBy(desc(hotelAvailabilitySnapshots.snapshotAt), desc(hotelAvailabilitySnapshots.id))

  const snapshots = new Map<
    number,
    {
      checkInStart: string
      checkInEnd: string
      minNights: number
      maxNights: number
      blockedWeekdays: number[]
    }
  >()

  for (const row of rows) {
    if (snapshots.has(row.hotelId)) continue

    snapshots.set(row.hotelId, {
      checkInStart: row.checkInStart,
      checkInEnd: row.checkInEnd,
      minNights: row.minNights,
      maxNights: row.maxNights,
      blockedWeekdays: toIntList(row.blockedWeekdays),
    })
  }

  return snapshots
}

const refreshTripItemAvailability = async (
  items: TripItemRecord[],
  now = new Date(),
) => {
  const hotelSnapshots = await readLatestHotelAvailabilitySnapshots(
    items.flatMap((item) => (item.itemType === 'hotel' && item.hotelId ? [item.hotelId] : [])),
  )

  const results = new Map<number, TripItemAvailabilityValidationResult>()
  const normalizedFlightDates = new Map<number, string>()

  for (const item of items) {
    if (item.itemType === 'hotel') {
      results.set(
        item.id,
        validateTripItemAvailability(
          {
            itemType: 'hotel',
            itemId: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate,
            inventoryExists: item.liveHotelExists,
            availabilitySnapshot: item.hotelId ? (hotelSnapshots.get(item.hotelId) || null) : null,
          },
          now,
        ),
      )
      continue
    }

    if (item.itemType === 'car') {
      results.set(
        item.id,
        validateTripItemAvailability(
          {
            itemType: 'car',
            itemId: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate,
            inventoryExists: item.liveCarExists,
            availability:
              item.liveCarExists &&
              item.liveCarAvailabilityStart &&
              item.liveCarAvailabilityEnd &&
              item.liveCarMinDays != null &&
              item.liveCarMaxDays != null
                ? {
                    availabilityStart: item.liveCarAvailabilityStart,
                    availabilityEnd: item.liveCarAvailabilityEnd,
                    minDays: item.liveCarMinDays,
                    maxDays: item.liveCarMaxDays,
                    blockedWeekdays: item.liveCarBlockedWeekdays,
                  }
                : null,
          },
          now,
        ),
      )
      continue
    }

    const liveServiceDate = toIsoDate(item.liveFlightServiceDate)
    if (liveServiceDate && (item.startDate !== liveServiceDate || item.endDate !== liveServiceDate)) {
      item.startDate = liveServiceDate
      item.endDate = liveServiceDate
      normalizedFlightDates.set(item.id, liveServiceDate)
    }

    results.set(
      item.id,
      validateTripItemAvailability(
        {
          itemType: 'flight',
          itemId: item.id,
          title: item.title,
          startDate: item.startDate,
          endDate: item.endDate,
          inventoryExists: item.liveFlightExists,
          serviceDate: item.liveFlightServiceDate,
          seatsRemaining: item.liveFlightSeatsRemaining,
        },
        now,
      ),
    )
  }

  if (!results.size) return results

  const db = getDb()
  await db.transaction(async (tx) => {
    const tripIdsNeedingDateSync = new Set<number>()

    for (const item of items) {
      const result = results.get(item.id)
      if (!result) continue

      const normalizedFlightDate = normalizedFlightDates.get(item.id)
      await tx
        .update(tripItems)
        .set({
          ...(normalizedFlightDate
            ? {
                startDate: normalizedFlightDate,
                endDate: normalizedFlightDate,
              }
            : {}),
          metadata: writeStoredTripItemAvailability(item.metadata, result),
          updatedAt: new Date(),
        })
        .where(eq(tripItems.id, item.id))

      if (normalizedFlightDate) {
        tripIdsNeedingDateSync.add(item.tripId)
      }
    }

    for (const tripId of tripIdsNeedingDateSync) {
      await syncTripDatesIfAuto(tx, tripId)
    }
  })

  return results
}

const resolveTripItemAvailability = async (
  items: TripItemRecord[],
  mode: 'auto' | 'force',
) => {
  const now = new Date()
  const resolved = new Map<number, TripItemAvailabilityValidationResult>()
  const staleItems: TripItemRecord[] = []

  for (const item of items) {
    const cached = readStoredTripItemAvailability(item.metadata)
    const isFresh = isStoredTripItemAvailabilityFresh(cached, now)
    const shouldRefresh = mode === 'force' || !isFresh || !isLiveInventoryPresent(item)

    if (shouldRefresh) {
      staleItems.push(item)
      continue
    }

    if (cached) {
      resolved.set(item.id, {
        checkedAt: cached.checkedAt,
        expiresAt: cached.expiresAt,
        status: cached.status,
        issues: cached.issues,
      })
    }
  }

  if (staleItems.length) {
    const refreshed = await refreshTripItemAvailability(staleItems, now)
    for (const [itemId, result] of refreshed.entries()) {
      resolved.set(itemId, result)
    }
  }

  return resolved
}

const toItineraryValidationItem = (
  item: TripItemRecord,
  availabilityStatus: TripItemValidityStatus,
): TripItineraryValidationItem => ({
  id: item.id,
  itemType: item.itemType,
  position: item.position,
  title: item.title,
  startDate: item.startDate,
  endDate: item.endDate,
  startCityId: item.startCityId,
  endCityId: item.endCityId,
  startCityName: item.startCityName,
  endCityName: item.endCityName,
  availabilityStatus,
  liveFlightServiceDate: item.liveFlightServiceDate,
  liveFlightDepartureAt: item.liveFlightDepartureAt,
  liveFlightArrivalAt: item.liveFlightArrivalAt,
  liveCarLocationType: item.liveCarLocationType,
})

const toTripGapAnalyzerItem = (item: TripItemRecord): TripGapAnalyzerItem => ({
  id: item.id,
  itemType: item.itemType,
  position: item.position,
  title: item.title,
  startDate: item.startDate,
  endDate: item.endDate,
  startCityId: item.startCityId,
  endCityId: item.endCityId,
  startCityName: item.startCityName,
  endCityName: item.endCityName,
  flightServiceDate: item.liveFlightServiceDate,
  flightItineraryType: item.liveFlightItineraryType,
  carLocationType: item.liveCarLocationType,
})

const getIssuesForTripItem = (
  itemId: number,
  availabilityIssues: TripValidationIssue[],
  itineraryIssues: TripValidationIssue[],
) =>
  dedupeIssues([
    ...availabilityIssues,
    ...itineraryIssues.filter(
      (issue) => issue.itemId === itemId || issue.relatedItemIds?.includes(itemId),
    ),
  ])

const toTripItem = (
  item: TripItemRecord,
  availability: TripItemAvailabilityValidationResult | undefined,
  itineraryIssues: TripValidationIssue[],
): TripItem => {
  const resolvedAvailability =
    availability ||
    validateTripItemAvailability(
      item.itemType === 'hotel'
        ? {
            itemType: 'hotel',
            itemId: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate,
            inventoryExists: item.liveHotelExists,
            availabilitySnapshot: null,
          }
        : item.itemType === 'car'
          ? {
              itemType: 'car',
              itemId: item.id,
              title: item.title,
              startDate: item.startDate,
              endDate: item.endDate,
              inventoryExists: item.liveCarExists,
              availability: null,
            }
          : {
              itemType: 'flight',
              itemId: item.id,
              title: item.title,
              startDate: item.startDate,
              endDate: item.endDate,
              inventoryExists: item.liveFlightExists,
              serviceDate: item.liveFlightServiceDate,
              seatsRemaining: item.liveFlightSeatsRemaining,
            },
      new Date(),
    )
  const availabilityStatus = applyPriceDriftToAvailabilityStatus(
    resolvedAvailability.status,
    item.priceDriftStatus,
  )

  return {
    id: item.id,
    tripId: item.tripId,
    itemType: item.itemType,
    position: item.position,
    title: item.title,
    subtitle: item.subtitle,
    startDate: item.startDate,
    endDate: item.endDate,
    snapshotPriceCents: item.snapshotPriceCents,
    snapshotCurrencyCode: item.snapshotCurrencyCode,
    snapshotTimestamp: item.snapshotTimestamp,
    currentPriceCents: item.currentPriceCents,
    currentCurrencyCode: item.currentCurrencyCode,
    priceDriftStatus: item.priceDriftStatus,
    priceDriftCents: item.priceDriftCents,
    freshness: buildInventoryFreshness({
      checkedAt: resolvedAvailability.checkedAt || item.snapshotTimestamp,
      profile: 'availability_revalidation',
    }),
    availabilityStatus,
    availabilityCheckedAt: resolvedAvailability.checkedAt,
    availabilityExpiresAt: resolvedAvailability.expiresAt,
    imageUrl: item.imageUrl,
    meta: item.meta,
    issues: getIssuesForTripItem(item.id, resolvedAvailability.issues, itineraryIssues),
    startCityName: item.startCityName,
    endCityName: item.endCityName,
    hotelId: item.hotelId,
    flightItineraryId: item.flightItineraryId,
    carInventoryId: item.carInventoryId,
    metadata: item.metadata,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

const summarizeTrip = (input: {
  id: number
  name: string
  status: TripStatus
  startDate: string | null
  endDate: string | null
  notes: string | null
  metadata: Record<string, unknown>
  updatedAt: Date | string
  items: TripItem[]
  intelligence: TripIntelligenceSummary
  bundling: TripBundlingSummary
}): TripDetails => {
  const pricing = buildTripPricingSummary(input.items)
  const currencyCode =
    pricing.currencyCode ||
    normalizeCurrencyCode(input.items[0]?.snapshotCurrencyCode || DEFAULT_CURRENCY)

  const citySet = new Set<string>()
  for (const item of input.items) {
    if (item.startCityName) citySet.add(item.startCityName)
    if (item.endCityName) citySet.add(item.endCityName)
  }

  const derivedStartDate =
    input.items
      .map((item) => item.startDate)
      .filter((value): value is string => Boolean(value))
      .sort()[0] || null
  const derivedEndDate =
    input.items
      .map((item) => item.endDate)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) || null

  const tripStartDate = input.startDate || derivedStartDate
  const tripEndDate = input.endDate || derivedEndDate

  return {
    id: input.id,
    name: input.name,
    status: input.status,
    itemCount: input.items.length,
    startDate: tripStartDate,
    endDate: tripEndDate,
    estimatedTotalCents: pricing.snapshotTotalCents ?? 0,
    currencyCode,
    hasMixedCurrencies: pricing.hasMixedCurrencies,
    updatedAt: toIsoTimestamp(input.updatedAt),
    notes: input.notes,
    metadata: input.metadata,
    citiesInvolved: [...citySet],
    pricing,
    intelligence: input.intelligence,
    bundling: input.bundling,
    items: input.items,
  }
}

export async function createTrip(input: CreateTripInput = {}): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    const name = normalizeTripName(input.name)
    const status = normalizeTripStatus(input.status)
    const startDate = toIsoDate(input.startDate)
    const endDate = toIsoDate(input.endDate)

    const [inserted] = await db
      .insert(trips)
      .values({
        name,
        status,
        notes: input.notes || null,
        metadata: normalizeMetadata(input.metadata),
      })
      .returning({ id: trips.id })

    await db.insert(tripDates).values({
      tripId: inserted.id,
      source: startDate || endDate ? 'manual' : 'auto',
      startDate,
      endDate,
    })

    const details = await getTripDetails(inserted.id)
    if (!details) {
      throw new TripRepoError('trip_not_found', `Trip ${inserted.id} was not found after creation.`)
    }

    return details
  })
}

export async function listTrips(): Promise<TripListItem[]> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    const snapshotColumns = requireTripSnapshotColumns()

    const itemAgg = db
      .select({
        tripId: tripItems.tripId,
        itemCount: sql<number>`count(${tripItems.id})::int`.as('item_count'),
        estimatedTotalCents:
          sql<number>`coalesce(sum(${snapshotColumns.snapshotPriceCents}), 0)::int`.as('estimated_total_cents'),
        currencyCode:
          sql<string>`coalesce(max(${snapshotColumns.snapshotCurrencyCode}), 'USD')`.as('currency_code'),
        currencyCount:
          sql<number>`count(distinct ${snapshotColumns.snapshotCurrencyCode})::int`.as('currency_count'),
      })
      .from(tripItems)
      .groupBy(tripItems.tripId)
      .as('trip_item_agg')

    const rows = await db
      .select({
        id: trips.id,
        name: trips.name,
        status: trips.status,
        startDate: tripDates.startDate,
        endDate: tripDates.endDate,
        itemCount: sql<number>`coalesce(${itemAgg.itemCount}, 0)::int`,
        estimatedTotalCents: sql<number>`coalesce(${itemAgg.estimatedTotalCents}, 0)::int`,
        currencyCode: sql<string>`coalesce(${itemAgg.currencyCode}, 'USD')`,
        currencyCount: sql<number>`coalesce(${itemAgg.currencyCount}, 0)::int`,
        updatedAt: trips.updatedAt,
      })
      .from(trips)
      .leftJoin(tripDates, eq(tripDates.tripId, trips.id))
      .leftJoin(itemAgg, eq(itemAgg.tripId, trips.id))
      .orderBy(desc(trips.updatedAt), desc(trips.id))

    return rows.map((row) =>
      toListItem({
        id: row.id,
        name: row.name,
        status: normalizeTripStatus(row.status),
        startDate: row.startDate,
        endDate: row.endDate,
        itemCount: row.itemCount,
        estimatedTotalCents: row.estimatedTotalCents,
        currencyCode: row.currencyCode,
        hasMixedCurrencies: row.currencyCount > 1,
        updatedAt: row.updatedAt,
      }),
    )
  })
}

export async function getTripDetails(
  tripId: number,
  options: {
    revalidate?: 'auto' | 'force'
  } = {},
): Promise<TripDetails | null> {
  return withTripSchemaGuard(async () => {
    const base = await readTripBase(tripId)
    if (!base) return null

    const itemRecords = await readTripItems(tripId)
    const availabilityByItemId = await resolveTripItemAvailability(
      itemRecords,
      options.revalidate === 'force' ? 'force' : 'auto',
    )
    const itinerary = validateTripItineraryCoherence({
      tripStartDate: base.startDate,
      tripEndDate: base.endDate,
      items: itemRecords.map((item) => {
        const availability = availabilityByItemId.get(item.id)
        const fallbackStatus = availability
          ? applyPriceDriftToAvailabilityStatus(availability.status, item.priceDriftStatus)
          : 'stale'

        return toItineraryValidationItem(item, fallbackStatus)
      }),
    })
    const items = itemRecords.map((item) =>
      toTripItem(item, availabilityByItemId.get(item.id), itinerary.issues),
    )
    const intelligence = buildTripIntelligenceSummary({ items })
    const bundling = await bundlingSuggestionService.buildTripBundlingSummary({
      tripStartDate: base.startDate,
      tripEndDate: base.endDate,
      items: itemRecords.map(toTripGapAnalyzerItem),
    })

    return summarizeTrip({
      id: base.id,
      name: base.name,
      status: normalizeTripStatus(base.status),
      startDate: base.startDate,
      endDate: base.endDate,
      notes: base.notes,
      metadata: normalizeMetadata(base.metadata),
      updatedAt: base.updatedAt,
      items,
      intelligence,
      bundling,
    })
  })
}

export async function revalidateTrip(tripId: number): Promise<TripDetails> {
  const details = await getTripDetails(tripId, { revalidate: 'force' })
  if (!details) {
    throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found.`)
  }

  return details
}

export async function addItemToTrip(tripId: number, candidate: TripItemCandidate): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    requireTripSnapshotColumns()

    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)
      const snapshot = await resolveTripItemSnapshot(tx, candidate)

      const [positionRow] = await tx
        .select({
          maxPosition: sql<number>`coalesce(max(${tripItems.position}), -1)::int`,
        })
        .from(tripItems)
        .where(eq(tripItems.tripId, tripId))

      const nextPosition = (positionRow?.maxPosition ?? -1) + 1

      await tx.insert(tripItems).values({
        tripId,
        itemType: snapshot.itemType,
        position: nextPosition,
        hotelId: snapshot.hotelId,
        flightItineraryId: snapshot.flightItineraryId,
        carInventoryId: snapshot.carInventoryId,
        startCityId: snapshot.startCityId,
        endCityId: snapshot.endCityId,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        snapshotPriceCents: snapshot.snapshotPriceCents,
        snapshotCurrencyCode: snapshot.snapshotCurrencyCode,
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        imageUrl: snapshot.imageUrl,
        meta: snapshot.meta,
        metadata: snapshot.metadata,
      })

      await syncTripDatesIfAuto(tx, tripId)
      await touchTrip(tx, tripId)
    })

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found after adding an item.`)
    }

    return details
  })
}

export async function removeItemFromTrip(tripId: number, itemId: number): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)

      const deleted = await tx
        .delete(tripItems)
        .where(and(eq(tripItems.tripId, tripId), eq(tripItems.id, itemId)))
        .returning({ id: tripItems.id })

      if (!deleted.length) {
        throw new TripRepoError(
          'trip_item_not_found',
          `Trip item ${itemId} was not found on trip ${tripId}.`,
        )
      }

      await normalizeTripItemPositions(tx, tripId)
      await syncTripDatesIfAuto(tx, tripId)
      await touchTrip(tx, tripId)
    })

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found after removing an item.`)
    }

    return details
  })
}

export async function reorderTripItems(
  tripId: number,
  orderedItemIds: number[],
): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)

      const existingRows = await tx
        .select({ id: tripItems.id })
        .from(tripItems)
        .where(eq(tripItems.tripId, tripId))
        .orderBy(asc(tripItems.position), asc(tripItems.id))

      const existingIds = existingRows.map((row) => row.id)
      const requestedIds = orderedItemIds.map((value) => Number.parseInt(String(value), 10))

      const isValid =
        requestedIds.length === existingIds.length &&
        new Set(requestedIds).size === requestedIds.length &&
        requestedIds.every((id) => existingIds.includes(id))

      if (!isValid) {
        throw new TripRepoError(
          'invalid_reorder',
          'Reorder payload must contain the exact set of trip item ids.',
        )
      }

      for (const [index, itemId] of requestedIds.entries()) {
        await tx
          .update(tripItems)
          .set({
            position: index,
            updatedAt: new Date(),
          })
          .where(and(eq(tripItems.id, itemId), eq(tripItems.tripId, tripId)))
      }

      await touchTrip(tx, tripId)
    })

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found after reordering items.`)
    }

    return details
  })
}

export async function updateTripMetadata(
  tripId: number,
  input: UpdateTripMetadataInput,
): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()

    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)
      await ensureTripDatesRow(tx, tripId)

      const tripRows = await tx
        .select({
          metadata: trips.metadata,
        })
        .from(trips)
        .where(eq(trips.id, tripId))
        .limit(1)

      const currentMetadata = normalizeMetadata(tripRows[0]?.metadata)
      const nextMetadata = input.metadata
        ? { ...currentMetadata, ...normalizeMetadata(input.metadata) }
        : currentMetadata

      const nextTripUpdate: {
        name?: string
        status?: TripStatus
        notes?: string | null
        metadata?: Record<string, unknown>
        updatedAt: Date
      } = {
        updatedAt: new Date(),
      }

      if (input.name != null) {
        nextTripUpdate.name = normalizeTripName(input.name)
      }

      if (input.status != null) {
        nextTripUpdate.status = normalizeTripStatus(input.status)
      }

      if (input.notes !== undefined) {
        nextTripUpdate.notes = input.notes == null ? null : String(input.notes).trim() || null
      }

      if (input.metadata) {
        nextTripUpdate.metadata = nextMetadata
      }

      await tx
        .update(trips)
        .set(nextTripUpdate)
        .where(eq(trips.id, tripId))

      const hasDateInput =
        input.startDate !== undefined ||
        input.endDate !== undefined ||
        input.dateSource !== undefined

      if (hasDateInput) {
        const currentRows = await tx
          .select({
            source: tripDates.source,
            startDate: tripDates.startDate,
            endDate: tripDates.endDate,
          })
          .from(tripDates)
          .where(eq(tripDates.tripId, tripId))
          .limit(1)

        const current = currentRows[0]

        if (input.dateSource === 'auto') {
          await tx
            .update(tripDates)
            .set({
              source: 'auto',
              updatedAt: new Date(),
            })
            .where(eq(tripDates.tripId, tripId))
          await syncTripDatesIfAuto(tx, tripId)
        } else {
          const nextSource = input.dateSource === 'manual' ? 'manual' : current?.source || 'manual'
          const nextStartDate =
            input.startDate !== undefined ? toIsoDate(input.startDate) : current?.startDate || null
          const nextEndDate =
            input.endDate !== undefined ? toIsoDate(input.endDate) : current?.endDate || null

          await tx
            .update(tripDates)
            .set({
              source: nextSource,
              startDate: nextStartDate,
              endDate: nextEndDate,
              updatedAt: new Date(),
            })
            .where(eq(tripDates.tripId, tripId))
        }
      }
    })

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError(
        'trip_not_found',
        `Trip ${tripId} was not found after metadata update.`,
      )
    }

    return details
  })
}
