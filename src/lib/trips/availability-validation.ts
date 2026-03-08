import { computeDays } from '~/lib/search/car-rentals/dates'
import { computeNights } from '~/lib/search/hotels/dates'
import type {
  TripItemType,
  TripItemValidityStatus,
  TripPriceDriftStatus,
  TripValidationIssue,
} from '~/types/trips/trip'

const TRIP_INTELLIGENCE_METADATA_KEY = 'trip_intelligence'
const AVAILABILITY_CACHE_KEY = 'availability'

export const TRIP_AVAILABILITY_VALIDITY_WINDOW_MS = 1000 * 60 * 60 * 6

type CoreTripItemValidityStatus = Exclude<TripItemValidityStatus, 'price_only_changed'>

type StoredTripItemAvailabilityCache = {
  checkedAt: string
  expiresAt: string
  status: CoreTripItemValidityStatus
  issues: TripValidationIssue[]
}

type TripItemAvailabilityBaseInput = {
  itemId: number
  itemType: TripItemType
  title: string
  startDate: string | null
  endDate: string | null
}

export type HotelAvailabilityValidationInput = TripItemAvailabilityBaseInput & {
  itemType: 'hotel'
  inventoryExists: boolean
  availabilitySnapshot: {
    checkInStart: string
    checkInEnd: string
    minNights: number
    maxNights: number
    blockedWeekdays: number[]
  } | null
}

export type CarAvailabilityValidationInput = TripItemAvailabilityBaseInput & {
  itemType: 'car'
  inventoryExists: boolean
  availability: {
    availabilityStart: string
    availabilityEnd: string
    minDays: number
    maxDays: number
    blockedWeekdays: number[]
  } | null
}

export type FlightAvailabilityValidationInput = TripItemAvailabilityBaseInput & {
  itemType: 'flight'
  inventoryExists: boolean
  serviceDate: string | null
  seatsRemaining: number | null
}

export type TripItemAvailabilityValidationInput =
  | HotelAvailabilityValidationInput
  | CarAvailabilityValidationInput
  | FlightAvailabilityValidationInput

export type TripItemAvailabilityValidationResult = {
  checkedAt: string
  expiresAt: string
  status: CoreTripItemValidityStatus
  issues: TripValidationIssue[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toIsoDate = (value: unknown) => {
  const text = String(value || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const toIsoTimestamp = (value: unknown) => {
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const toInteger = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

const toIntList = (value: unknown) => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => toInteger(entry))
    .filter((entry): entry is number => entry != null)
}

const toIssue = (
  itemId: number,
  scope: TripValidationIssue['scope'],
  severity: TripValidationIssue['severity'],
  code: string,
  message: string,
): TripValidationIssue => ({
  code,
  scope,
  severity,
  message,
  itemId,
})

const toUtcDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const toUtcWeekday = (value: string | null) => {
  if (!value) return null
  const date = toUtcDate(value)
  return date ? date.getUTCDay() : null
}

const buildValidationResult = (
  now: Date,
  status: CoreTripItemValidityStatus,
  issues: TripValidationIssue[],
): TripItemAvailabilityValidationResult => ({
  checkedAt: now.toISOString(),
  expiresAt: new Date(now.getTime() + TRIP_AVAILABILITY_VALIDITY_WINDOW_MS).toISOString(),
  status,
  issues,
})

const validateHotelAvailability = (
  input: HotelAvailabilityValidationInput,
  now: Date,
): TripItemAvailabilityValidationResult => {
  if (!input.inventoryExists) {
    return buildValidationResult(now, 'unavailable', [
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'inventory_missing',
        `${input.title} is no longer available in inventory.`,
      ),
    ])
  }

  if (!input.startDate || !input.endDate) {
    return buildValidationResult(now, 'stale', [
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'selected_dates_missing',
        `${input.title} is missing check-in or check-out dates, so availability could not be revalidated.`,
      ),
    ])
  }

  const nights = computeNights(input.startDate, input.endDate)
  if (nights == null) {
    return buildValidationResult(now, 'unavailable', [
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'selected_date_range_invalid',
        `${input.title} has an invalid hotel date range.`,
      ),
    ])
  }

  if (!input.availabilitySnapshot) {
    return buildValidationResult(now, 'stale', [
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'availability_snapshot_missing',
        `${input.title} could not be date-checked because no hotel availability snapshot is available.`,
      ),
    ])
  }

  const weekday = toUtcWeekday(input.startDate)
  const issues: TripValidationIssue[] = []

  if (input.startDate < input.availabilitySnapshot.checkInStart) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'hotel_checkin_before_window',
        `${input.title} now starts after the selected check-in date.`,
      ),
    )
  }

  if (input.startDate > input.availabilitySnapshot.checkInEnd) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'hotel_checkin_after_window',
        `${input.title} no longer supports the selected check-in date.`,
      ),
    )
  }

  if (nights < input.availabilitySnapshot.minNights || nights > input.availabilitySnapshot.maxNights) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'hotel_night_span_unavailable',
        `${input.title} no longer matches the selected stay length.`,
      ),
    )
  }

  if (
    weekday != null &&
    input.availabilitySnapshot.blockedWeekdays.includes(weekday)
  ) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'hotel_checkin_blocked',
        `${input.title} is blocked for the selected check-in day.`,
      ),
    )
  }

  return buildValidationResult(now, issues.length ? 'unavailable' : 'valid', issues)
}

