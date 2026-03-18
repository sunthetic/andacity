import { createHash } from 'node:crypto'
import type { CheckoutSession } from '~/types/checkout'
import type { PaymentAmountSnapshot } from '~/types/payment'

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

export const getCheckoutPaymentFingerprint = (
  checkoutSession: CheckoutSession,
  amountSnapshot: PaymentAmountSnapshot,
) => {
  const payload = {
    checkoutSessionId: checkoutSession.id,
    lastRevalidatedAt: checkoutSession.lastRevalidatedAt,
    revalidationCheckedAt: checkoutSession.revalidationSummary?.checkedAt || null,
    currency: amountSnapshot.currency,
    totalAmountCents: amountSnapshot.totalAmountCents,
    items: amountSnapshot.items.map((item) => ({
      tripItemId: item.tripItemId,
      inventoryId: item.inventoryId,
      totalAmountCents: item.totalAmountCents,
      currency: item.currency,
    })),
  }

  return createHash('sha256').update(stableSerialize(payload)).digest('hex')
}
