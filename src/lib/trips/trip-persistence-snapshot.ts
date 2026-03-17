import { isBookableEntity } from '~/lib/booking/bookable-entity'
import type { BookableEntity } from '~/types/bookable-entity'
import type {
  TripItemAvailabilitySnapshot,
  TripItemCarAvailabilitySnapshot,
  TripItemFlightAvailabilitySnapshot,
  TripItemHotelAvailabilitySnapshot,
  TripItemInventorySnapshot,
  TripItemType,
} from '~/types/trips/trip'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toIsoDate = (value: unknown) => {
  const text = toNullableText(value)
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const toIsoTimestamp = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const toInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = toInteger(value)
  return parsed != null && parsed > 0 ? parsed : null
}

const toIntList = (value: unknown) => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => toInteger(entry))
    .filter((entry): entry is number => entry != null)
}

const toCarLocationType = (
  value: unknown,
): TripItemCarAvailabilitySnapshot['locationType'] => {
  return value === 'airport' || value === 'city' ? value : null
}

const toFlightItineraryType = (
  value: unknown,
): TripItemFlightAvailabilitySnapshot['itineraryType'] => {
  return value === 'one-way' || value === 'round-trip' ? value : null
}

export const normalizeStoredBookableEntitySnapshot = (
  value: unknown,
  itemType: TripItemType,
  inventoryId: string,
): BookableEntity | null => {
  if (!isBookableEntity(value)) return null
  if (value.vertical !== itemType || value.inventoryId !== inventoryId) return null
  return value
}

export const buildHotelTripItemAvailabilitySnapshot = (input: {
  hotelAvailabilitySnapshotId?: unknown
  snapshotTimestamp?: unknown
  checkInStart?: unknown
  checkInEnd?: unknown
  minNights?: unknown
  maxNights?: unknown
  blockedWeekdays?: unknown
}): TripItemHotelAvailabilitySnapshot | null => {
  const snapshotTimestamp = toIsoTimestamp(input.snapshotTimestamp)
  const hotelAvailabilitySnapshotId = toPositiveInteger(input.hotelAvailabilitySnapshotId)
  const checkInStart = toIsoDate(input.checkInStart)
  const checkInEnd = toIsoDate(input.checkInEnd)
  const minNights = toInteger(input.minNights)
  const maxNights = toInteger(input.maxNights)
  const blockedWeekdays = toIntList(input.blockedWeekdays)

  if (
    !snapshotTimestamp &&
    hotelAvailabilitySnapshotId == null &&
    !checkInStart &&
    !checkInEnd &&
    minNights == null &&
    maxNights == null &&
    !blockedWeekdays.length
  ) {
    return null
  }

  return {
    itemType: 'hotel',
    source: 'hotel_availability_snapshot',
    snapshotTimestamp,
    hotelAvailabilitySnapshotId,
    checkInStart,
    checkInEnd,
    minNights,
    maxNights,
    blockedWeekdays,
  }
}

export const buildCarTripItemAvailabilitySnapshot = (input: {
  snapshotTimestamp?: unknown
  availabilityStart?: unknown
  availabilityEnd?: unknown
  minDays?: unknown
  maxDays?: unknown
  blockedWeekdays?: unknown
  locationType?: unknown
  locationName?: unknown
}): TripItemCarAvailabilitySnapshot | null => {
  const snapshotTimestamp = toIsoTimestamp(input.snapshotTimestamp)
  const availabilityStart = toIsoDate(input.availabilityStart)
  const availabilityEnd = toIsoDate(input.availabilityEnd)
  const minDays = toInteger(input.minDays)
  const maxDays = toInteger(input.maxDays)
  const blockedWeekdays = toIntList(input.blockedWeekdays)
  const locationType = toCarLocationType(input.locationType)
  const locationName = toNullableText(input.locationName)

  if (
    !snapshotTimestamp &&
    !availabilityStart &&
    !availabilityEnd &&
    minDays == null &&
    maxDays == null &&
    !blockedWeekdays.length &&
    !locationType &&
    !locationName
  ) {
    return null
  }

  return {
    itemType: 'car',
    source: 'car_inventory',
    snapshotTimestamp,
    availabilityStart,
    availabilityEnd,
    minDays,
    maxDays,
    blockedWeekdays,
    locationType,
    locationName,
  }
}

