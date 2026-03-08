import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '~/lib/db/client.server'
import {
  buildAvailabilityConfidence,
  evaluateCarAvailabilityContext,
  evaluateFlightAvailabilityContext,
  evaluateHotelAvailabilityContext,
} from '~/lib/inventory/availability-confidence'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import {
  buildCarPriceDisplay,
  buildFlightPriceDisplay,
  buildHotelPriceDisplay,
  mergePriceDisplayMetadata,
  readStoredPriceDisplayMetadata,
  resolveComparablePriceCents,
  formatMoneyFromCents,
} from '~/lib/pricing/price-display'
import { computeDays } from '~/lib/search/car-rentals/dates'
import { computeNights } from '~/lib/search/hotels/dates'
import {
  airlines,
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
import {
  buildSuggestionExplanation,
  bundlingSuggestionService,
} from '~/lib/trips/bundling-suggestion-service.server'
import { readTripBundlingState } from '~/lib/trips/bundle-explainability'
import { buildTripEditBundleImpact } from '~/lib/trips/bundle-swap-impact'
import { buildTripIntelligenceSummary } from '~/lib/trips/status-aggregation'
import type { TripGapAnalyzerItem } from '~/lib/trips/trip-gap-analyzer'
import {
  TRIP_ITEM_TYPES,
  type TripAppliedChange,
  type TripBundlingGap,
  type TripBundlingSummary,
  type TripChangeSummary,
  type TripEditPreview,
  type TripEditPreviewActionType,
  type TripDetails,
  type TripItemReplacementOption,
  type TripIntelligenceSummary,
  type TripItem,
  type TripItemCandidate,
  type TripRollbackDraft,
  type TripRollbackItemSnapshot,
  type TripItemType,
  type TripItemValidityStatus,
  type TripListItem,
  type TripPriceDriftStatus,
  type TripPricingSummary,
  type TripStatus,
  type TripValidationIssue,
  type TripVerticalPricing,
} from '~/types/trips/trip'
import { compareIsoDate } from '~/lib/trips/date-utils'

export class TripRepoError extends Error {
  constructor(
    readonly code:
      | 'trip_not_found'
      | 'trip_item_not_found'
      | 'inventory_not_found'
      | 'invalid_reorder'
      | 'invalid_edit'
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

type TripBaseRecord = {
  id: number
  name: string
  status: TripStatus
  notes: string | null
  metadata: Record<string, unknown>
  startDate: string | null
  endDate: string | null
  dateSource: 'auto' | 'manual'
  updatedAt: Date | string
}

const DEFAULT_TRIP_NAME = 'Untitled trip'
const DEFAULT_CURRENCY = 'USD'
const LATEST_TRIP_MIGRATION = '0003_trip_price_snapshots.sql'
const TRIP_ITEM_LOCKED_KEY = 'locked'
const TRIP_AUTO_REBALANCE_KEY = 'autoRebalance'

const TRIP_SCHEMA_IDENTIFIERS = [
  'trip_items',
  'trip_dates',
  'trips',
  'snapshot_price_cents',
  'snapshot_currency_code',
  'snapshot_timestamp',
  'prevent_trip_item_snapshot_updates',
] as const

const CANDIDATE_PREVIEW_METADATA_KEYS = [
  'previewAvailabilityEnd',
  'previewAvailabilityStart',
  'previewBlockedWeekdays',
  'previewCurrentPriceCents',
  'previewCurrentCurrencyCode',
  'previewDropoffLabel',
  'previewFlightArrivalAt',
  'previewFlightDepartureAt',
  'previewFlightItineraryType',
  'previewFlightSeatsRemaining',
  'previewFlightServiceDate',
  'previewLocationName',
  'previewLocationType',
  'previewMaxDays',
  'previewMinDays',
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

const normalizeCandidateMetadata = (value: unknown) => {
  const metadata = { ...normalizeMetadata(value) }
  for (const key of CANDIDATE_PREVIEW_METADATA_KEYS) {
    delete metadata[key]
  }
  return metadata
}

const readTripItemLocked = (value: unknown) => {
  const metadata = normalizeMetadata(value)
  return metadata[TRIP_ITEM_LOCKED_KEY] === true
}

const writeTripItemLocked = (value: unknown, locked: boolean) => {
  const metadata = { ...normalizeMetadata(value) }
  if (locked) {
    metadata[TRIP_ITEM_LOCKED_KEY] = true
  } else {
    delete metadata[TRIP_ITEM_LOCKED_KEY]
  }
  return metadata
}

const readTripAutoRebalance = (value: unknown) => {
  const metadata = normalizeMetadata(value)
  return metadata[TRIP_AUTO_REBALANCE_KEY] === true
}

const writeTripAutoRebalance = (value: unknown, enabled: boolean) => {
  const metadata = { ...normalizeMetadata(value) }
  if (enabled) {
    metadata[TRIP_AUTO_REBALANCE_KEY] = true
  } else {
    delete metadata[TRIP_AUTO_REBALANCE_KEY]
  }
  return metadata
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
  const hasPartialPricing = items.some((item) => {
    const storedPrice = readStoredPriceDisplayMetadata(item.metadata)
    if (!storedPrice) return item.itemType === 'hotel' || item.itemType === 'car'
    if (item.itemType !== 'hotel' && item.itemType !== 'car') return false
    return storedPrice.baseTotalAmountCents == null
  })

  if (!items.length) {
    return {
      currencyCode: DEFAULT_CURRENCY,
      snapshotTotalCents: 0,
      currentTotalCents: 0,
      priceDeltaCents: 0,
      hasMixedCurrencies: false,
      hasPartialPricing: false,
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
    hasPartialPricing,
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
      hasPartialPricing: totals.hasPartialPricing,
    }
  }).filter((vertical) => vertical.itemCount > 0)

  const totals = summarizePricingGroup(items)

  return {
    currencyCode: totals.currencyCode,
    snapshotTotalCents: totals.snapshotTotalCents,
    currentTotalCents: totals.currentTotalCents,
    priceDeltaCents: totals.priceDeltaCents,
    hasMixedCurrencies: totals.hasMixedCurrencies,
    hasPartialPricing: totals.hasPartialPricing,
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
    metadata: normalizeCandidateMetadata(candidate.metadata),
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
    metadata: normalizeCandidateMetadata(candidate.metadata),
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
    metadata: normalizeCandidateMetadata(candidate.metadata),
  }
}

const resolveTripItemSnapshot = async (tx: any, candidate: TripItemCandidate) => {
  if (candidate.itemType === 'hotel') return resolveHotelTripItem(tx, candidate)
  if (candidate.itemType === 'car') return resolveCarTripItem(tx, candidate)
  return resolveFlightTripItem(tx, candidate)
}

const readTripBase = async (tripId: number): Promise<TripBaseRecord | null> => {
  const db = getDb()
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      status: trips.status,
      notes: trips.notes,
      metadata: trips.metadata,
      dateSource: tripDates.source,
      startDate: tripDates.startDate,
      endDate: tripDates.endDate,
      updatedAt: trips.updatedAt,
    })
    .from(trips)
    .leftJoin(tripDates, eq(tripDates.tripId, trips.id))
    .where(eq(trips.id, tripId))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    status: normalizeTripStatus(row.status),
    notes: row.notes,
    metadata: normalizeMetadata(row.metadata),
    dateSource: row.dateSource === 'manual' ? 'manual' : 'auto',
    startDate: row.startDate,
    endDate: row.endDate,
    updatedAt: row.updatedAt,
  }
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
    const metadata = normalizeMetadata(row.metadata)
    const comparableCurrentPriceCents =
      row.itemType === 'hotel'
        ? resolveComparablePriceCents(row.currentHotelPriceCents, metadata)
        : row.itemType === 'car'
          ? resolveComparablePriceCents(row.currentCarPriceCents, metadata)
          : resolveComparablePriceCents(row.currentFlightPriceCents, metadata)

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
        comparableCurrentPriceCents == null
          ? null
          : normalizePriceCents(
              comparableCurrentPriceCents,
              comparableCurrentPriceCents,
            ),
      currentCurrencyCode: normalizedCurrentCurrencyCode,
      priceDriftStatus: getPriceDriftStatus(
        row.snapshotPriceCents,
        snapshotCurrencyCode,
        comparableCurrentPriceCents,
        normalizedCurrentCurrencyCode,
      ),
      priceDriftCents: getPriceDriftCents(
        row.snapshotPriceCents,
        snapshotCurrencyCode,
        comparableCurrentPriceCents,
        normalizedCurrentCurrencyCode,
      ),
      imageUrl: row.imageUrl,
      meta: normalizeMeta(row.meta),
      metadata,
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
        snapshotAt: string
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
        snapshotAt: string
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
      snapshotAt: toIsoTimestamp(row.snapshotAt),
    })
  }

  return snapshots
}

