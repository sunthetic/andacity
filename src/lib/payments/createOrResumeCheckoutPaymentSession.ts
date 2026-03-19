import { getCheckoutSession } from '~/lib/checkout/getCheckoutSession'
import { attachCheckoutTravelerState } from '~/fns/travelers/attachCheckoutTravelerState'
import { canCheckoutCreatePaymentIntent } from '~/lib/payments/canCheckoutCreatePaymentIntent'
import { cancelCheckoutPaymentSession } from '~/lib/payments/cancelCheckoutPaymentSession'
import { canPaymentSessionBeResumed } from '~/lib/payments/canPaymentSessionBeResumed'
import { createCheckoutPaymentSession, CheckoutPaymentSessionError } from '~/lib/payments/createCheckoutPaymentSession'
import { getActiveCheckoutPaymentSession } from '~/lib/payments/getActiveCheckoutPaymentSession'
import { getCheckoutPaymentFingerprint } from '~/lib/payments/getCheckoutPaymentFingerprint'
import {
  getLatestCheckoutPaymentSessionRow,
  mapCheckoutPaymentSessionRow,
} from '~/lib/payments/getCheckoutPaymentSession'
import { refreshCheckoutPaymentStatus } from '~/lib/payments/refreshCheckoutPaymentStatus'
import type { CheckoutPaymentSession } from '~/types/payment'

export const createOrResumeCheckoutPaymentSession = async (
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

  const currentFingerprint = getCheckoutPaymentFingerprint(
    checkoutWithTravelers!,
    eligibility.amountSnapshot,
  )
  const activeSession = await getActiveCheckoutPaymentSession(checkoutSessionId, {
    now: normalizedNow,
  })

  if (!activeSession) {
    const latestRow = await getLatestCheckoutPaymentSessionRow(checkoutSessionId, {
      includeTerminal: true,
    })
    const latestSession = latestRow ? mapCheckoutPaymentSessionRow(latestRow) : null
    if (
      latestSession &&
      latestSession.revalidationFingerprint === currentFingerprint &&
      latestSession.status === 'succeeded'
    ) {
      return latestSession
    }

    return createCheckoutPaymentSession(checkoutSessionId, options)
  }

  const refreshedSession = await refreshCheckoutPaymentStatus(activeSession.id, {
    now: normalizedNow,
  })

  if (
    refreshedSession &&
    refreshedSession.revalidationFingerprint === currentFingerprint &&
    canPaymentSessionBeResumed(refreshedSession, { now: normalizedNow })
  ) {
    return refreshedSession
  }

  if (
    refreshedSession &&
    refreshedSession.revalidationFingerprint !== currentFingerprint
  ) {
    await cancelCheckoutPaymentSession(refreshedSession.id, {
      now: normalizedNow,
      reason: 'stale_checkout_revalidation',
    })
  }

  return createCheckoutPaymentSession(checkoutSessionId, options)
}