export const buildFlightTripItemAvailabilitySnapshot = (input: {
  snapshotTimestamp?: unknown
  serviceDate?: unknown
  departureAt?: unknown
  arrivalAt?: unknown
  seatsRemaining?: unknown
  itineraryType?: unknown
}): TripItemFlightAvailabilitySnapshot | null => {
  const snapshotTimestamp = toIsoTimestamp(input.snapshotTimestamp)
  const serviceDate = toIsoDate(input.serviceDate)
  const departureAt = toIsoTimestamp(input.departureAt)
  const arrivalAt = toIsoTimestamp(input.arrivalAt)
  const seatsRemaining = toInteger(input.seatsRemaining)
  const itineraryType = toFlightItineraryType(input.itineraryType)

  if (
    !snapshotTimestamp &&
    !serviceDate &&
    !departureAt &&
    !arrivalAt &&
    seatsRemaining == null &&
    !itineraryType
  ) {
    return null
  }

  return {
    itemType: 'flight',
    source: 'flight_inventory',
    snapshotTimestamp,
    serviceDate,
    departureAt,
    arrivalAt,
    seatsRemaining,
    itineraryType,
  }
}

export const normalizeStoredTripItemAvailabilitySnapshot = (
  itemType: TripItemType,
  value: unknown,
): TripItemAvailabilitySnapshot | null => {
  const snapshot = isRecord(value) ? value : {}

  if (itemType === 'hotel') {
    return buildHotelTripItemAvailabilitySnapshot({
      hotelAvailabilitySnapshotId: snapshot.hotelAvailabilitySnapshotId,
      snapshotTimestamp: snapshot.snapshotTimestamp,
      checkInStart: snapshot.checkInStart,
      checkInEnd: snapshot.checkInEnd,
      minNights: snapshot.minNights,
      maxNights: snapshot.maxNights,
      blockedWeekdays: snapshot.blockedWeekdays,
    })
  }

  if (itemType === 'car') {
    return buildCarTripItemAvailabilitySnapshot({
      snapshotTimestamp: snapshot.snapshotTimestamp,
      availabilityStart: snapshot.availabilityStart,
      availabilityEnd: snapshot.availabilityEnd,
      minDays: snapshot.minDays,
      maxDays: snapshot.maxDays,
      blockedWeekdays: snapshot.blockedWeekdays,
      locationType: snapshot.locationType,
      locationName: snapshot.locationName,
    })
  }

  return buildFlightTripItemAvailabilitySnapshot({
    snapshotTimestamp: snapshot.snapshotTimestamp,
    serviceDate: snapshot.serviceDate,
    departureAt: snapshot.departureAt,
    arrivalAt: snapshot.arrivalAt,
    seatsRemaining: snapshot.seatsRemaining,
    itineraryType: snapshot.itineraryType,
  })
}

export const buildTripItemInventorySnapshotModel = (input: {
  id?: unknown
  itemType: TripItemType
  inventoryId: string
  providerInventoryId?: unknown
  hotelAvailabilitySnapshotId?: unknown
  bookableEntity?: unknown
  availabilitySnapshot?: unknown
}): TripItemInventorySnapshot | null => {
  const id = toPositiveInteger(input.id)
  const providerInventoryId = toPositiveInteger(input.providerInventoryId)
  const hotelAvailabilitySnapshotId = toPositiveInteger(input.hotelAvailabilitySnapshotId)
  const bookableEntity = normalizeStoredBookableEntitySnapshot(
    input.bookableEntity,
    input.itemType,
    input.inventoryId,
  )
  const availability = normalizeStoredTripItemAvailabilitySnapshot(
    input.itemType,
    input.availabilitySnapshot,
  )

  if (
    id == null &&
    providerInventoryId == null &&
    hotelAvailabilitySnapshotId == null &&
    !bookableEntity &&
    !availability
  ) {
    return null
  }

  return {
    id,
    providerInventoryId,
    hotelAvailabilitySnapshotId,
    bookableEntity,
    availability,
  }
}