const evaluateTripItemAvailability = async (
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

  return {
    results,
    normalizedFlightDates,
  }
}

const refreshTripItemAvailability = async (
  items: TripItemRecord[],
  now = new Date(),
) => {
  const { results, normalizedFlightDates } = await evaluateTripItemAvailability(items, now)

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

const resolveTripItemAvailabilityPreview = async (
  items: TripItemRecord[],
): Promise<Map<number, TripItemAvailabilityValidationResult>> => {
  const now = new Date()
  const resolved = new Map<number, TripItemAvailabilityValidationResult>()
  const toEvaluate: TripItemRecord[] = []

  for (const item of items) {
    const cached = readStoredTripItemAvailability(item.metadata)
    const isFresh = isStoredTripItemAvailabilityFresh(cached, now)

    if (cached && isFresh && isLiveInventoryPresent(item)) {
      resolved.set(item.id, {
        checkedAt: cached.checkedAt,
        expiresAt: cached.expiresAt,
        status: cached.status,
        issues: cached.issues,
      })
      continue
    }

    toEvaluate.push(item)
  }

  if (toEvaluate.length) {
    const { results } = await evaluateTripItemAvailability(toEvaluate, now)
    for (const [itemId, result] of results.entries()) {
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

const PARTIAL_AVAILABILITY_CODES = new Set(['flight_date_needs_confirmation'])
const REVALIDATION_FAILURE_CODES = new Set([
  'availability_snapshot_missing',
  'availability_window_missing',
  'flight_service_date_missing',
])

const buildTripItemConfidence = (input: {
  availabilityStatus: TripItemValidityStatus
  freshness: ReturnType<typeof buildInventoryFreshness>
  issues: TripValidationIssue[]
}) => {
  const primaryAvailabilityIssue =
    input.issues.find((issue) => issue.scope === 'availability') || input.issues[0] || null
  const issueCode = primaryAvailabilityIssue?.code || ''

  return buildAvailabilityConfidence({
    freshness: input.freshness,
    match:
      PARTIAL_AVAILABILITY_CODES.has(issueCode)
        ? 'partial'
        : input.availabilityStatus === 'valid' || input.availabilityStatus === 'price_only_changed'
          ? 'exact'
          : 'unknown',
    unavailable: input.availabilityStatus === 'unavailable',
    revalidationFailed:
      input.availabilityStatus === 'stale' && REVALIDATION_FAILURE_CODES.has(issueCode),
    supportText: primaryAvailabilityIssue?.message || null,
  })
}

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
  const freshness = buildInventoryFreshness({
    checkedAt: resolvedAvailability.checkedAt || item.snapshotTimestamp,
    profile: 'availability_revalidation',
  })
  const issues = getIssuesForTripItem(item.id, resolvedAvailability.issues, itineraryIssues)

  return {
    id: item.id,
    tripId: item.tripId,
    itemType: item.itemType,
    position: item.position,
    locked: readTripItemLocked(item.metadata),
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
    availabilityConfidence: buildTripItemConfidence({
      availabilityStatus,
      freshness,
      issues,
    }),
    freshness,
    availabilityStatus,
    availabilityCheckedAt: resolvedAvailability.checkedAt,
    availabilityExpiresAt: resolvedAvailability.expiresAt,
    imageUrl: item.imageUrl,
    meta: item.meta,
    issues,
    startCityName: item.startCityName,
    endCityName: item.endCityName,
    liveCarLocationType: item.liveCarLocationType,
    liveCarLocationName: item.liveCarLocationName,
    hotelId: item.hotelId,
    flightItineraryId: item.flightItineraryId,
    carInventoryId: item.carInventoryId,
    liveFlightServiceDate: item.liveFlightServiceDate,
    liveFlightDepartureAt: item.liveFlightDepartureAt,
    liveFlightArrivalAt: item.liveFlightArrivalAt,
    liveFlightItineraryType: item.liveFlightItineraryType,
    metadata: item.metadata,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

const summarizeTrip = (input: {
  id: number
  name: string
  status: TripStatus
  dateSource: 'auto' | 'manual'
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

  const tripStartDate =
    input.dateSource === 'manual'
      ? input.startDate || derivedStartDate
      : derivedStartDate || input.startDate
  const tripEndDate =
    input.dateSource === 'manual'
      ? input.endDate || derivedEndDate
      : derivedEndDate || input.endDate
  const autoRebalance = readTripAutoRebalance(input.metadata)

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
    editing: {
      autoRebalance,
      lockedItemCount: input.items.filter((item) => item.locked).length,
    },
    citiesInvolved: [...citySet],
    pricing,
    intelligence: input.intelligence,
    bundling: input.bundling,
    items: input.items,
  }
}

const cloneTripItemRecord = (item: TripItemRecord): TripItemRecord => ({
  ...item,
  meta: [...item.meta],
  metadata: { ...item.metadata },
  liveCarBlockedWeekdays: [...item.liveCarBlockedWeekdays],
})

const toTripRollbackItemSnapshot = (
  item: TripItemRecord,
): TripRollbackItemSnapshot => ({
  id: item.id,
  itemType: item.itemType,
  position: item.position,
  hotelId: item.hotelId,
  flightItineraryId: item.flightItineraryId,
  carInventoryId: item.carInventoryId,
  startCityId: item.startCityId,
  endCityId: item.endCityId,
  startDate: item.startDate,
  endDate: item.endDate,
  snapshotPriceCents: item.snapshotPriceCents,
  snapshotCurrencyCode: item.snapshotCurrencyCode,
  snapshotTimestamp: item.snapshotTimestamp,
  title: item.title,
  subtitle: item.subtitle,
  imageUrl: item.imageUrl,
  meta: [...item.meta],
  metadata: { ...item.metadata },
})

const buildTripRollbackDraft = (
  items: TripItemRecord[],
): TripRollbackDraft => ({
  items: items
    .slice()
    .sort((left, right) => left.position - right.position || left.id - right.id)
    .map(toTripRollbackItemSnapshot),
})

const buildTripDetailsFromRecords = async (
  base: TripBaseRecord,
  itemRecords: TripItemRecord[],
  options: {
    revalidate?: 'auto' | 'force'
    preview?: boolean
  } = {},
): Promise<TripDetails> => {
  const workingItems = itemRecords.map(cloneTripItemRecord)
  const availabilityByItemId = options.preview
    ? await resolveTripItemAvailabilityPreview(workingItems)
    : await resolveTripItemAvailability(
        workingItems,
        options.revalidate === 'force' ? 'force' : 'auto',
      )
  const itinerary = validateTripItineraryCoherence({
    tripStartDate: base.startDate,
    tripEndDate: base.endDate,
    items: workingItems.map((item) => {
      const availability = availabilityByItemId.get(item.id)
      const fallbackStatus = availability
        ? applyPriceDriftToAvailabilityStatus(availability.status, item.priceDriftStatus)
        : 'stale'

      return toItineraryValidationItem(item, fallbackStatus)
    }),
  })
  const items = workingItems.map((item) =>
    toTripItem(item, availabilityByItemId.get(item.id), itinerary.issues),
  )
  const pricing = buildTripPricingSummary(items)
  const intelligence = buildTripIntelligenceSummary({ items })
  const bundling = await bundlingSuggestionService.buildTripBundlingSummary({
    tripStartDate: base.startDate,
    tripEndDate: base.endDate,
    items: workingItems.map(toTripGapAnalyzerItem),
    pricing: {
      currencyCode: pricing.currencyCode,
      snapshotTotalCents: pricing.snapshotTotalCents,
      hasMixedCurrencies: pricing.hasMixedCurrencies,
    },
  })

  return summarizeTrip({
    id: base.id,
    name: base.name,
    status: base.status,
    dateSource: base.dateSource,
    startDate: base.startDate,
    endDate: base.endDate,
    notes: base.notes,
    metadata: base.metadata,
    updatedAt: base.updatedAt,
    items,
    intelligence,
    bundling,
  })
}

const getTripItemInventoryId = (item: Pick<TripItemRecord, 'itemType' | 'hotelId' | 'flightItineraryId' | 'carInventoryId'>) => {
  if (item.itemType === 'hotel') return item.hotelId
  if (item.itemType === 'flight') return item.flightItineraryId
  return item.carInventoryId
}

const resolveRecordDayKey = (item: Pick<TripItemRecord, 'liveFlightServiceDate' | 'startDate' | 'endDate'>) => {
  return item.liveFlightServiceDate || item.startDate || item.endDate || null
}

const resolveRecordSortTimestamp = (
  item: Pick<
    TripItemRecord,
    'itemType' | 'liveFlightDepartureAt' | 'liveFlightArrivalAt' | 'liveFlightServiceDate' | 'startDate'
  >,
) => {
  if (item.itemType === 'flight') {
    return (
      item.liveFlightDepartureAt ||
      item.liveFlightArrivalAt ||
      (item.liveFlightServiceDate ? `${item.liveFlightServiceDate}T00:00:00.000Z` : null)
    )
  }

  return item.startDate ? `${item.startDate}T00:00:00.000Z` : null
}

const compareTripItemRecordsBySchedule = (left: TripItemRecord, right: TripItemRecord) => {
  const dayOrder = compareIsoDate(resolveRecordDayKey(left), resolveRecordDayKey(right))
  if (dayOrder != null) return dayOrder

  const leftStart = resolveRecordSortTimestamp(left)
  const rightStart = resolveRecordSortTimestamp(right)
  if (leftStart && rightStart && leftStart !== rightStart) {
    return leftStart < rightStart ? -1 : 1
  }

  return left.position - right.position || left.id - right.id
}

const normalizeSimulatedTripItemPositions = (items: TripItemRecord[]) =>
  items.map((item, index) => ({
    ...item,
    position: index,
  }))

const applyLockedAutoRebalance = (items: TripItemRecord[]) => {
  const byPosition = items.slice().sort((left, right) => left.position - right.position || left.id - right.id)
  const lockedItems = byPosition.filter((item) => readTripItemLocked(item.metadata))
  const unlockedSorted = byPosition
    .filter((item) => !readTripItemLocked(item.metadata))
    .sort(compareTripItemRecordsBySchedule)

  if (!lockedItems.length) {
    return normalizeSimulatedTripItemPositions(unlockedSorted)
  }

  const next: Array<TripItemRecord | undefined> = new Array(byPosition.length)
  for (const item of lockedItems) {
    const position = Math.max(0, Math.min(item.position, byPosition.length - 1))
    next[position] = item
  }

  let unlockedIndex = 0
  for (let index = 0; index < next.length; index += 1) {
    if (next[index]) continue
    next[index] = unlockedSorted[unlockedIndex]
    unlockedIndex += 1
  }

  return normalizeSimulatedTripItemPositions(next.filter((item): item is TripItemRecord => Boolean(item)))
}

const readCandidatePreviewNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

const readCandidatePreviewString = (value: unknown) => {
  const text = String(value || '').trim()
  return text || null
}

const readCandidatePreviewLocationType = (value: unknown): 'airport' | 'city' | null => {
  return value === 'airport' || value === 'city' ? value : null
}

const resolveReplacementInventoryId = (
  item: Pick<TripItemRecord, 'itemType' | 'hotelId' | 'flightItineraryId' | 'carInventoryId'>,
) => {
  if (item.itemType === 'hotel') return item.hotelId
  if (item.itemType === 'flight') return item.flightItineraryId
  return item.carInventoryId
}

const getBundlingPriorityFromGapType = (
  gapType: TripBundlingGap['gapType'] | null,
): TripBundlingGap['priority'] => {
  if (gapType === 'missing_return_flight' || gapType === 'missing_lodging') {
    return 'high'
  }
  if (
    gapType === 'arrival_ground_transport' ||
    gapType === 'missing_car_rental' ||
    gapType === 'intercity_transfer_gap'
  ) {
    return 'medium'
  }
  return 'low'
}

const buildReplacementBundleGap = (
  item: TripItemRecord,
): TripBundlingGap | null => {
  const bundleState = readTripBundlingState(item.metadata)
  if (!bundleState) return null

  const context = bundleState.context
  const gapType =
    bundleState.gapType ||
    (item.itemType === 'hotel'
      ? 'missing_lodging'
      : item.itemType === 'car'
        ? 'missing_car_rental'
        : 'intercity_transfer_gap')

  return {
    id: bundleState.gapId || `bundle-override:${item.id}`,
    gapType,
    priority: context?.priority || getBundlingPriorityFromGapType(gapType),
    targetItemType: item.itemType,
    title:
      context?.title ||
      (item.itemType === 'hotel'
        ? 'Swap bundled hotel'
        : item.itemType === 'car'
          ? 'Swap bundled car'
          : 'Swap bundled flight'),
    description:
      context?.description ||
      (item.itemType === 'hotel'
        ? `Keep lodging coverage in ${item.startCityName || item.endCityName || 'this city'} without rebuilding the rest of the trip.`
        : item.itemType === 'car'
          ? `Keep ground transport coverage in ${item.startCityName || item.endCityName || 'this city'} without rebuilding the bundle.`
          : `Keep this travel leg between ${item.startCityName || 'the current city'} and ${item.endCityName || 'the next city'} without rebuilding the bundle.`),
    startDate: context?.startDate || item.startDate,
    endDate: context?.endDate || item.endDate,
    cityId: context?.cityId ?? item.startCityId ?? item.endCityId,
    cityName: context?.cityName || item.startCityName || item.endCityName,
    originCityId: context?.originCityId ?? item.startCityId,
    originCityName: context?.originCityName || item.startCityName,
    destinationCityId: context?.destinationCityId ?? item.endCityId,
    destinationCityName: context?.destinationCityName || item.endCityName,
    relatedItemIds: bundleState.relatedItemIds,
  }
}

const resolveReplacementPriceDisplay = (input: {
  itemType: TripItemType
  priceCents: number
  currencyCode: string
  startDate: string | null
  endDate: string | null
}) => {
  if (input.itemType === 'hotel') {
    return buildHotelPriceDisplay({
      currencyCode: input.currencyCode,
      nightlyRate: input.priceCents / 100,
      nights: computeNights(input.startDate, input.endDate),
    })
  }

  if (input.itemType === 'car') {
    return buildCarPriceDisplay({
      currencyCode: input.currencyCode,
      dailyRate: input.priceCents / 100,
      days:
        input.startDate && input.endDate
          ? computeDays(input.startDate, input.endDate)
          : null,
    })
  }

  return buildFlightPriceDisplay({
    currencyCode: input.currencyCode,
    fare: input.priceCents / 100,
    travelers: 1,
  })
}

const resolveDisplayedReplacementBaseCents = (
  input: ReturnType<typeof resolveReplacementPriceDisplay>,
  fallbackPriceCents: number,
) =>
  Math.round((input.baseTotalAmount ?? input.baseAmount ?? 0) * 100) ||
  Math.max(0, Math.round(fallbackPriceCents))

const buildReplacementCandidateMetadata = (input: {
  item: TripItemRecord
  inventoryId: number
  previewMetadata: Record<string, unknown>
  currencyCode: string
  startDate: string | null
  endDate: string | null
  displayedBaseCents: number
  priceDisplay: ReturnType<typeof resolveReplacementPriceDisplay>
  availabilityConfidence: ReturnType<typeof buildAvailabilityConfidence>
  explainability: {
    cheapestExactMatchPriceCents: number | null
    preferredLocationType: 'airport' | 'city' | null
    selectedLocationType: 'airport' | 'city' | null
  }
}) => {
  const baseMetadata = mergePriceDisplayMetadata(
    input.previewMetadata,
    input.item.itemType,
    input.priceDisplay,
  )
  const gap = buildReplacementBundleGap(input.item)
  if (!gap) return baseMetadata

  const existingBundleState = readTripBundlingState(input.item.metadata)
  const explanation = buildSuggestionExplanation({
    gap,
    itemType: input.item.itemType,
    startDate: input.startDate,
    endDate: input.endDate,
    cityName: gap.cityName,
    tripPricing: null,
    inventory: {
      currencyCode: input.currencyCode,
      serviceDate:
        input.item.itemType === 'flight' ? input.startDate || input.endDate : null,
      availabilityConfidence: input.availabilityConfidence,
      explainability: input.explainability,
    },
    displayedBaseCents: input.displayedBaseCents,
  })

  return {
    ...baseMetadata,
    smartBundling: {
      generatedAt: new Date().toISOString(),
      gapId: existingBundleState?.gapId || gap.id,
      gapType: gap.gapType,
      relatedItemIds: gap.relatedItemIds,
      suggestionType: existingBundleState?.suggestionType || null,
      selectionMode: 'manual_override',
      manualOverride: true,
      originalInventoryId:
        existingBundleState?.originalInventoryId ||
        resolveReplacementInventoryId(input.item),
      currentInventoryId: input.inventoryId,
      context: {
        priority: gap.priority,
        itemType: gap.targetItemType,
        title: gap.title,
        description: gap.description,
        startDate: gap.startDate,
        endDate: gap.endDate,
        cityId: gap.cityId,
        cityName: gap.cityName,
        originCityId: gap.originCityId,
        originCityName: gap.originCityName,
        destinationCityId: gap.destinationCityId,
        destinationCityName: gap.destinationCityName,
      },
      explanation,
    },
  }
}

const buildReplacementTripItemRecord = async (
  tx: any,
  existingItem: TripItemRecord,
  candidate: TripItemCandidate,
): Promise<TripItemRecord> => {
  if (candidate.itemType !== existingItem.itemType) {
    throw new TripRepoError(
      'invalid_edit',
      `Replacement item type ${candidate.itemType} does not match existing ${existingItem.itemType}.`,
    )
  }

  const snapshot = await resolveTripItemSnapshot(tx, candidate)
  const previewMetadata = normalizeMetadata(candidate.metadata)
  const currentPriceCents =
    readCandidatePreviewNumber(previewMetadata.previewCurrentPriceCents) ?? snapshot.snapshotPriceCents
  const currentCurrencyCode =
    readCandidatePreviewString(previewMetadata.previewCurrentCurrencyCode) || snapshot.snapshotCurrencyCode
  const metadata = writeTripItemLocked(snapshot.metadata, readTripItemLocked(existingItem.metadata))

  return {
    ...existingItem,
    itemType: snapshot.itemType,
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    startDate: snapshot.startDate,
    endDate: snapshot.endDate,
    snapshotPriceCents: snapshot.snapshotPriceCents,
    snapshotCurrencyCode: snapshot.snapshotCurrencyCode,
    snapshotTimestamp: new Date().toISOString(),
    currentPriceCents,
    currentCurrencyCode,
    priceDriftStatus: getPriceDriftStatus(
      snapshot.snapshotPriceCents,
      snapshot.snapshotCurrencyCode,
      currentPriceCents,
      currentCurrencyCode,
    ),
    priceDriftCents: getPriceDriftCents(
      snapshot.snapshotPriceCents,
      snapshot.snapshotCurrencyCode,
      currentPriceCents,
      currentCurrencyCode,
    ),
    imageUrl: snapshot.imageUrl,
    meta: snapshot.meta,
    metadata,
    hotelId: snapshot.hotelId,
    flightItineraryId: snapshot.flightItineraryId,
    carInventoryId: snapshot.carInventoryId,
    startCityId: snapshot.startCityId,
    endCityId: snapshot.endCityId,
    startCityName: snapshot.itemType === 'flight' ? existingItem.startCityName : existingItem.startCityName,
    endCityName: snapshot.itemType === 'flight' ? existingItem.endCityName : existingItem.endCityName,
    liveHotelExists: snapshot.itemType === 'hotel',
    liveCarExists: snapshot.itemType === 'car',
    liveFlightExists: snapshot.itemType === 'flight',
    liveCarAvailabilityStart: readCandidatePreviewString(previewMetadata.previewAvailabilityStart),
    liveCarAvailabilityEnd: readCandidatePreviewString(previewMetadata.previewAvailabilityEnd),
    liveCarMinDays: readCandidatePreviewNumber(previewMetadata.previewMinDays),
    liveCarMaxDays: readCandidatePreviewNumber(previewMetadata.previewMaxDays),
    liveCarBlockedWeekdays: toIntList(previewMetadata.previewBlockedWeekdays),
    liveCarLocationType: readCandidatePreviewLocationType(previewMetadata.previewLocationType),
    liveCarLocationName: readCandidatePreviewString(previewMetadata.previewLocationName),
    liveFlightServiceDate:
      readCandidatePreviewString(previewMetadata.previewFlightServiceDate) || snapshot.startDate,
    liveFlightDepartureAt: toOptionalIsoTimestamp(
      readCandidatePreviewString(previewMetadata.previewFlightDepartureAt),
    ),
    liveFlightArrivalAt: toOptionalIsoTimestamp(
      readCandidatePreviewString(previewMetadata.previewFlightArrivalAt),
    ),
    liveFlightSeatsRemaining: readCandidatePreviewNumber(previewMetadata.previewFlightSeatsRemaining),
    liveFlightItineraryType:
      previewMetadata.previewFlightItineraryType === 'one-way' ||
      previewMetadata.previewFlightItineraryType === 'round-trip'
        ? previewMetadata.previewFlightItineraryType
        : null,
    updatedAt: new Date().toISOString(),
  }
}

const readPrimaryHotelImages = async (hotelIds: number[]) => {
  const ids = Array.from(new Set(hotelIds.filter((hotelId) => hotelId > 0)))
  if (!ids.length) return new Map<number, string>()

  const db = getDb()
  const rows = await db
    .select({
      hotelId: hotelImages.hotelId,
      url: hotelImages.url,
      sortOrder: hotelImages.sortOrder,
      imageId: hotelImages.id,
    })
    .from(hotelImages)
    .where(inArray(hotelImages.hotelId, ids))
    .orderBy(asc(hotelImages.hotelId), asc(hotelImages.sortOrder), asc(hotelImages.id))

  const byHotelId = new Map<number, string>()
  for (const row of rows) {
    if (!byHotelId.has(row.hotelId)) {
      byHotelId.set(row.hotelId, row.url)
    }
  }

  return byHotelId
}

const readPrimaryCarImages = async (inventoryIds: number[]) => {
  const ids = Array.from(new Set(inventoryIds.filter((inventoryId) => inventoryId > 0)))
  if (!ids.length) return new Map<number, string>()

  const db = getDb()
  const rows = await db
    .select({
      inventoryId: carInventoryImages.inventoryId,
      url: carInventoryImages.url,
      sortOrder: carInventoryImages.sortOrder,
      imageId: carInventoryImages.id,
    })
    .from(carInventoryImages)
    .where(inArray(carInventoryImages.inventoryId, ids))
    .orderBy(
      asc(carInventoryImages.inventoryId),
      asc(carInventoryImages.sortOrder),
      asc(carInventoryImages.id),
    )

  const byInventoryId = new Map<number, string>()
  for (const row of rows) {
    if (!byInventoryId.has(row.inventoryId)) {
      byInventoryId.set(row.inventoryId, row.url)
    }
  }

  return byInventoryId
}

const buildHotelReplacementOptions = async (item: TripItemRecord): Promise<TripItemReplacementOption[]> => {
  if (!item.startCityId) return []

  const db = getDb()
  const conditions = [eq(hotels.cityId, item.startCityId)]
  if (item.hotelId) {
    conditions.push(sql`${hotels.id} <> ${item.hotelId}`)
  }

  const rows = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      neighborhood: hotels.neighborhood,
      cityName: cities.name,
      stars: hotels.stars,
      rating: hotels.rating,
      priceCents: hotels.fromNightlyCents,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .where(and(...conditions))
    .orderBy(desc(hotels.rating), asc(hotels.fromNightlyCents), asc(hotels.id))
    .limit(12)

  const imageByHotelId = await readPrimaryHotelImages(rows.map((row) => row.id))
  const availabilityByHotelId = await readLatestHotelAvailabilitySnapshots(
    rows.map((row) => row.id),
  )
  const nights = computeNights(item.startDate, item.endDate)
  const exactMatchPriceCents = rows
    .flatMap((row) => {
      const availability = availabilityByHotelId.get(row.id) || null
      const assessment = evaluateHotelAvailabilityContext({
        availability: availability
          ? {
              checkInStart: availability.checkInStart,
              checkInEnd: availability.checkInEnd,
              minNights: availability.minNights,
              maxNights: availability.maxNights,
              blockedWeekdays: availability.blockedWeekdays,
            }
          : null,
        checkIn: item.startDate,
        checkOut: item.endDate,
      })

      return assessment.match === 'exact' && assessment.unavailable !== true
        ? [row.priceCents]
        : []
    })
    .sort((left, right) => left - right)[0] ?? null

  return rows.flatMap((row) => {
    const availability = availabilityByHotelId.get(row.id) || null
    const freshness = availability
      ? buildInventoryFreshness({
          checkedAt: availability.snapshotAt,
          profile: 'inventory_snapshot',
        })
      : null
    const assessment = evaluateHotelAvailabilityContext({
      availability: availability
        ? {
            checkInStart: availability.checkInStart,
            checkInEnd: availability.checkInEnd,
            minNights: availability.minNights,
            maxNights: availability.maxNights,
            blockedWeekdays: availability.blockedWeekdays,
          }
        : null,
      checkIn: item.startDate,
      checkOut: item.endDate,
    })
    if (assessment.unavailable) return []

    const availabilityConfidence = buildAvailabilityConfidence({
      freshness,
      ...assessment,
    })
    const meta = [
      `${row.stars}-star stay`,
      `Rated ${row.rating}`,
      row.freeCancellation ? 'Free cancellation' : null,
      row.payLater ? 'Pay later' : null,
    ].filter((entry): entry is string => Boolean(entry))
    const imageUrl = imageByHotelId.get(row.id) || null
    const priceDisplay = resolveReplacementPriceDisplay({
      itemType: 'hotel',
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
    })
    const displayedBaseCents = resolveDisplayedReplacementBaseCents(
      priceDisplay,
      row.priceCents,
    )
    const previewMetadata = {
      previewCurrentPriceCents: row.priceCents,
      previewCurrentCurrencyCode: row.currencyCode,
    }
    const metadata = buildReplacementCandidateMetadata({
      item,
      inventoryId: row.id,
      previewMetadata,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
      displayedBaseCents,
      priceDisplay,
      availabilityConfidence,
      explainability: {
        cheapestExactMatchPriceCents: exactMatchPriceCents,
        preferredLocationType: null,
        selectedLocationType: null,
      },
    })
    const reasons = [
      'Same city',
      item.startDate && item.endDate
        ? 'Keeps current stay dates'
        : 'Dates can stay unchanged',
      nights != null ? `${nights} night${nights === 1 ? '' : 's'}` : null,
      availabilityConfidence.degraded ? availabilityConfidence.supportText : null,
    ].filter((entry): entry is string => Boolean(entry))

    return [{
      inventoryId: row.id,
      itemType: 'hotel' as const,
      title: row.name,
      subtitle: `${row.neighborhood} · ${row.cityName}`,
      imageUrl,
      meta,
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
      candidate: {
        itemType: 'hotel' as const,
        inventoryId: row.id,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        priceCents: displayedBaseCents,
        currencyCode: row.currencyCode,
        title: row.name,
        subtitle: `${row.neighborhood} · ${row.cityName}`,
        imageUrl: imageUrl || undefined,
        meta,
        metadata,
      },
      reasons,
    }]
  }).slice(0, 4)
}

const buildCarReplacementOptions = async (item: TripItemRecord): Promise<TripItemReplacementOption[]> => {
  if (!item.startCityId) return []

  const db = getDb()
  const preferredLocationType = item.liveCarLocationType
  const pickupTypeRankSql =
    preferredLocationType === 'airport' || preferredLocationType === 'city'
      ? sql<number>`case when ${carLocations.locationType} = ${preferredLocationType} then 0 else 1 end`
      : sql<number>`0`
  const conditions = [eq(carInventory.cityId, item.startCityId)]
  if (item.carInventoryId) {
    conditions.push(sql`${carInventory.id} <> ${item.carInventoryId}`)
  }

  const rows = await db
    .select({
      id: carInventory.id,
      providerName: carProviders.name,
      cityName: cities.name,
      locationType: carLocations.locationType,
      locationName: carLocations.name,
      priceCents: carInventory.fromDailyCents,
      currencyCode: carInventory.currencyCode,
      freeCancellation: carInventory.freeCancellation,
      payAtCounter: carInventory.payAtCounter,
      availabilityStart: carInventory.availabilityStart,
      availabilityEnd: carInventory.availabilityEnd,
      minDays: carInventory.minDays,
      maxDays: carInventory.maxDays,
      blockedWeekdays: carInventory.blockedWeekdays,
      rating: carInventory.rating,
      updatedAt: carInventory.updatedAt,
    })
    .from(carInventory)
    .innerJoin(cities, eq(carInventory.cityId, cities.id))
    .innerJoin(carProviders, eq(carInventory.providerId, carProviders.id))
    .innerJoin(carLocations, eq(carInventory.locationId, carLocations.id))
    .where(and(...conditions))
    .orderBy(pickupTypeRankSql, desc(carInventory.rating), asc(carInventory.fromDailyCents), asc(carInventory.id))
    .limit(12)

  const imageByInventoryId = await readPrimaryCarImages(rows.map((row) => row.id))
  const exactMatchPriceCents =
    rows
      .flatMap((row) => {
        const assessment = evaluateCarAvailabilityContext({
          availability: {
            pickupStart: row.availabilityStart,
            pickupEnd: row.availabilityEnd,
            minDays: row.minDays,
            maxDays: row.maxDays,
            blockedWeekdays: toIntList(row.blockedWeekdays),
          },
          pickupDate: item.startDate,
          dropoffDate: item.endDate,
        })

        if (assessment.unavailable) return []
        if (preferredLocationType && row.locationType !== preferredLocationType) {
          return []
        }

        return assessment.match === 'exact' ? [row.priceCents] : []
      })
      .sort((left, right) => left - right)[0] ?? null

  return rows.flatMap((row) => {
    const assessment = evaluateCarAvailabilityContext({
      availability: {
        pickupStart: row.availabilityStart,
        pickupEnd: row.availabilityEnd,
        minDays: row.minDays,
        maxDays: row.maxDays,
        blockedWeekdays: toIntList(row.blockedWeekdays),
      },
      pickupDate: item.startDate,
      dropoffDate: item.endDate,
    })
    if (assessment.unavailable) return []

    const freshness = buildInventoryFreshness({
      checkedAt: row.updatedAt,
      profile: 'inventory_snapshot',
    })
    const availabilityConfidence = buildAvailabilityConfidence({
      freshness,
      ...assessment,
    })
    const pickupLabel = row.locationType === 'airport' ? 'Airport pickup' : 'City pickup'
    const imageUrl = imageByInventoryId.get(row.id) || null
    const meta = [
      pickupLabel,
      `Rated ${row.rating}`,
      row.freeCancellation ? 'Free cancellation' : null,
      row.payAtCounter ? 'Pay at counter' : null,
    ].filter((entry): entry is string => Boolean(entry))
    const priceDisplay = resolveReplacementPriceDisplay({
      itemType: 'car',
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
    })
    const displayedBaseCents = resolveDisplayedReplacementBaseCents(
      priceDisplay,
      row.priceCents,
    )
    const previewMetadata = {
      previewAvailabilityStart: row.availabilityStart,
      previewAvailabilityEnd: row.availabilityEnd,
      previewBlockedWeekdays: toIntList(row.blockedWeekdays),
      previewCurrentPriceCents: row.priceCents,
      previewCurrentCurrencyCode: row.currencyCode,
      previewLocationName: row.locationName,
      previewLocationType: row.locationType,
      previewMaxDays: row.maxDays,
      previewMinDays: row.minDays,
    }
    const metadata = buildReplacementCandidateMetadata({
      item,
      inventoryId: row.id,
      previewMetadata,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
      displayedBaseCents,
      priceDisplay,
      availabilityConfidence,
      explainability: {
        cheapestExactMatchPriceCents: exactMatchPriceCents,
        preferredLocationType,
        selectedLocationType: row.locationType,
      },
    })
    const reasons = [
      'Same city',
      pickupLabel,
      preferredLocationType && row.locationType === preferredLocationType
        ? 'Matches current pickup style'
        : null,
      availabilityConfidence.degraded ? availabilityConfidence.supportText : null,
    ].filter((entry): entry is string => Boolean(entry))

    return [{
      inventoryId: row.id,
      itemType: 'car' as const,
      title: row.providerName,
      subtitle: `${row.locationName} · ${row.cityName}`,
      imageUrl,
      meta,
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: item.startDate,
      endDate: item.endDate,
      candidate: {
        itemType: 'car' as const,
        inventoryId: row.id,
        startDate: item.startDate || undefined,
        endDate: item.endDate || undefined,
        priceCents: displayedBaseCents,
        currencyCode: row.currencyCode,
        title: row.providerName,
        subtitle: `${row.locationName} · ${row.cityName}`,
        imageUrl: imageUrl || undefined,
        meta,
        metadata,
      },
      reasons,
    }]
  }).slice(0, 4)
}

const buildFlightReplacementOptions = async (item: TripItemRecord): Promise<TripItemReplacementOption[]> => {
  if (!item.startCityId || !item.endCityId) return []

  const db = getDb()
  const standardFare = alias(flightFares, 'trip_replace_standard_fare')
  const originCity = alias(cities, 'trip_replace_origin_city')
  const destinationCity = alias(cities, 'trip_replace_destination_city')
  const freshnessSql =
    sql<Date | string | null>`coalesce(${standardFare.updatedAt}, ${flightItineraries.updatedAt})`
  const conditions = [
    eq(flightRoutes.originCityId, item.startCityId),
    eq(flightRoutes.destinationCityId, item.endCityId),
  ]
  const serviceDate = item.liveFlightServiceDate || item.startDate
  if (serviceDate) {
    conditions.push(eq(flightItineraries.serviceDate, serviceDate))
  }
  if (item.liveFlightItineraryType) {
    conditions.push(eq(flightItineraries.itineraryType, item.liveFlightItineraryType))
  }
  if (item.flightItineraryId) {
    conditions.push(sql`${flightItineraries.id} <> ${item.flightItineraryId}`)
  }

  const rows = await db
    .select({
      id: flightItineraries.id,
      airlineName: airlines.name,
      originCityName: originCity.name,
      destinationCityName: destinationCity.name,
      itineraryType: flightItineraries.itineraryType,
      serviceDate: flightItineraries.serviceDate,
      departureAtUtc: flightItineraries.departureAtUtc,
      arrivalAtUtc: flightItineraries.arrivalAtUtc,
      stopsLabel: flightItineraries.stopsLabel,
      cabinClass: flightItineraries.cabinClass,
      priceCents: sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`,
      currencyCode: sql<string>`coalesce(${standardFare.currencyCode}, ${flightItineraries.currencyCode})`,
      seatsRemaining: sql<number | null>`coalesce(${standardFare.seatsRemaining}, ${flightItineraries.seatsRemaining})`,
      freshnessTimestamp: freshnessSql,
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
    .where(and(...conditions))
    .orderBy(asc(sql<number>`coalesce(${standardFare.priceCents}, ${flightItineraries.basePriceCents})`), asc(flightItineraries.departureAtUtc))
    .limit(8)

  const exactMatchPriceCents =
    rows
      .flatMap((row) => {
        const assessment = evaluateFlightAvailabilityContext({
          requestedServiceDate: serviceDate,
          actualServiceDate: row.serviceDate,
        })
        if (assessment.unavailable || (row.seatsRemaining != null && row.seatsRemaining < 1)) {
          return []
        }

        return assessment.match === 'exact' ? [row.priceCents] : []
      })
      .sort((left, right) => left - right)[0] ?? null

  return rows.flatMap((row) => {
    const assessment = evaluateFlightAvailabilityContext({
      requestedServiceDate: serviceDate,
      actualServiceDate: row.serviceDate,
    })
    if (assessment.unavailable || (row.seatsRemaining != null && row.seatsRemaining < 1)) {
      return []
    }

    const freshness = row.freshnessTimestamp
      ? buildInventoryFreshness({
          checkedAt: row.freshnessTimestamp,
          profile: 'inventory_snapshot',
        })
      : null
    const availabilityConfidence = buildAvailabilityConfidence({
      freshness,
      ...assessment,
    })
    const subtitle = `${row.originCityName} → ${row.destinationCityName}`
    const meta = [row.stopsLabel, titleCaseToken(row.cabinClass)].filter(Boolean)
    const priceDisplay = resolveReplacementPriceDisplay({
      itemType: 'flight',
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: row.serviceDate,
      endDate: row.serviceDate,
    })
    const displayedBaseCents = resolveDisplayedReplacementBaseCents(
      priceDisplay,
      row.priceCents,
    )
    const metadata = buildReplacementCandidateMetadata({
      item,
      inventoryId: row.id,
      previewMetadata: {
        previewCurrentPriceCents: row.priceCents,
        previewCurrentCurrencyCode: row.currencyCode,
        previewFlightArrivalAt: toIsoTimestamp(row.arrivalAtUtc),
        previewFlightDepartureAt: toIsoTimestamp(row.departureAtUtc),
        previewFlightItineraryType: row.itineraryType,
        previewFlightSeatsRemaining: row.seatsRemaining,
        previewFlightServiceDate: row.serviceDate,
      },
      currencyCode: row.currencyCode,
      startDate: row.serviceDate,
      endDate: row.serviceDate,
      displayedBaseCents,
      priceDisplay,
      availabilityConfidence,
      explainability: {
        cheapestExactMatchPriceCents: exactMatchPriceCents,
        preferredLocationType: null,
        selectedLocationType: null,
      },
    })
    const reasons = [
      'Same route',
      serviceDate ? 'Same travel date' : 'Closest matching schedule',
      row.seatsRemaining != null ? `${row.seatsRemaining} seats remaining` : null,
      availabilityConfidence.degraded ? availabilityConfidence.supportText : null,
    ].filter((entry): entry is string => Boolean(entry))

    return [{
      inventoryId: row.id,
      itemType: 'flight' as const,
      title: row.airlineName,
      subtitle,
      imageUrl: null,
      meta,
      priceCents: row.priceCents,
      currencyCode: row.currencyCode,
      startDate: row.serviceDate,
      endDate: row.serviceDate,
      candidate: {
        itemType: 'flight' as const,
        inventoryId: row.id,
        startDate: row.serviceDate,
        endDate: row.serviceDate,
        priceCents: displayedBaseCents,
        currencyCode: row.currencyCode,
        title: row.airlineName,
        subtitle,
        meta,
        metadata,
      },
      reasons,
    }]
  }).slice(0, 4)
}

const requireTripItemRecord = (items: TripItemRecord[], tripId: number, itemId: number) => {
  const item = items.find((entry) => entry.id === itemId)
  if (!item) {
    throw new TripRepoError(
      'trip_item_not_found',
      `Trip item ${itemId} was not found on trip ${tripId}.`,
    )
  }

  return item
}

const applyPreviewReorder = (items: TripItemRecord[], orderedItemIds: number[]) => {
  const requestedIds = orderedItemIds.map((value) => Number.parseInt(String(value), 10))
  const existingIds = items
    .slice()
    .sort((left, right) => left.position - right.position || left.id - right.id)
    .map((item) => item.id)
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

  const byId = new Map(items.map((item) => [item.id, item]))
  return requestedIds.map((itemId, index) => ({
    ...cloneTripItemRecord(byId.get(itemId) as TripItemRecord),
    position: index,
  }))
}

const formatPreviewScheduleLabel = (item: TripItem) => {
  const day = item.liveFlightServiceDate || item.startDate || item.endDate || 'Unscheduled'
  const time =
    item.itemType === 'flight' && item.liveFlightDepartureAt
      ? item.liveFlightDepartureAt.slice(11, 16)
      : item.itemType === 'flight'
        ? 'date only'
        : `position ${item.position + 1}`

  return `${day} · ${time}`
}

const buildTimingImpact = (
  currentTrip: TripDetails,
  nextTrip: TripDetails,
  actionType: TripEditPreviewActionType,
) => {
  const currentById = new Map(currentTrip.items.map((item) => [item.id, item]))
  const changedItems = nextTrip.items
    .flatMap((item) => {
      const current = currentById.get(item.id)
      if (!current) return []

      const previousLabel = formatPreviewScheduleLabel(current)
      const nextLabel = formatPreviewScheduleLabel(item)
      const positionChanged = current.position !== item.position
      const scheduleChanged = previousLabel !== nextLabel
      if (!positionChanged && !scheduleChanged) return []

      return [
        {
          itemId: item.id,
          title: item.title,
          kind: positionChanged && scheduleChanged ? 'position_and_schedule' : positionChanged ? 'position' : 'schedule',
          previousLabel,
          nextLabel,
        } satisfies TripEditPreview['timingImpact']['changedItems'][number],
      ]
    })
    .slice(0, 4)

  if (actionType === 'remove') {
    return {
      summary: `This removes 1 item and rechecks the remaining itinerary timing.`,
      changedItems,
    }
  }

  if (!changedItems.length) {
    return {
      summary: 'No downstream timing shifts detected from this edit.',
      changedItems,
    }
  }

  return {
    summary: `${changedItems.length} scheduled item${changedItems.length === 1 ? '' : 's'} shift${changedItems.length === 1 ? 's' : ''} in the previewed itinerary.`,
    changedItems,
  }
}

const buildPriceImpact = (currentTrip: TripDetails, nextTrip: TripDetails) => {
  const currencyCode = nextTrip.pricing.currencyCode || currentTrip.pricing.currencyCode
  const snapshotDeltaCents =
    currentTrip.pricing.snapshotTotalCents != null && nextTrip.pricing.snapshotTotalCents != null
      ? nextTrip.pricing.snapshotTotalCents - currentTrip.pricing.snapshotTotalCents
      : null
  const currentDeltaCents =
    currentTrip.pricing.currentTotalCents != null && nextTrip.pricing.currentTotalCents != null
      ? nextTrip.pricing.currentTotalCents - currentTrip.pricing.currentTotalCents
      : null

  let summary = 'Price delta unavailable with the current itinerary data.'
  if (currencyCode && snapshotDeltaCents != null) {
    if (snapshotDeltaCents === 0) {
      summary = 'Snapshot total stays unchanged in this preview.'
    } else {
      summary = `Snapshot total ${snapshotDeltaCents > 0 ? 'increases' : 'decreases'} by ${formatMoneyFromCents(
        Math.abs(snapshotDeltaCents),
        currencyCode,
      )}.`
    }
  }

  return {
    currencyCode,
    snapshotDeltaCents,
    currentDeltaCents,
    summary,
  }
}

const buildCoherenceImpact = (currentTrip: TripDetails, nextTrip: TripDetails) => {
  const blockingDelta =
    nextTrip.intelligence.issueCounts.blocking - currentTrip.intelligence.issueCounts.blocking
  const warningDelta =
    nextTrip.intelligence.issueCounts.warning - currentTrip.intelligence.issueCounts.warning

  let status: 'improved' | 'unchanged' | 'riskier' | 'mixed' = 'unchanged'
  if ((blockingDelta < 0 || warningDelta < 0) && (blockingDelta > 0 || warningDelta > 0)) {
    status = 'mixed'
  } else if (blockingDelta < 0 || warningDelta < 0) {
    status = 'improved'
  } else if (blockingDelta > 0 || warningDelta > 0) {
    status = 'riskier'
  }

  let summary = 'Coherence checks stay unchanged in this preview.'
  if (status === 'improved') {
    summary = 'Preview reduces itinerary conflicts or warnings.'
  } else if (status === 'riskier') {
    summary = 'Preview introduces additional itinerary conflicts or warnings.'
  } else if (status === 'mixed') {
    summary = 'Preview resolves some issues but introduces others.'
  }

  return {
    status,
    blockingDelta,
    warningDelta,
    summary,
  }
}

const buildPreviewLimitations = (
  currentTrip: TripDetails,
  nextTrip: TripDetails,
  autoRebalanced: boolean,
) => {
  const limitations: string[] = []

  if (currentTrip.pricing.hasMixedCurrencies || nextTrip.pricing.hasMixedCurrencies) {
    limitations.push('Price deltas are partial because the itinerary mixes currencies.')
  } else if (
    currentTrip.pricing.currentTotalCents == null ||
    nextTrip.pricing.currentTotalCents == null
  ) {
    limitations.push('Live total deltas are unavailable because at least one item has no comparable current price.')
  }

  if (nextTrip.pricing.hasPartialPricing) {
    limitations.push('Some hotel or car totals still use unit pricing because dates are incomplete.')
  }

  if (autoRebalanced && nextTrip.editing.lockedItemCount) {
    limitations.push('Locked items stayed anchored while auto-rebalance reflowed the remaining itinerary.')
  }

  return limitations
}

const buildTripEditChangeSummary = (
  actionType: TripEditPreviewActionType,
  focusItem: TripItem,
  preview: Pick<
    TripEditPreview,
    | 'autoRebalanced'
    | 'bundleImpact'
    | 'priceImpact'
    | 'timingImpact'
    | 'coherenceImpact'
  >,
): TripChangeSummary => {
  const impactParts = [preview.timingImpact.summary]

  if (preview.coherenceImpact.status !== 'unchanged') {
    impactParts.push(preview.coherenceImpact.summary)
  }

  if (
    preview.priceImpact.snapshotDeltaCents != null &&
    preview.priceImpact.snapshotDeltaCents !== 0
  ) {
    impactParts.push(preview.priceImpact.summary)
  }

  if (preview.bundleImpact) {
    impactParts.push(preview.bundleImpact.strengthSummary)
  }

  const safetyLevel: TripChangeSummary['safetyLevel'] =
    actionType === 'remove' ||
    preview.autoRebalanced ||
    preview.timingImpact.changedItems.length >= 2 ||
    preview.coherenceImpact.status === 'riskier' ||
    preview.coherenceImpact.status === 'mixed'
      ? 'major'
      : 'minor'

  if (actionType === 'remove') {
    return {
      safetyLevel,
      headline: 'Review itinerary removal',
      whatChanged: `${focusItem.title} will be removed from the itinerary.`,
      whyChanged:
        'Removing a scheduled stop can create downstream timing changes, so it stays in draft until you apply it.',
      impactSummary: impactParts.join(' '),
    }
  }

  if (actionType === 'reorder') {
    return {
      safetyLevel,
      headline:
        safetyLevel === 'major'
          ? 'Review major itinerary reorder'
          : 'Review itinerary reorder',
      whatChanged: `${focusItem.title} will move within the itinerary order.`,
      whyChanged:
        'Moving one stop can shift sequencing for nearby items, so timing and coherence are recalculated before apply.',
      impactSummary: impactParts.join(' '),
    }
  }

  return {
    safetyLevel,
    headline:
      preview.bundleImpact
        ? safetyLevel === 'major'
          ? 'Review major bundle swap'
          : 'Review bundle swap'
        : safetyLevel === 'major'
          ? 'Review major itinerary replacement'
          : 'Review itinerary replacement',
    whatChanged: preview.bundleImpact
      ? `${focusItem.title} will be swapped while keeping the current bundle context where possible.`
      : `${focusItem.title} will be replaced with a different itinerary option.`,
    whyChanged: preview.autoRebalanced
      ? 'Auto-rebalance is enabled, so unlocked items may move around locked anchors when this replacement lands.'
      : preview.bundleImpact
        ? 'Swapping one bundle component can shift price, timing, coherence, and recommendation strength, so those signals are recalculated before apply.'
        : 'Replacing one inventory option can change price, timing, or itinerary coherence, so the impact is previewed first.',
    impactSummary: impactParts.join(' '),
  }
}

const buildTripEditPreviewResult = (
  actionType: TripEditPreviewActionType,
  focusItem: TripItem,
  currentTrip: TripDetails,
  nextTrip: TripDetails,
  autoRebalanced: boolean,
): TripEditPreview => {
  const priceImpact = buildPriceImpact(currentTrip, nextTrip)
  const timingImpact = buildTimingImpact(currentTrip, nextTrip, actionType)
  const coherenceImpact = buildCoherenceImpact(currentTrip, nextTrip)
  const nextFocusItem = nextTrip.items.find((item) => item.id === focusItem.id) || null
  const bundleImpact =
    actionType === 'replace' && nextFocusItem
      ? buildTripEditBundleImpact({
          currentMetadata: focusItem.metadata,
          nextMetadata: nextFocusItem.metadata,
          focusItemId: focusItem.id,
          nextTripItemIds: nextTrip.items.map((item) => item.id),
        })
      : null
  const preview: TripEditPreview = {
    actionType,
    trip: nextTrip,
    autoRebalanced,
    lockedItemIdsPreserved: currentTrip.items.filter((item) => item.locked).map((item) => item.id),
    limitations: buildPreviewLimitations(currentTrip, nextTrip, autoRebalanced),
    priceImpact,
    timingImpact,
    coherenceImpact,
    bundleImpact,
    changeSummary: {
      safetyLevel: 'minor',
      headline: '',
      whatChanged: '',
      whyChanged: '',
      impactSummary: '',
    },
  }

  preview.changeSummary = buildTripEditChangeSummary(actionType, focusItem, preview)
  return preview
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
    return buildTripDetailsFromRecords(base, itemRecords, {
      revalidate: options.revalidate,
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

export async function listTripItemReplacementOptions(
  tripId: number,
  itemId: number,
): Promise<TripItemReplacementOption[]> {
  return withTripSchemaGuard(async () => {
    const base = await readTripBase(tripId)
    if (!base) {
      throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found.`)
    }

    const items = await readTripItems(tripId)
    const item = requireTripItemRecord(items, tripId, itemId)

    if (item.itemType === 'hotel') return buildHotelReplacementOptions(item)
    if (item.itemType === 'car') return buildCarReplacementOptions(item)
    return buildFlightReplacementOptions(item)
  })
}

export async function previewTripItemEdit(
  tripId: number,
  itemId: number,
  input:
    | {
        actionType: 'reorder'
        orderedItemIds: number[]
      }
    | {
        actionType: 'remove'
      }
    | {
        actionType: 'replace'
        candidate: TripItemCandidate
      },
): Promise<TripEditPreview> {
  return withTripSchemaGuard(async () => {
    const base = await readTripBase(tripId)
    if (!base) {
      throw new TripRepoError('trip_not_found', `Trip ${tripId} was not found.`)
    }

    const currentItemRecords = await readTripItems(tripId)
    requireTripItemRecord(currentItemRecords, tripId, itemId)

    let nextItemRecords = currentItemRecords.map(cloneTripItemRecord)
    let autoRebalanced = false

    if (input.actionType === 'reorder') {
      nextItemRecords = applyPreviewReorder(nextItemRecords, input.orderedItemIds)
    } else if (input.actionType === 'remove') {
      nextItemRecords = normalizeSimulatedTripItemPositions(
        nextItemRecords
          .filter((item) => item.id !== itemId)
          .sort((left, right) => left.position - right.position || left.id - right.id),
      )
    } else {
      const db = getDb()
      await db.transaction(async (tx) => {
        const existingItem = requireTripItemRecord(nextItemRecords, tripId, itemId)
        const replacement = await buildReplacementTripItemRecord(tx, existingItem, input.candidate)
        nextItemRecords = nextItemRecords.map((item) => (item.id === itemId ? replacement : item))
      })

      if (readTripAutoRebalance(base.metadata)) {
        nextItemRecords = applyLockedAutoRebalance(nextItemRecords)
        autoRebalanced = true
      } else {
        nextItemRecords = normalizeSimulatedTripItemPositions(
          nextItemRecords
            .slice()
            .sort((left, right) => left.position - right.position || left.id - right.id),
        )
      }
    }

    const [currentTrip, nextTrip] = await Promise.all([
      buildTripDetailsFromRecords(base, currentItemRecords, { preview: true }),
      buildTripDetailsFromRecords(base, nextItemRecords, { preview: true }),
    ])
    const focusItem = currentTrip.items.find((item) => item.id === itemId)

    if (!focusItem) {
      throw new TripRepoError(
        'trip_item_not_found',
        `Trip item ${itemId} was not found on trip ${tripId}.`,
      )
    }

    return buildTripEditPreviewResult(
      input.actionType,
      focusItem,
      currentTrip,
      nextTrip,
      autoRebalanced,
    )
  })
}

export async function applyTripItemEdit(
  tripId: number,
  itemId: number,
  input:
    | {
        actionType: 'reorder'
        orderedItemIds: number[]
      }
    | {
        actionType: 'remove'
      }
    | {
        actionType: 'replace'
        candidate: TripItemCandidate
      },
): Promise<{
  trip: TripDetails
  appliedChange: TripAppliedChange | null
}> {
  return withTripSchemaGuard(async () => {
    const preview = await previewTripItemEdit(tripId, itemId, input)
    const currentItemRecords = await readTripItems(tripId)
    requireTripItemRecord(currentItemRecords, tripId, itemId)

    let trip: TripDetails
    if (input.actionType === 'reorder') {
      trip = await reorderTripItems(tripId, input.orderedItemIds)
    } else if (input.actionType === 'remove') {
      trip = await removeItemFromTrip(tripId, itemId)
    } else {
      trip = await updateTripItem(tripId, itemId, {
        candidate: input.candidate,
      })
    }

    return {
      trip,
      appliedChange:
        preview.changeSummary.safetyLevel === 'major'
          ? {
              summary: preview.changeSummary,
              preview,
              rollbackDraft: buildTripRollbackDraft(currentItemRecords),
            }
          : null,
    }
  })
}

export async function restoreTripRollbackDraft(
  tripId: number,
  draft: TripRollbackDraft,
): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)

      await tx.delete(tripItems).where(eq(tripItems.tripId, tripId))

      if (draft.items.length) {
        await tx.insert(tripItems).values(
          draft.items.map((item) => ({
            id: item.id,
            tripId,
            itemType: item.itemType,
            position: item.position,
            hotelId: item.hotelId,
            flightItineraryId: item.flightItineraryId,
            carInventoryId: item.carInventoryId,
            startCityId: item.startCityId,
            endCityId: item.endCityId,
            startDate: item.startDate,
            endDate: item.endDate,
            snapshotPriceCents: item.snapshotPriceCents,
            snapshotCurrencyCode: item.snapshotCurrencyCode,
            snapshotTimestamp: new Date(item.snapshotTimestamp),
            title: item.title,
            subtitle: item.subtitle,
            imageUrl: item.imageUrl,
            meta: item.meta,
            metadata: item.metadata,
          })),
        )
      }

      await normalizeTripItemPositions(tx, tripId)
      await syncTripDatesIfAuto(tx, tripId)
      await touchTrip(tx, tripId)
    })

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError(
        'trip_not_found',
        `Trip ${tripId} was not found after restoring the itinerary draft.`,
      )
    }

    return details
  })
}

