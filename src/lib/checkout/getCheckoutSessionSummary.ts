import { formatMoneyFromCents } from '~/lib/pricing/price-display'
import type { CheckoutSession, CheckoutSessionSummary } from '~/types/checkout'

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
    return 'This checkout snapshot is missing required inventory context and cannot proceed yet.'
  }

  if (status === 'expired') {
    return 'This checkout snapshot expired. Return to the trip to start a fresh session.'
  }

  if (status === 'completed') {
    return 'This checkout session is complete. Confirmation and booking persistence come in later tasks.'
  }

  if (status === 'abandoned') {
    return 'This checkout session was abandoned before confirmation.'
  }

  if (status === 'ready') {
    return 'This checkout session passed its current structural checks and is ready for later traveler and payment work.'
  }

  return 'This checkout session is a frozen trip snapshot waiting for later traveler, payment, and confirmation steps.'
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
    canProceed: session.status === 'draft' || session.status === 'ready',
  }
}
