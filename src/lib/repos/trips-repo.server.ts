import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb } from '~/lib/db/client.server'
import {
  airlines,
  carInventory,
  carLocations,
  carProviders,
  cities,
  flightItineraries,
  flightRoutes,
  hotels,
  tripDates,
  tripItems,
  trips,
} from '~/lib/db/schema'
import type {
  TripDetails,
  TripItem,
  TripItemCandidate,
  TripListItem,
  TripStatus,
} from '~/types/trips/trip'

export class TripRepoError extends Error {
  constructor(
    readonly code:
      | 'trip_not_found'
      | 'trip_item_not_found'
      | 'inventory_not_found'
      | 'invalid_reorder'
      | 'trip_schema_missing',
    message: string,
  ) {
    super(message)
    this.name = 'TripRepoError'
  }
}

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
  if (code === '42P01' || code === '3F000' || code === '42704') return true

  const message = String(source.message || source.cause?.message || '').toLowerCase()
  if (!message) return false

  return (
    message.includes('relation') && message.includes('does not exist') &&
    (message.includes('trip_items') || message.includes('trip_dates') || message.includes('trips'))
  )
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

const DEFAULT_TRIP_NAME = 'Untitled trip'
const DEFAULT_CURRENCY = 'USD'

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

const normalizeTripStatus = (value: unknown): TripStatus => {
  if (value === 'planning') return 'planning'
  if (value === 'ready') return 'ready'
  if (value === 'archived') return 'archived'
  return 'draft'
}

const titleCaseToken = (value: string) => {
  return String(value || '')
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
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

const resolveHotelTripItem = async (tx: any, candidate: TripItemCandidate) => {
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
    itemType: 'hotel' as const,
    hotelId: row.id,
    flightItineraryId: null,
    carInventoryId: null,
    startCityId: row.cityId,
    endCityId: row.cityId,
    startDate,
    endDate,
    priceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    currencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.name,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizeMeta(candidate.meta),
    metadata: normalizeMetadata(candidate.metadata),
  }
}

const resolveCarTripItem = async (tx: any, candidate: TripItemCandidate) => {
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
    itemType: 'car' as const,
    hotelId: null,
    flightItineraryId: null,
    carInventoryId: row.id,
    startCityId: row.cityId,
    endCityId: row.cityId,
    startDate,
    endDate,
    priceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    currencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.providerName,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizeMeta(candidate.meta),
    metadata: normalizeMetadata(candidate.metadata),
  }
}