const validateCarAvailability = (
  input: CarAvailabilityValidationInput,
  now: Date,
): TripItemAvailabilityValidationResult => {
  if (!input.inventoryExists) {
    return buildValidationResult(now, 'unavailable', [
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'inventory_missing',
        `${input.title} is no longer available in inventory.`,
      ),
    ])
  }

  if (!input.startDate || !input.endDate) {
    return buildValidationResult(now, 'stale', [
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'selected_dates_missing',
        `${input.title} is missing pickup or dropoff dates, so availability could not be revalidated.`,
      ),
    ])
  }

  const days = computeDays(input.startDate, input.endDate)
  if (days == null) {
    return buildValidationResult(now, 'unavailable', [
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'selected_date_range_invalid',
        `${input.title} has an invalid car rental date range.`,
      ),
    ])
  }

  if (!input.availability) {
    return buildValidationResult(now, 'stale', [
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'availability_window_missing',
        `${input.title} could not be date-checked because its rental availability window is missing.`,
      ),
    ])
  }

  const weekday = toUtcWeekday(input.startDate)
  const issues: TripValidationIssue[] = []

  if (input.startDate < input.availability.availabilityStart) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'car_pickup_before_window',
        `${input.title} now starts after the selected pickup date.`,
      ),
    )
  }

  if (input.startDate > input.availability.availabilityEnd) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'car_pickup_after_window',
        `${input.title} no longer supports the selected pickup date.`,
      ),
    )
  }

  if (days < input.availability.minDays || days > input.availability.maxDays) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'car_rental_duration_unavailable',
        `${input.title} no longer matches the selected rental duration.`,
      ),
    )
  }

  if (weekday != null && input.availability.blockedWeekdays.includes(weekday)) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'car_pickup_blocked',
        `${input.title} is blocked for the selected pickup day.`,
      ),
    )
  }

  return buildValidationResult(now, issues.length ? 'unavailable' : 'valid', issues)
}

const validateFlightAvailability = (
  input: FlightAvailabilityValidationInput,
  now: Date,
): TripItemAvailabilityValidationResult => {
  if (!input.inventoryExists) {
    return buildValidationResult(now, 'unavailable', [
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'inventory_missing',
        `${input.title} is no longer available in inventory.`,
      ),
    ])
  }

  const issues: TripValidationIssue[] = []

  if (!input.serviceDate) {
    return buildValidationResult(now, 'stale', [
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'flight_service_date_missing',
        `${input.title} could not be date-checked because its live service date is missing.`,
      ),
    ])
  }

  let hasWarningOnlyDateMismatch = false
  if (input.startDate && input.startDate !== input.serviceDate) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'warning',
        'flight_date_needs_confirmation',
        `${input.title} needs a fresh flight search to confirm the planned departure date.`,
      ),
    )
    hasWarningOnlyDateMismatch = true
  }

  if (input.seatsRemaining != null && input.seatsRemaining <= 0) {
    issues.push(
      toIssue(
        input.itemId,
        'availability',
        'blocking',
        'flight_sold_out',
        `${input.title} has no remaining seats for the selected itinerary.`,
      ),
    )
  }

  if (issues.some((issue) => issue.severity === 'blocking')) {
    return buildValidationResult(now, 'unavailable', issues)
  }

  if (hasWarningOnlyDateMismatch) {
    return buildValidationResult(now, 'stale', issues)
  }

  return buildValidationResult(now, 'valid', issues)
}

