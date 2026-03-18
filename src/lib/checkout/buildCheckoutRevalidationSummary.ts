import type {
  CheckoutItemRevalidationResult,
  CheckoutPricingSnapshot,
  CheckoutRevalidationSummary,
} from '~/types/checkout'

const addNullableAmounts = (values: Array<number | null | undefined>) => {
  const present = values.filter((value): value is number => Number.isFinite(value as number))
  if (!present.length) return null
  return present.reduce((sum, value) => sum + Math.round(value), 0)
}

const buildCurrentTotals = (
  itemResults: CheckoutItemRevalidationResult[],
): CheckoutPricingSnapshot | null => {
  const currencies = Array.from(
    new Set(
      itemResults
        .map((item) => item.currentPricing?.currencyCode || null)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (!currencies.length) return null

  return {
    currencyCode: currencies.length === 1 ? currencies[0] : null,
    baseAmountCents: addNullableAmounts(
      itemResults.map((item) => item.currentPricing?.baseAmountCents),
    ),
    taxesAmountCents: addNullableAmounts(
      itemResults.map((item) => item.currentPricing?.taxesAmountCents),
    ),
    feesAmountCents: addNullableAmounts(
      itemResults.map((item) => item.currentPricing?.feesAmountCents),
    ),
    totalAmountCents:
      currencies.length === 1
        ? addNullableAmounts(
            itemResults.map((item) => item.currentPricing?.totalAmountCents),
          )
        : null,
  }
}

export const buildCheckoutRevalidationSummary = (input: {
  checkedAt: Date | string
  itemResults: CheckoutItemRevalidationResult[]
}): CheckoutRevalidationSummary => {
  const priceChangeCount = input.itemResults.filter(
    (item) => item.status === 'price_changed',
  ).length
  const unavailableCount = input.itemResults.filter(
    (item) => item.status === 'unavailable',
  ).length
  const changedCount = input.itemResults.filter(
    (item) => item.status === 'changed',
  ).length
  const failedCount = input.itemResults.filter(
    (item) => item.status === 'failed',
  ).length
  const blockingIssueCount =
    priceChangeCount + unavailableCount + changedCount + failedCount

  return {
    status: blockingIssueCount === 0 ? 'passed' : 'failed',
    checkedAt:
      input.checkedAt instanceof Date
        ? input.checkedAt.toISOString()
        : new Date(input.checkedAt).toISOString(),
    itemResults: input.itemResults,
    allItemsPassed: blockingIssueCount === 0,
    blockingIssueCount,
    priceChangeCount,
    unavailableCount,
    changedCount,
    failedCount,
    currentTotals: buildCurrentTotals(input.itemResults),
  }
}
