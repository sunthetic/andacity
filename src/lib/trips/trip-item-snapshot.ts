import { parseInventoryId, type ParsedInventoryId } from '~/lib/inventory/inventory-id'
import type { TripItemType } from '~/types/trips/trip'

const SNAPSHOT_METADATA_PREVIEW_KEYS = [
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toTrimmedString = (value: unknown) => String(value ?? '').trim()

const toFiniteInteger = (value: unknown) => {
  if (value == null || value === '') return null

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.round(parsed))
}

export class TripItemSnapshotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TripItemSnapshotError'
  }
}

export const validateTripItemInventoryId = (
  itemType: TripItemType,
  inventoryId: string,
): ParsedInventoryId => {
  const value = toTrimmedString(inventoryId)
  if (!value) {
    throw new TripItemSnapshotError('Trip item inventoryId is required.')
  }

  const parsed = parseInventoryId(value)
  if (!parsed) {
    throw new TripItemSnapshotError(
      `Trip item inventoryId "${value}" is not a canonical inventory ID.`,
    )
  }

  if (parsed.vertical !== itemType) {
    throw new TripItemSnapshotError(
      `Trip item inventoryId must use the "${itemType}:" canonical prefix for ${itemType} items.`,
    )
  }

  return parsed
}

export const normalizeTripItemSnapshotPriceCents = (value: unknown): number | null =>
  toFiniteInteger(value)

export const normalizeTripItemSnapshotCurrencyCode = (value: unknown): string | null => {
  const token = toTrimmedString(value).toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : null
}

export const normalizeTripItemSnapshotTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const buildInventoryMetadata = (parsed: ParsedInventoryId): Record<string, unknown> => {
  if (parsed.vertical === 'hotel') {
    return {
      hotelId: parsed.hotelId,
      provider: parsed.provider,
      providerOfferId: parsed.providerOfferId,
      ratePlanId: parsed.ratePlanId,
      boardType: parsed.boardType,
      cancellationPolicy: parsed.cancellationPolicy,
      roomType: parsed.roomType,
      occupancy: parsed.occupancy,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
    }
  }

  if (parsed.vertical === 'car') {
    return {
      providerLocationId: parsed.providerLocationId,
      vehicleClass: parsed.vehicleClass,
      pickupDateTime: parsed.pickupDateTime,
      dropoffDateTime: parsed.dropoffDateTime,
    }
  }

  return {
    carrier: parsed.carrier,
    flightNumber: parsed.flightNumber,
    origin: parsed.origin,
    destination: parsed.destination,
    serviceDate: parsed.departDate,
  }
}

export const buildTripItemSnapshotMetadata = (input: {
  itemType: TripItemType
  inventoryId: string
  metadata?: unknown
  providerInventoryId?: unknown
}) => {
  const parsed = validateTripItemInventoryId(input.itemType, input.inventoryId)
  const metadata = isRecord(input.metadata) ? { ...input.metadata } : {}

  for (const key of SNAPSHOT_METADATA_PREVIEW_KEYS) {
    delete metadata[key]
  }

  delete metadata.inventoryId

  const providerInventoryId = toFiniteInteger(input.providerInventoryId)
  if (providerInventoryId != null && providerInventoryId > 0) {
    metadata.providerInventoryId = providerInventoryId
  } else {
    delete metadata.providerInventoryId
  }

  return {
    ...metadata,
    ...buildInventoryMetadata(parsed),
  }
}

export const normalizeTripItemSnapshotCore = (input: {
  itemType: TripItemType
  inventoryId: string
  snapshotPriceCents: unknown
  snapshotCurrencyCode: unknown
  snapshotTimestamp?: Date | string | null
}) => {
  const parsedInventory = validateTripItemInventoryId(input.itemType, input.inventoryId)

  return {
    parsedInventory,
    inventoryId: parsedInventory.inventoryId,
    snapshotPriceCents: normalizeTripItemSnapshotPriceCents(input.snapshotPriceCents),
    snapshotCurrencyCode: normalizeTripItemSnapshotCurrencyCode(input.snapshotCurrencyCode),
    snapshotTimestamp: normalizeTripItemSnapshotTimestamp(input.snapshotTimestamp),
  }
}
