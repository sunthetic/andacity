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

const describeStatus = (status: CheckoutSession['status']) => {
  if (status === 'blocked') {
    return 'This checkout snapshot needs more trip updates before it can move forward.'
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
    return 'This checkout snapshot is ready for the next traveler and payment steps once they are introduced.'
  }

  return 'This checkout session is a frozen trip snapshot that will be rechecked before payment.'
}

const describeReadiness = (status: CheckoutSession['status']) => {
  if (status === 'expired') return 'Expired snapshot'
  if (status === 'blocked') return 'Needs trip updates'
  if (status === 'completed') return 'Checkout complete'
  if (status === 'abandoned') return 'Checkout paused'
  if (status === 'ready') return 'Ready for next checkout steps'
  return 'Snapshot ready for confirmation checks'
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
  return {
    id: session.id,
    shortId: shortenOpaqueId(session.id),
    tripId: session.tripId,
    tripReference: buildTripReference(session.tripId),
    tripHref: `/trips/${session.tripId}`,
    status: session.status,
    statusLabel: toTitleCase(session.status),
    statusDescription: describeStatus(session.status),
    itemCount: session.items.length,
    currencyCode: session.currencyCode,
    totalAmountCents: session.totals.totalAmountCents,
    totalLabel: formatTotalLabel(session),
    updatedAt: session.updatedAt,
    updatedLabel: formatDateTime(session.updatedAt),
    expiresAt: session.expiresAt,
    expiresLabel: formatDateTime(session.expiresAt),
    entryMode: options.entryMode ?? null,
    canReturnToTrip: true,
    readinessLabel: describeReadiness(session.status),
    canProceed: session.status === 'draft' || session.status === 'ready',
  }
}