export async function updateTripItem(
  tripId: number,
  itemId: number,
  input: {
    locked?: boolean
    candidate?: TripItemCandidate
  },
): Promise<TripDetails> {
  return withTripSchemaGuard(async () => {
    const db = getDb()
    let shouldAutoRebalance = false

    if (input.candidate) {
      requireTripSnapshotColumns()
    }

    await db.transaction(async (tx) => {
      await assertTripExists(tx, tripId)

      const itemRows = await tx
        .select({
          id: tripItems.id,
          itemType: tripItems.itemType,
          position: tripItems.position,
          createdAt: tripItems.createdAt,
          metadata: tripItems.metadata,
        })
        .from(tripItems)
        .where(and(eq(tripItems.tripId, tripId), eq(tripItems.id, itemId)))
        .limit(1)

      const existingItem = itemRows[0]
      if (!existingItem) {
        throw new TripRepoError(
          'trip_item_not_found',
          `Trip item ${itemId} was not found on trip ${tripId}.`,
        )
      }

      const currentMetadata = normalizeMetadata(existingItem.metadata)
      const locked =
        input.locked === undefined ? readTripItemLocked(currentMetadata) : input.locked

      if (input.candidate) {
        const snapshot = await resolveTripItemSnapshot(tx, input.candidate)
        if (snapshot.itemType !== existingItem.itemType) {
          throw new TripRepoError(
            'invalid_edit',
            `Replacement item type ${snapshot.itemType} does not match existing ${existingItem.itemType}.`,
          )
        }

        // Snapshot columns are intentionally immutable via DB trigger, so a
        // replacement swap needs to recreate the row instead of updating it.
        await tx
          .delete(tripItems)
          .where(and(eq(tripItems.tripId, tripId), eq(tripItems.id, itemId)))

        await tx.insert(tripItems).values({
            id: itemId,
            tripId,
            itemType: snapshot.itemType,
            position: existingItem.position,
            hotelId: snapshot.hotelId,
            flightItineraryId: snapshot.flightItineraryId,
            carInventoryId: snapshot.carInventoryId,
            startCityId: snapshot.startCityId,
            endCityId: snapshot.endCityId,
            startDate: snapshot.startDate,
            endDate: snapshot.endDate,
            snapshotPriceCents: snapshot.snapshotPriceCents,
            snapshotCurrencyCode: snapshot.snapshotCurrencyCode,
            snapshotTimestamp: new Date(),
            title: snapshot.title,
            subtitle: snapshot.subtitle,
            imageUrl: snapshot.imageUrl,
            meta: snapshot.meta,
            metadata: writeTripItemLocked(snapshot.metadata, locked),
            createdAt: existingItem.createdAt,
            updatedAt: new Date(),
          })

        shouldAutoRebalance = readTripAutoRebalance((await tx
          .select({ metadata: trips.metadata })
          .from(trips)
          .where(eq(trips.id, tripId))
          .limit(1))[0]?.metadata)
      } else if (input.locked !== undefined) {
        await tx
          .update(tripItems)
          .set({
            metadata: writeTripItemLocked(currentMetadata, input.locked),
            updatedAt: new Date(),
          })
          .where(and(eq(tripItems.tripId, tripId), eq(tripItems.id, itemId)))
      } else {
        throw new TripRepoError('invalid_edit', 'No trip item change was provided.')
      }

      await syncTripDatesIfAuto(tx, tripId)
      await touchTrip(tx, tripId)
    })

    if (shouldAutoRebalance) {
      const nextItems = await readTripItems(tripId)
      const currentOrder = nextItems
        .slice()
        .sort((left, right) => left.position - right.position || left.id - right.id)
        .map((item) => item.id)
      const nextOrder = applyLockedAutoRebalance(nextItems).map((item) => item.id)

      if (JSON.stringify(currentOrder) !== JSON.stringify(nextOrder)) {
        return reorderTripItems(tripId, nextOrder)
      }
    }

    const details = await getTripDetails(tripId)
    if (!details) {
      throw new TripRepoError(
        'trip_not_found',
        `Trip ${tripId} was not found after updating an item.`,
      )
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
