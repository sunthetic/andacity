import { isBookableEntity } from '~/lib/booking/bookable-entity'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import {
  BOOKING_SESSION_STATUSES,
  type BookingSession,
  type BookingSessionStatus,
} from '~/types/booking'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toIsoTimestamp = (value: unknown) => {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const hasRequiredProviderMetadata = (session: BookingSession) => {
  const metadata = session.providerMetadata
  if (!Object.keys(metadata).length) return false

  if (session.vertical === 'flight') {
    return typeof metadata.carrier === 'string' && typeof metadata.flightNumber === 'string'
  }

  if (session.vertical === 'hotel') {
    return typeof metadata.hotelId === 'string' && typeof metadata.checkInDate === 'string'
  }

  return (
    typeof metadata.providerLocationId === 'string' &&
    typeof metadata.pickupDateTime === 'string' &&
    typeof metadata.dropoffDateTime === 'string'
  )
}

export const isBookingSessionExpired = (
  session: Pick<BookingSession, 'expiresAt'>,
  now: Date | string | number = new Date(),
) => {
  const expiresAt = Date.parse(String(session.expiresAt || ''))
  const nowValue = now instanceof Date ? now.getTime() : new Date(now).getTime()
  if (!Number.isFinite(expiresAt) || !Number.isFinite(nowValue)) return true
  return expiresAt <= nowValue
}

export const resolveBookingSessionStatus = (
  session: Pick<BookingSession, 'status' | 'expiresAt'>,
  now: Date | string | number = new Date(),
): BookingSessionStatus => {
  if (session.status === 'active' && isBookingSessionExpired(session, now)) {
    return 'expired'
  }

  return session.status
}

export const validateBookingSession = (
  session: BookingSession,
  options: {
    now?: Date | string | number
    allowInactive?: boolean
  } = {},
) => {
  if (!isRecord(session)) return false
  if (typeof session.sessionId !== 'string' || !session.sessionId.trim()) return false
  if (typeof session.inventoryId !== 'string' || !session.inventoryId.trim()) return false
  if (!parseInventoryId(session.inventoryId)) return false
  if (typeof session.provider !== 'string' || !session.provider.trim()) return false
  if (!BOOKING_SESSION_STATUSES.includes(session.status)) return false
  if (session.source !== 'inventory' && session.source !== 'trip_item') return false
  if (session.tripItemId != null && (!Number.isInteger(session.tripItemId) || session.tripItemId < 1)) {
    return false
  }

  const createdAt = toIsoTimestamp(session.createdAt)
  const expiresAt = toIsoTimestamp(session.expiresAt)
  if (!createdAt || !expiresAt) return false
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) return false

  if (!isBookableEntity(session.entity)) return false
  if (session.entity.inventoryId !== session.inventoryId || session.entity.vertical !== session.vertical) {
    return false
  }

  const amount = toFiniteNumber(session.price?.amount)
  if (!session.price || typeof session.price.currency !== 'string' || !session.price.currency.trim()) {
    return false
  }
  if (amount == null || amount < 0) return false

  if (!isRecord(session.providerMetadata) || !hasRequiredProviderMetadata(session)) {
    return false
  }

  const resolvedStatus = resolveBookingSessionStatus(session, options.now)
  if (!options.allowInactive && resolvedStatus !== 'active') {
    return false
  }

  if (!options.allowInactive && session.status !== 'active') {
    return false
  }

  return true
}