const resolveFlightTripItem = async (tx: any, candidate: TripItemCandidate) => {
  const originCity = alias(cities, 'trip_origin_city')
  const destinationCity = alias(cities, 'trip_destination_city')

  const rows = await tx
    .select({
      id: flightItineraries.id,
      serviceDate: flightItineraries.serviceDate,
      currencyCode: flightItineraries.currencyCode,
      priceCents: flightItineraries.basePriceCents,
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
    .where(eq(flightItineraries.id, candidate.inventoryId))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TripRepoError(
      'inventory_not_found',
      `Flight itinerary ${candidate.inventoryId} was not found.`,
    )
  }

  const startDate = toIsoDate(candidate.startDate || row.serviceDate)
  const endDate = toIsoDate(candidate.endDate || row.serviceDate)
  const fallbackSubtitle = `${row.originCityName} → ${row.destinationCityName}`
  const fallbackMeta = [row.stopsLabel, titleCaseToken(row.cabinClass)]

  return {
    itemType: 'flight' as const,
    hotelId: null,
    flightItineraryId: row.id,
    carInventoryId: null,
    startCityId: row.originCityId,
    endCityId: row.destinationCityId,
    startDate,
    endDate,
    priceCents: normalizePriceCents(candidate.priceCents, row.priceCents),
    currencyCode: normalizeCurrencyCode(candidate.currencyCode || row.currencyCode),
    title: String(candidate.title || '').trim() || row.airlineName,
    subtitle: String(candidate.subtitle || '').trim() || fallbackSubtitle,
    imageUrl: String(candidate.imageUrl || '').trim() || null,
    meta: normalizeMeta(candidate.meta).length ? normalizeMeta(candidate.meta) : fallbackMeta,
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

const readTripItems = async (tripId: number): Promise<TripItem[]> => {
  const db = getDb()
  const startCity = alias(cities, 'trip_items_start_city')
  const endCity = alias(cities, 'trip_items_end_city')

  const rows = await db
    .select({
      id: tripItems.id,
      tripId: tripItems.tripId,
      itemType: tripItems.itemType,
      position: tripItems.position,
      title: tripItems.title,
      subtitle: tripItems.subtitle,
      startDate: tripItems.startDate,
      endDate: tripItems.endDate,
      priceCents: tripItems.priceCents,
      currencyCode: tripItems.currencyCode,
      imageUrl: tripItems.imageUrl,
      meta: tripItems.meta,
      metadata: tripItems.metadata,
      hotelId: tripItems.hotelId,
      flightItineraryId: tripItems.flightItineraryId,
      carInventoryId: tripItems.carInventoryId,
      startCityName: startCity.name,
      endCityName: endCity.name,
      createdAt: tripItems.createdAt,
      updatedAt: tripItems.updatedAt,
    })
    .from(tripItems)
    .leftJoin(startCity, eq(tripItems.startCityId, startCity.id))
    .leftJoin(endCity, eq(tripItems.endCityId, endCity.id))
    .where(eq(tripItems.tripId, tripId))
    .orderBy(asc(tripItems.position), asc(tripItems.id))

  return rows.map((row) => ({
    id: row.id,
    tripId: row.tripId,
    itemType: row.itemType,
    position: row.position,
    title: row.title,
    subtitle: row.subtitle,
    startDate: row.startDate,
    endDate: row.endDate,
    priceCents: row.priceCents,
    currencyCode: normalizeCurrencyCode(row.currencyCode),
    imageUrl: row.imageUrl,
    meta: normalizeMeta(row.meta),
    metadata: normalizeMetadata(row.metadata),
    hotelId: row.hotelId,
    flightItineraryId: row.flightItineraryId,
    carInventoryId: row.carInventoryId,
    startCityName: row.startCityName,
    endCityName: row.endCityName,
    createdAt: toIsoTimestamp(row.createdAt),
    updatedAt: toIsoTimestamp(row.updatedAt),
  }))
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
}): TripDetails => {
  const totalCents = input.items.reduce((sum, item) => sum + item.priceCents, 0)
  const currencyCode = normalizeCurrencyCode(input.items[0]?.currencyCode || DEFAULT_CURRENCY)

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
    estimatedTotalCents: totalCents,
    currencyCode,
    updatedAt: toIsoTimestamp(input.updatedAt),
    notes: input.notes,
    metadata: input.metadata,
    citiesInvolved: [...citySet],
    items: input.items,
  }
}

export async function createTrip(input: CreateTripInput = {}): Promise<TripDetails> {
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
}

export async function listTrips(): Promise<TripListItem[]> {
  const db = getDb()
  try {
    const itemAgg = db
      .select({
        tripId: tripItems.tripId,
        itemCount: sql<number>`count(${tripItems.id})::int`.as('item_count'),
        estimatedTotalCents:
          sql<number>`coalesce(sum(${tripItems.priceCents}), 0)::int`.as('estimated_total_cents'),
        currencyCode: sql<string>`coalesce(max(${tripItems.currencyCode}), 'USD')`.as('currency_code'),
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
        updatedAt: row.updatedAt,
      }),
    )
  } catch (error) {
    if (isMissingTripSchemaError(error)) {
      throw new TripRepoError(
        'trip_schema_missing',
        'Trip schema is not available in Postgres. Apply migration 0002_trip_foundation.sql.',
      )
    }

    throw error
  }
}

export async function getTripDetails(tripId: number): Promise<TripDetails | null> {
  const base = await readTripBase(tripId)
  if (!base) return null

  const items = await readTripItems(tripId)

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
  })
}

export async function addItemToTrip(tripId: number, candidate: TripItemCandidate): Promise<TripDetails> {
  const db = getDb()
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
      priceCents: snapshot.priceCents,
      currencyCode: snapshot.currencyCode,
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
}

export async function removeItemFromTrip(tripId: number, itemId: number): Promise<TripDetails> {
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
}

export async function reorderTripItems(
  tripId: number,
  orderedItemIds: number[],
): Promise<TripDetails> {
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
}

export async function updateTripMetadata(
  tripId: number,
  input: UpdateTripMetadataInput,
): Promise<TripDetails> {
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
}
