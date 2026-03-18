import { eq } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import { checkoutSessions } from '~/lib/db/schema'
import { buildCheckoutRevalidationSummary } from '~/lib/checkout/buildCheckoutRevalidationSummary'
import { getCheckoutReadinessState } from '~/lib/checkout/getCheckoutReadinessState'
import {
  CheckoutSessionError,
  getCheckoutSession,
  withCheckoutSchemaGuard,
} from '~/lib/checkout/getCheckoutSession'
import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import { revalidateCheckoutItem } from '~/lib/checkout/revalidateCheckoutItem'
import type {
  CheckoutItemRevalidationResult,
  CheckoutSession,
} from '~/types/checkout'

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const buildSessionFailureResults = (
  session: CheckoutSession,
  message: string,
): CheckoutItemRevalidationResult[] => {
  return session.items.map((item) => ({
    tripItemId: item.tripItemId,
    itemType: item.itemType,
    vertical: item.vertical,
    title: item.title,
    subtitle: item.subtitle,
    status: 'failed',
    message,
    previousPricing: item.pricing,
    currentPricing: null,
    previousInventory: item.inventory,
    currentInventory: null,
    providerMetadata: item.inventory.providerMetadata,
  }))
}

const persistRevalidationState = async (input: {
  checkoutSessionId: string
  checkedAt: string
  sessionStatus: CheckoutSession['status']
  revalidationStatus: CheckoutSession['revalidationStatus']
  revalidationSummary: CheckoutSession['revalidationSummary']
}) => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    await db
      .update(checkoutSessions)
      .set({
        status: input.sessionStatus,
        revalidationStatus: input.revalidationStatus,
        revalidationSummaryJson: input.revalidationSummary,
        lastRevalidatedAt: new Date(input.checkedAt),
        updatedAt: new Date(input.checkedAt),
      })
      .where(eq(checkoutSessions.id, input.checkoutSessionId))
  })
}

export const revalidateCheckoutSession = async (
  checkoutSessionId: string,
  options: {
    checkedAt?: Date | string | null
  } = {},
): Promise<CheckoutSession> => {
  const normalizedId = String(checkoutSessionId || '').trim()
  if (!normalizedId) {
    throw new CheckoutSessionError(
      'invalid_session',
      'Checkout session id is required to revalidate checkout.',
    )
  }

  const checkedAt = normalizeTimestamp(options.checkedAt)
  const session = await getCheckoutSession(normalizedId, {
    now: checkedAt,
    includeTerminal: true,
  })

  if (!session) {
    throw new CheckoutSessionError(
      'checkout_not_found',
      `Checkout session ${normalizedId} could not be found for revalidation.`,
    )
  }

  if (
    isCheckoutSessionExpired(session, checkedAt) ||
    session.status === 'completed' ||
    session.status === 'abandoned'
  ) {
    return session
  }

  await persistRevalidationState({
    checkoutSessionId: normalizedId,
    checkedAt,
    sessionStatus: session.status === 'ready' ? 'draft' : session.status,
    revalidationStatus: 'pending',
    revalidationSummary: session.revalidationSummary,
  })

  try {
    const itemResults = await Promise.all(
      session.items.map((item) =>
        revalidateCheckoutItem(item, {
          checkedAt,
        }),
      ),
    )

    const summary = buildCheckoutRevalidationSummary({
      checkedAt,
      itemResults,
    })
    const nextStatus =
      getCheckoutReadinessState(
        {
          ...session,
          status: session.status === 'expired' ? 'expired' : 'draft',
          revalidationStatus: summary.status,
          revalidationSummary: summary,
        },
        { now: checkedAt },
      ) === 'ready'
        ? 'ready'
        : 'blocked'

    await persistRevalidationState({
      checkoutSessionId: normalizedId,
      checkedAt,
      sessionStatus: nextStatus,
      revalidationStatus: summary.status,
      revalidationSummary: summary,
    })
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? `Checkout revalidation failed. ${error.message.trim()}`
        : 'Checkout revalidation failed.'
    const summary = buildCheckoutRevalidationSummary({
      checkedAt,
      itemResults: buildSessionFailureResults(session, message),
    })

    await persistRevalidationState({
      checkoutSessionId: normalizedId,
      checkedAt,
      sessionStatus: 'blocked',
      revalidationStatus: 'failed',
      revalidationSummary: summary,
    })
  }

  const refreshedSession = await getCheckoutSession(normalizedId, {
    now: checkedAt,
    includeTerminal: true,
  })
  if (!refreshedSession) {
    throw new CheckoutSessionError(
      'invalid_session',
      `Checkout session ${normalizedId} could not be loaded after revalidation.`,
    )
  }

  return refreshedSession
}
