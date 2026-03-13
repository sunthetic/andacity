import type { TripItem, TripValidationIssue } from '~/types/trips/trip'

export const TRIP_REVALIDATION_ISSUE_CODES = [
  'price_changed',
  'sold_out',
  'currency_changed',
] as const

export type TripRevalidationIssueCode = (typeof TRIP_REVALIDATION_ISSUE_CODES)[number]

const buildIssue = (
  item: TripItem,
  code: TripRevalidationIssueCode,
): TripValidationIssue | null => {
  if (code === 'sold_out') {
    return {
      code,
      scope: 'availability',
      severity: 'blocking',
      message: `${item.title} is no longer available at the saved inventory snapshot.`,
      itemId: item.id,
    }
  }

  if (code === 'currency_changed') {
    if (!item.currentCurrencyCode || item.currentCurrencyCode === item.snapshotCurrencyCode) {
      return null
    }

    return {
      code,
      scope: 'availability',
      severity: 'warning',
      message: `${item.title} now prices in ${item.currentCurrencyCode} instead of ${item.snapshotCurrencyCode}.`,
      itemId: item.id,
    }
  }

  if (item.currentPriceCents == null || item.currentPriceCents === item.snapshotPriceCents) {
    return null
  }

  return {
    code,
    scope: 'availability',
    severity: 'warning',
    message: `${item.title} price changed since the saved snapshot.`,
    itemId: item.id,
  }
}

export const buildTripItemRevalidationIssues = (items: TripItem[]) => {
  const issuesByItemId = new Map<number, TripValidationIssue[]>()

  for (const item of items) {
    const nextIssues: TripValidationIssue[] = []

    if (item.availabilityStatus === 'unavailable') {
      const soldOut = buildIssue(item, 'sold_out')
      if (soldOut) nextIssues.push(soldOut)
    }

    const currencyChanged = buildIssue(item, 'currency_changed')
    if (currencyChanged) nextIssues.push(currencyChanged)

    const priceChanged = buildIssue(item, 'price_changed')
    if (priceChanged) nextIssues.push(priceChanged)

    if (nextIssues.length) {
      issuesByItemId.set(item.id, nextIssues)
    }
  }

  return issuesByItemId
}

export const revalidateTripItems = async (tripId: number) => {
  const { getTripDetails } = await import('~/lib/repos/trips-repo.server')
  const trip = await getTripDetails(tripId, { revalidate: 'force' })
  if (!trip) return []

  return trip.items.flatMap((item) => buildTripItemRevalidationIssues([item]).get(item.id) || [])
}
