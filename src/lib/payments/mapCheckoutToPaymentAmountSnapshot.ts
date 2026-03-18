import type { CheckoutSession } from '~/types/checkout'
import type { PaymentAmountSnapshot } from '~/types/payment'

const normalizeCurrencyCode = (value: string | null | undefined) => {
  const token = String(value || '')
    .trim()
    .toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : null
}

const toNonNegativeInteger = (value: number | null | undefined) => {
  return Number.isFinite(value as number) && Number(value) >= 0
    ? Math.round(Number(value))
    : null
}

export const mapCheckoutToPaymentAmountSnapshot = (
  checkoutSession: CheckoutSession,
): PaymentAmountSnapshot | null => {
  const revalidatedTotals =
    checkoutSession.revalidationStatus === 'passed' &&
    checkoutSession.revalidationSummary?.allItemsPassed
      ? checkoutSession.revalidationSummary.currentTotals
      : null
  const totals = revalidatedTotals || checkoutSession.totals
  const currency = normalizeCurrencyCode(
    totals?.currencyCode || checkoutSession.currencyCode,
  )
  const totalAmountCents = toNonNegativeInteger(totals?.totalAmountCents)

  if (!currency || totalAmountCents == null) {
    return null
  }

  return {
    source: revalidatedTotals ? 'revalidated_totals' : 'checkout_snapshot',
    currency,
    baseAmountCents: toNonNegativeInteger(totals?.baseAmountCents),
    taxesAmountCents: toNonNegativeInteger(totals?.taxesAmountCents),
    feesAmountCents: toNonNegativeInteger(totals?.feesAmountCents),
    totalAmountCents,
    itemCount: checkoutSession.items.length,
    items: checkoutSession.items.map((item) => ({
      tripItemId: item.tripItemId,
      inventoryId: item.inventory.inventoryId,
      totalAmountCents: toNonNegativeInteger(item.pricing.totalAmountCents),
      currency: normalizeCurrencyCode(item.pricing.currencyCode),
    })),
  }
}
