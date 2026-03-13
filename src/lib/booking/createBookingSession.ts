import { buildBookingSession, buildPriceQuoteFromBookableEntity } from '~/lib/booking/buildBookingSession'
import { bookingSessionStore, persistBookingSession, type BookingSessionStore } from '~/lib/booking/bookingSessionStore'
import { detectPriceDrift } from '~/lib/inventory/detectPriceDrift'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import { resolveInventoryRecord } from '~/lib/inventory/resolveInventory'
import type { BookableEntity } from '~/types/bookable-entity'
import type { BookingSession } from '~/types/booking'
import type { ResolvedInventoryRecord } from '~/types/inventory'
import type { PriceQuote } from '~/types/pricing'
import type { TripItem } from '~/types/trips/trip'

type DetectPriceDriftFn = typeof detectPriceDrift
type ResolveInventoryRecordFn = typeof resolveInventoryRecord

export type CreateBookingSessionOptions = {
  now?: Date | string | null
  ttlMs?: number
  provider?: string | null
  tripItem?: TripItem | null
  snapshotPrice?: PriceQuote | null
  sessionIdFactory?: () => string
  store?: BookingSessionStore
  detectPriceDriftFn?: DetectPriceDriftFn
  resolveInventoryRecordFn?: ResolveInventoryRecordFn
}

export type CreateBookingSessionFromTripItemOptions = Omit<
  CreateBookingSessionOptions,
  'tripItem'
> & {
  getTripItemFn?: (tripItemId: number) => Promise<TripItem | null> | TripItem | null
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const readTripItemProviderInventoryId = (tripItem: TripItem | null | undefined) => {
  if (!tripItem) return null
  if (tripItem.itemType === 'hotel') return tripItem.hotelId
  if (tripItem.itemType === 'flight') return tripItem.flightItineraryId
  return tripItem.carInventoryId
}

const buildSnapshotPriceFromTripItem = (tripItem: TripItem): PriceQuote | null => {
  const currency = toNullableText(tripItem.snapshotCurrencyCode)?.toUpperCase() || null
  if (tripItem.snapshotPriceCents == null || !currency) {
    return null
  }

  return {
    currency,
    amount: tripItem.snapshotPriceCents / 100,
  }
}

const resolveSnapshotPrice = (input: {
  entity: BookableEntity
  tripItem?: TripItem | null
  snapshotPrice?: PriceQuote | null
}) => {
  if (input.snapshotPrice) {
    return input.snapshotPrice
  }

  if (input.tripItem) {
    return buildSnapshotPriceFromTripItem(input.tripItem)
  }

  return buildPriceQuoteFromBookableEntity(input.entity)
}

const resolveLiveInventory = async (
  inventoryId: string,
  options: CreateBookingSessionOptions,
): Promise<ResolvedInventoryRecord | null> => {
  const resolveInventoryRecordFn = options.resolveInventoryRecordFn || resolveInventoryRecord

  try {
    return await resolveInventoryRecordFn({
      inventoryId,
      provider: options.provider,
      providerInventoryId: readTripItemProviderInventoryId(options.tripItem),
      checkedAt: normalizeTimestamp(options.now),
    })
  } catch {
    return null
  }
}

const confirmLivePrice = async (
  inventoryId: string,
  entity: BookableEntity,
  snapshotPrice: PriceQuote | null,
  options: CreateBookingSessionOptions,
) => {
  if (!snapshotPrice) return null

  const detectPriceDriftFn = options.detectPriceDriftFn || detectPriceDrift

  try {
    const result = await detectPriceDriftFn(inventoryId, snapshotPrice, {
      provider: options.provider,
      resolvedInventory: entity,
    })

    if (result.status !== 'valid' || !result.newPrice) {
      return null
    }

    return result.newPrice
  } catch {
    return null
  }
}

export async function createBookingSession(
  inventoryId: string,
  options: CreateBookingSessionOptions = {},
): Promise<BookingSession | null> {
  const normalizedInventoryId = String(inventoryId || '').trim()
  if (!normalizedInventoryId || !parseInventoryId(normalizedInventoryId)) {
    return null
  }

  const liveInventory = await resolveLiveInventory(normalizedInventoryId, options)
  if (!liveInventory || liveInventory.isAvailable === false) {
    return null
  }

  const snapshotPrice = resolveSnapshotPrice({
    entity: liveInventory.entity,
    tripItem: options.tripItem,
    snapshotPrice: options.snapshotPrice,
  })
  const livePrice = await confirmLivePrice(
    normalizedInventoryId,
    liveInventory.entity,
    snapshotPrice,
    options,
  )

  if (!livePrice) {
    return null
  }

  const session = buildBookingSession({
    entity: liveInventory.entity,
    price: livePrice,
    createdAt: liveInventory.checkedAt,
    ttlMs: options.ttlMs,
    source: options.tripItem ? 'trip_item' : 'inventory',
    tripItemId: options.tripItem?.id ?? null,
    sessionId: options.sessionIdFactory?.(),
  })

  if (!session) {
    return null
  }

  return persistBookingSession(session, options.store || bookingSessionStore)
}

export async function createBookingSessionFromTripItem(
  tripItemOrId: TripItem | number,
  options: CreateBookingSessionFromTripItemOptions = {},
): Promise<BookingSession | null> {
  const { getTripItemFn, ...createOptions } = options
  const tripItem =
    typeof tripItemOrId === 'number'
      ? ((await getTripItemFn?.(tripItemOrId)) ?? null)
      : tripItemOrId

  if (!tripItem) {
    return null
  }

  return createBookingSession(tripItem.inventoryId, {
    ...createOptions,
    tripItem,
  })
}