export const validateTripItemAvailability = (
  input: TripItemAvailabilityValidationInput,
  now = new Date(),
): TripItemAvailabilityValidationResult => {
  if (input.itemType === 'hotel') {
    return validateHotelAvailability(input, now)
  }

  if (input.itemType === 'car') {
    return validateCarAvailability(input, now)
  }

  return validateFlightAvailability(input, now)
}

export const applyPriceDriftToAvailabilityStatus = (
  status: CoreTripItemValidityStatus,
  priceDriftStatus: TripPriceDriftStatus,
): TripItemValidityStatus => {
  if (status !== 'valid') return status
  if (priceDriftStatus === 'increased' || priceDriftStatus === 'decreased') {
    return 'price_only_changed'
  }
  return 'valid'
}

export const readStoredTripItemAvailability = (
  metadata: Record<string, unknown>,
): StoredTripItemAvailabilityCache | null => {
  const root = metadata[TRIP_INTELLIGENCE_METADATA_KEY]
  if (!isRecord(root)) return null

  const availability = root[AVAILABILITY_CACHE_KEY]
  if (!isRecord(availability)) return null

  const checkedAt = toIsoTimestamp(availability.checkedAt)
  const expiresAt = toIsoTimestamp(availability.expiresAt)
  const status = String(availability.status || '').trim()
  const issues = Array.isArray(availability.issues)
    ? availability.issues
        .map((entry) => {
          if (!isRecord(entry)) return null

          const code = String(entry.code || '').trim()
          const scope = entry.scope === 'availability' || entry.scope === 'itinerary' ? entry.scope : 'availability'
          const severity = entry.severity === 'blocking' ? 'blocking' : 'warning'
          const message = String(entry.message || '').trim()
          const itemId = toInteger(entry.itemId)
          const relatedItemIds = toIntList(entry.relatedItemIds)

          if (!code || !message) return null

          return {
            code,
            scope,
            severity,
            message,
            ...(itemId != null ? { itemId } : {}),
            ...(relatedItemIds.length ? { relatedItemIds } : {}),
          } satisfies TripValidationIssue
        })
        .filter((entry): entry is TripValidationIssue => Boolean(entry))
    : []

  if (!checkedAt || !expiresAt) return null
  if (status !== 'valid' && status !== 'unavailable' && status !== 'stale') return null

  return {
    checkedAt,
    expiresAt,
    status,
    issues,
  }
}

export const isStoredTripItemAvailabilityFresh = (
  cache: StoredTripItemAvailabilityCache | null,
  now = new Date(),
) => {
  if (!cache) return false
  const expiresAt = Date.parse(cache.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt > now.getTime()
}

export const writeStoredTripItemAvailability = (
  metadata: Record<string, unknown>,
  result: TripItemAvailabilityValidationResult,
) => {
  const root = isRecord(metadata[TRIP_INTELLIGENCE_METADATA_KEY])
    ? { ...(metadata[TRIP_INTELLIGENCE_METADATA_KEY] as Record<string, unknown>) }
    : {}

  root[AVAILABILITY_CACHE_KEY] = {
    checkedAt: result.checkedAt,
    expiresAt: result.expiresAt,
    status: result.status,
    issues: result.issues,
  }

  return {
    ...metadata,
    [TRIP_INTELLIGENCE_METADATA_KEY]: root,
  }
}
