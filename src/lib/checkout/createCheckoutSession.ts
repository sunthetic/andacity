import { getDb } from '~/lib/db/client.server'
import { checkoutSessions } from '~/lib/db/schema'
import { mapTripToCheckoutSession } from '~/lib/checkout/mapTripToCheckoutSession'
import {
  CHECKOUT_SESSION_DEFAULT_TTL_MS,
  CheckoutSessionError,
  createCheckoutSessionId,
  getCheckoutSession,
  withCheckoutSchemaGuard,
} from '~/lib/checkout/getCheckoutSession'
import type { CheckoutSession, CreateCheckoutSessionInput } from '~/types/checkout'

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const createCheckoutSession = async (
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSession> => {
  if (!input.trip.items.length) {
    throw new CheckoutSessionError(
      'empty_trip',
      `Trip ${input.trip.id} does not have any canonical items to start checkout.`,
    )
  }

  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const createdAt = normalizeTimestamp(input.now)
    const ttlMs = Math.max(
      60_000,
      Math.round(Number(input.ttlMs ?? CHECKOUT_SESSION_DEFAULT_TTL_MS) || 0),
    )
    const expiresAt = new Date(Date.parse(createdAt) + ttlMs).toISOString()
    const snapshot = mapTripToCheckoutSession(input)
    const checkoutSessionId = createCheckoutSessionId()

    // Keep the session payload as a frozen JSON snapshot for later checkout
    // revalidation, traveler collection, and booking execution work.
    await db.insert(checkoutSessions).values({
      id: checkoutSessionId,
      tripId: input.trip.id,
      status: snapshot.status,
      currency: snapshot.currencyCode,
      itemsJson: snapshot.items,
      totalsJson: snapshot.totals,
      expiresAt: new Date(expiresAt),
    })

    const session = await getCheckoutSession(checkoutSessionId, {
      now: createdAt,
      includeTerminal: true,
    })

    if (!session) {
      throw new CheckoutSessionError(
        'invalid_session',
        `Checkout session ${checkoutSessionId} could not be loaded after creation.`,
      )
    }

    return session
  })
}
