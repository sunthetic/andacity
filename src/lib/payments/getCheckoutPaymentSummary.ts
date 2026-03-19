import { formatMoneyFromCents } from '~/lib/pricing/price-display'
import { canCheckoutCreatePaymentIntent } from '~/lib/payments/canCheckoutCreatePaymentIntent'
import { canPaymentSessionBeResumed } from '~/lib/payments/canPaymentSessionBeResumed'
import { getActiveCheckoutPaymentSession } from '~/lib/payments/getActiveCheckoutPaymentSession'
import { getCheckoutPaymentFingerprint } from '~/lib/payments/getCheckoutPaymentFingerprint'
import { attachCheckoutTravelerState } from '~/fns/travelers/attachCheckoutTravelerState'
import {
  getLatestCheckoutPaymentSessionRow,
  mapCheckoutPaymentSessionRow,
} from '~/lib/payments/getCheckoutPaymentSession'
import type { CheckoutSession } from '~/types/checkout'
import type { CheckoutPaymentSummary } from '~/types/payment'

const formatDateTime = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

const toTitleCase = (value: string) => {
  return String(value || '')
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const describeStatus = (summary: {
  checkoutReady: boolean
  blockedReason: string | null
  status: CheckoutPaymentSummary['status']
  fingerprintMatchesCheckout: boolean | null
}) => {
  if (!summary.checkoutReady) {
    return summary.blockedReason || 'Payment is blocked until checkout is ready.'
  }
  if (!summary.status) {
    return 'Payment has not been initialized for this checkout yet.'
  }
  if (summary.fingerprintMatchesCheckout === false) {
    return 'This payment session belongs to an older checkout total and will not be reused.'
  }

  switch (summary.status) {
    case 'draft':
      return 'Your payment session exists but still needs a payment method.'
    case 'pending':
      return 'Your payment session is active and waiting for confirmation.'
    case 'requires_action':
      return 'Your payment session is waiting for payment details or additional authentication.'
    case 'authorized':
      return 'Payment authorization succeeded. You can now complete booking from this checkout session.'
    case 'succeeded':
      return 'Payment succeeded. Complete booking to send each checkout item through the provider adapters.'
    case 'canceled':
      return 'This payment session was canceled and can be recreated from the latest checkout totals.'
    case 'failed':
      return 'This payment session failed. You can retry from the current checkout totals.'
    case 'expired':
      return 'This payment session expired and can no longer be resumed.'
    default:
      return 'Payment status is available.'
  }
}

export const getCheckoutPaymentSummary = async (
  checkoutSession: CheckoutSession,
  options: {
    now?: Date | string | number
  } = {},
): Promise<CheckoutPaymentSummary> => {
  const checkoutWithTravelers = await attachCheckoutTravelerState(checkoutSession)
  const eligibility = canCheckoutCreatePaymentIntent(checkoutWithTravelers, options)
  const latestRow = await getLatestCheckoutPaymentSessionRow(checkoutSession.id, {
    includeTerminal: true,
  })
  const latestSession = latestRow ? mapCheckoutPaymentSessionRow(latestRow) : null
  const activeSession = await getActiveCheckoutPaymentSession(checkoutSession.id, options)

  const currentFingerprint =
    eligibility.ok && checkoutWithTravelers
      ? getCheckoutPaymentFingerprint(
          checkoutWithTravelers,
          eligibility.amountSnapshot,
        )
      : null
  const fingerprintMatchesCheckout =
    latestSession && currentFingerprint
      ? latestSession.revalidationFingerprint === currentFingerprint
      : latestSession
        ? false
        : null

  const amountSnapshot =
    (activeSession || latestSession)?.amountSnapshot ||
    (eligibility.ok ? eligibility.amountSnapshot : null)
  const amountLabel =
    amountSnapshot?.currency && amountSnapshot.totalAmountCents != null
      ? formatMoneyFromCents(
          amountSnapshot.totalAmountCents,
          amountSnapshot.currency,
        )
      : 'Unavailable'
  const blockedReason = eligibility.ok ? null : eligibility.message
  const status = (activeSession || latestSession)?.status || null
  const provider = (activeSession || latestSession)?.provider || null
  const updatedAt = (activeSession || latestSession)?.updatedAt || null
  const canInitialize =
    eligibility.ok &&
    !activeSession &&
    (!latestSession ||
      fingerprintMatchesCheckout === false ||
      latestSession.status === 'canceled' ||
      latestSession.status === 'failed' ||
      latestSession.status === 'expired')

  return {
    checkoutSessionId: checkoutSession.id,
    checkoutReady: eligibility.ok,
    blockedReason,
    paymentSessionId: (activeSession || latestSession)?.id || null,
    provider,
    status,
    statusLabel: status ? toTitleCase(status) : 'Not started',
    statusDescription: describeStatus({
      checkoutReady: eligibility.ok,
      blockedReason,
      status,
      fingerprintMatchesCheckout,
    }),
    paymentIntentStatus: (activeSession || latestSession)?.paymentIntentStatus || null,
    currency: amountSnapshot?.currency || null,
    amountSnapshot,
    amountLabel,
    revalidationFingerprint:
      (activeSession || latestSession)?.revalidationFingerprint ||
      currentFingerprint,
    fingerprintMatchesCheckout,
    clientSecret: activeSession?.providerClientSecret || latestSession?.providerClientSecret || null,
    canInitialize,
    canResume:
      fingerprintMatchesCheckout !== false &&
      canPaymentSessionBeResumed(activeSession || latestSession, options),
    canCancel:
      Boolean(activeSession) &&
      canPaymentSessionBeResumed(activeSession, options),
    canRefresh: Boolean(activeSession || latestSession),
    updatedAt,
    updatedLabel: formatDateTime(updatedAt),
  }
}
