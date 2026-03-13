import type { BookingSession } from '~/types/booking'

export interface BookingSessionStore {
  write(session: BookingSession): Promise<BookingSession | null> | BookingSession | null
  read(sessionId: string): Promise<BookingSession | null> | BookingSession | null
  clear(): Promise<void> | void
}

const cloneValue = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }

  return value
}

export const createInMemoryBookingSessionStore = (): BookingSessionStore => {
  const sessions = new Map<string, BookingSession>()

  return {
    write(session) {
      sessions.set(session.sessionId, cloneValue(session))
      return cloneValue(session)
    },

    read(sessionId) {
      const session = sessions.get(sessionId)
      return session ? cloneValue(session) : null
    },

    clear() {
      sessions.clear()
    },
  }
}

export const bookingSessionStore = createInMemoryBookingSessionStore()

export const persistBookingSession = async (
  session: BookingSession,
  store: BookingSessionStore = bookingSessionStore,
): Promise<BookingSession | null> => {
  try {
    return await store.write(session)
  } catch {
    return null
  }
}

export const readBookingSession = async (
  sessionId: string,
  store: BookingSessionStore = bookingSessionStore,
): Promise<BookingSession | null> => {
  try {
    return await store.read(sessionId)
  } catch {
    return null
  }
}

export const clearBookingSessionStore = async (
  store: BookingSessionStore = bookingSessionStore,
) => {
  try {
    await store.clear()
  } catch {
    // Ignore best-effort cleanup failures in tests and ephemeral storage.
  }
}
