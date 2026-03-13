import { bookingSessionStore, persistBookingSession, readBookingSession, type BookingSessionStore } from '~/lib/booking/bookingSessionStore'
import {
  resolveBookingSessionStatus,
  validateBookingSession,
} from '~/lib/booking/validateBookingSession'
import type { BookingSession } from '~/types/booking'

export const getBookingSession = async (
  sessionId: string,
  options: {
    now?: Date | string | number
    includeInactive?: boolean
    store?: BookingSessionStore
  } = {},
): Promise<BookingSession | null> => {
  const store = options.store || bookingSessionStore
  const session = await readBookingSession(sessionId, store)
  if (!session) return null

  const resolvedStatus = resolveBookingSessionStatus(session, options.now)
  const normalizedSession =
    resolvedStatus !== session.status
      ? {
          ...session,
          status: resolvedStatus,
        }
      : session

  if (resolvedStatus !== session.status) {
    await persistBookingSession(normalizedSession, store)
  }

  if (!validateBookingSession(normalizedSession, { now: options.now, allowInactive: true })) {
    return null
  }

  if (!options.includeInactive && normalizedSession.status !== 'active') {
    return null
  }

  return normalizedSession
}
