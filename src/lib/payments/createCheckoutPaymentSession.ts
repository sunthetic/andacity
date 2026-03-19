import { getCheckoutSession } from '~/lib/checkout/getCheckoutSession'
import { attachCheckoutTravelerState } from '~/fns/travelers/attachCheckoutTravelerState'
import { canCheckoutCreatePaymentIntent } from '~/lib/payments/canCheckoutCreatePaymentIntent'
import { createPaymentIntent } from '~/lib/payments/adapters/createPaymentIntent'
import { getCheckoutPaymentFingerprint } from '~/lib/payments/getCheckoutPaymentFingerprint'
import {
  createCheckoutPaymentSessionId,
  getCheckoutPaymentSession,
} from '~/lib/payments/getCheckoutPaymentSession'
import { getDb } from '~/lib/db/client.server'
import { checkoutPaymentSessions } from '~/lib/db/schema'
import { getPaymentProvider } from '~/lib/payments/getPaymentProvider'
import { getPaymentProviderConfig } from '~/lib/payments/getPaymentProviderConfig'
import { mapProviderPaymentStatus } from '~/lib/payments/mapProviderPaymentStatus'
import { withCheckoutSchemaGuard } from '~/lib/checkout/getCheckoutSession'
import type { CheckoutPaymentSession } from '~/types/payment'

export class CheckoutPaymentSessionError extends Error {
  readonly code:
    | 'CHECKOUT_NOT_FOUND'
    | 'CHECKOUT_NOT_READY'
    | 'CHECKOUT_EXPIRED'
    | 'PAYMENT_PROVIDER_UNAVAILABLE'
    | 'PAYMENT_INTENT_CREATE_FAILED'
    | 'PAYMENT_SESSION_STALE'
    | 'PAYMENT_SESSION_CANCELED'

  constructor(
    code:
      | 'CHECKOUT_NOT_FOUND'
      | 'CHECKOUT_NOT_READY'
      | 'CHECKOUT_EXPIRED'
      | 'PAYMENT_PROVIDER_UNAVAILABLE'
      | 'PAYMENT_INTENT_CREATE_FAILED'
      | 'PAYMENT_SESSION_STALE'
      | 'PAYMENT_SESSION_CANCELED',
    message: string,
  ) {
    super(message)
    this.name = 'CheckoutPaymentSessionError'
    this.code = code
  }
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

export const createCheckoutPaymentSession = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | null
  } = {},
): Promise<CheckoutPaymentSession> => {
  const normalizedNow = options.now ?? undefined
  const checkoutSession = await getCheckoutSession(checkoutSessionId, {
    now: normalizedNow,
    includeTerminal: true,
  })
  const checkoutWithTravelers = checkoutSession
    ? await attachCheckoutTravelerState(checkoutSession)
    : checkoutSession
  const eligibility = canCheckoutCreatePaymentIntent(checkoutWithTravelers, {
    now: normalizedNow,
  })
  if (!eligibility.ok) {
    throw new CheckoutPaymentSessionError(eligibility.code, eligibility.message)
  }

  const provider = (() => {
    try {
      return getPaymentProvider()
    } catch (error) {
      throw new CheckoutPaymentSessionError(
        'PAYMENT_PROVIDER_UNAVAILABLE',
        error instanceof Error
          ? error.message
          : 'Payment provider configuration is unavailable.',
      )
    }
  })()
  try {
    getPaymentProviderConfig(provider)
  } catch (error) {
    throw new CheckoutPaymentSessionError(
      'PAYMENT_PROVIDER_UNAVAILABLE',
      error instanceof Error
        ? error.message
        : 'Payment provider configuration is unavailable.',
    )
  }
  const fingerprint = getCheckoutPaymentFingerprint(
    checkoutWithTravelers!,
    eligibility.amountSnapshot,
  )
  const createdAt = normalizeTimestamp(normalizedNow)

  const intent = await createPaymentIntent(provider, {
    checkoutSessionId: checkoutSessionId,
    amountSnapshot: eligibility.amountSnapshot,
    currency: eligibility.amountSnapshot.currency,
    metadata: {
      checkout_session_id: checkoutSessionId,
      revalidation_fingerprint: fingerprint,
    },
  }).catch((error) => {
    throw new CheckoutPaymentSessionError(
      'PAYMENT_INTENT_CREATE_FAILED',
      error instanceof Error
        ? error.message
        : 'Payment intent creation failed.',
    )
  })

  const paymentSessionId = createCheckoutPaymentSessionId()
  const localStatus = mapProviderPaymentStatus(intent.status)

  await withCheckoutSchemaGuard(async () => {
    const db = getDb()
    await db.insert(checkoutPaymentSessions).values({
      id: paymentSessionId,
      checkoutSessionId,
      provider,
      status: localStatus,
      currency: intent.currency,
      amountJson: eligibility.amountSnapshot,
      revalidationFingerprint: fingerprint,
      providerPaymentIntentId: intent.providerPaymentIntentId,
      providerClientSecret: intent.clientSecret,
      providerMetadataJson: {
        ...(intent.metadata || {}),
        paymentIntentStatus: intent.status,
      },
      authorizedAt: localStatus === 'authorized' ? new Date(createdAt) : null,
      succeededAt: localStatus === 'succeeded' ? new Date(createdAt) : null,
      failedAt: localStatus === 'failed' ? new Date(createdAt) : null,
      canceledAt: localStatus === 'canceled' ? new Date(createdAt) : null,
      expiresAt: checkoutSession?.expiresAt ? new Date(checkoutSession.expiresAt) : null,
      createdAt: new Date(createdAt),
      updatedAt: new Date(createdAt),
    })
  })

  const persisted = await getCheckoutPaymentSession(paymentSessionId, {
    now: createdAt,
    includeTerminal: true,
  })
  if (!persisted) {
    throw new CheckoutPaymentSessionError(
      'PAYMENT_INTENT_CREATE_FAILED',
      `Payment session ${paymentSessionId} could not be loaded after creation.`,
    )
  }

  return persisted
}
