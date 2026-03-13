import { bookingSessionStore, persistBookingSession, readBookingSession, type BookingSessionStore } from '~/lib/booking/bookingSessionStore'
import { validateBookingSession } from '~/lib/booking/validateBookingSession'
import type { BookingSession } from '~/types/booking'

export const invalidateBookingSession = async (
  sessionId: string,
  options: {
    store?: BookingSessionStore
    status?: 'invalid' | 'consumed'
  } = {},
): Promise<BookingSession | null> => {
  const store = options.store || bookingSessionStore
  const session = await readBookingSession(sessionId, store)
  if (!session) return null

  const nextSession: BookingSession = {
    ...session,
    status: options.status || 'invalid',
  }

  if (!validateBookingSession(nextSession, { allowInactive: true })) {
    return null
  }

  return persistBookingSession(nextSession, store)
}
