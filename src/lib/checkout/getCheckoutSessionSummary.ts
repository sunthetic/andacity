import { canCheckoutProceedToPayment } from '~/lib/checkout/canCheckoutProceedToPayment'
import { getCheckoutReadinessState } from '~/lib/checkout/getCheckoutReadinessState'
import { buildInventoryFreshness } from '~/lib/inventory/freshness'
import { formatMoneyFromCents } from '~/lib/pricing/price-display'
import type {
  CheckoutSession,
  CheckoutSessionEntryMode,
  CheckoutSessionSummary,
} from '~/types/checkout'

const buildTripReference = (tripId: number) => {
  return `TRIP-${String(Math.max(0, tripId)).padStart(6, '0')}`
}

const shortenOpaqueId = (value: string) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (trimmed.length <= 16) return trimmed
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

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

const describeStatus = (
  session: CheckoutSession,
  readinessState: CheckoutSessionSummary['readinessState'],
) => {
  const status = session.status

  if (session.revalidationStatus === 'pending') {
    return 'We are verifying the latest pricing and availability for this checkout snapshot.'
  }

  if (status === 'blocked') {
    return session.revalidationSummary?.blockingIssueCount
      ? 'One or more items changed before checkout could continue. Review the updates below before proceeding.'
      : 'This checkout snapshot needs more trip updates before it can move forward.'
  }

  if (status === 'expired') {
    return 'This checkout snapshot expired. Return to the trip to start a fresh checkout.'
  }

  if (status === 'completed') {
    return 'This checkout session is complete. Confirmation and booking persistence arrive in later tasks.'
  }

  if (status === 'abandoned') {
    return 'This checkout session was abandoned before confirmation.'
  }

  if (status === 'ready') {
    return readinessState === 'ready'
      ? 'We rechecked pricing and availability for your trip. This checkout snapshot is ready for the next payment step once it is introduced.'
      : 'This checkout snapshot exists, but it still needs a successful revalidation pass before payment can continue.'
  }

  return session.revalidationStatus === 'passed'
    ? 'This checkout session was recently verified against current inventory.'
    : 'This checkout session is a frozen trip snapshot that must be revalidated before payment.'
}

const describeReadiness = (
  session: CheckoutSession,
  readinessState: CheckoutSessionSummary['readinessState'],
) => {
  const status = session.status

  if (status === 'expired') return 'Expired snapshot'
  if (session.revalidationStatus === 'pending') {
    return 'Verifying pricing and availability'
  }
  if (readinessState === 'ready') return 'Ready for payment once enabled'
  if (status === 'blocked') return 'Review inventory changes'
  if (status === 'completed') return 'Checkout complete'
  if (status === 'abandoned') return 'Checkout paused'
  if (session.revalidationStatus === 'failed') return 'Revalidation blocked checkout'
  return 'Awaiting checkout verification'
}

const formatTotalLabel = (session: CheckoutSession) => {
  if (session.totals.totalAmountCents != null && session.currencyCode) {
    return formatMoneyFromCents(
      session.totals.totalAmountCents,
      session.currencyCode,
    )
  }

  if (!session.items.length) return 'No items'
  return 'Pricing unavailable'
}

export const getCheckoutSessionSummary = (
  session: CheckoutSession,
  options: {
    entryMode?: CheckoutSessionEntryMode | null
  } = {},
): CheckoutSessionSummary => {
  const readinessState = getCheckoutReadinessState(session)
  const freshness = session.lastRevalidatedAt
    ? buildInventoryFreshness({
        checkedAt: session.lastRevalidatedAt,
        profile: 'availability_revalidation',
      })
    : null

  return {
    id: session.id,
    shortId: shortenOpaqueId(session.id),
    tripId: session.tripId,
    tripReference: buildTripReference(session.tripId),
    tripHref: `/trips/${session.tripId}`,
    status: session.status,
    statusLabel: toTitleCase(session.status),
    statusDescription: describeStatus(session, readinessState),
    itemCount: session.items.length,
    currencyCode: session.currencyCode,
    totalAmountCents: session.totals.totalAmountCents,
    totalLabel: formatTotalLabel(session),
    updatedAt: session.updatedAt,
    updatedLabel: formatDateTime(session.updatedAt),
    expiresAt: session.expiresAt,
    expiresLabel: formatDateTime(session.expiresAt),
    entryMode: options.entryMode ?? null,
    revalidationStatus: session.revalidationStatus,
    readinessState,
    lastRevalidatedAt: session.lastRevalidatedAt,
    lastRevalidatedLabel: freshness
      ? `Last checked ${freshness.relativeLabel === 'moments ago' ? 'just now' : freshness.relativeLabel}`
      : null,
    canReturnToTrip: true,
    readinessLabel: describeReadiness(session, readinessState),
    canProceed: canCheckoutProceedToPayment(session),
    blockingIssueCount: session.revalidationSummary?.blockingIssueCount || 0,
  }
}
