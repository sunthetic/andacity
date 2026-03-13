import {
  normalizeTripItemSnapshotCurrencyCode,
  normalizeTripItemSnapshotPriceCents,
} from '~/lib/trips/trip-item-snapshot'
import type {
  InventorySnapshot,
  InventorySnapshotValidationResult,
  ResolvedInventoryRecord,
} from '~/types/inventory'
import type { BookableEntity } from '~/types/bookable-entity'

const isResolvedInventoryRecord = (
  value: ResolvedInventoryRecord | BookableEntity | null,
): value is ResolvedInventoryRecord =>
  Boolean(value) && typeof value === 'object' && value !== null && 'entity' in value

export const validateSnapshot = (input: {
  snapshot?: InventorySnapshot | null
  live: ResolvedInventoryRecord | BookableEntity | null
}): InventorySnapshotValidationResult => {
  let liveEntity: BookableEntity | null = null
  let isAvailable: boolean | null | undefined

  if (isResolvedInventoryRecord(input.live)) {
    liveEntity = input.live.entity
    isAvailable = input.live.isAvailable
  } else {
    liveEntity = input.live
  }

  if (!liveEntity || isAvailable === false) {
    return { status: 'unavailable' }
  }

  const snapshotPriceCents = normalizeTripItemSnapshotPriceCents(input.snapshot?.priceCents)
  const snapshotCurrencyCode = normalizeTripItemSnapshotCurrencyCode(input.snapshot?.currencyCode)
  const livePriceCents = normalizeTripItemSnapshotPriceCents(liveEntity.price.amountCents)
  const liveCurrencyCode = normalizeTripItemSnapshotCurrencyCode(liveEntity.price.currency)

  const priceChanged =
    (snapshotPriceCents != null &&
      livePriceCents != null &&
      snapshotPriceCents !== livePriceCents) ||
    (snapshotCurrencyCode != null &&
      liveCurrencyCode != null &&
      snapshotCurrencyCode !== liveCurrencyCode)

  return {
    status: priceChanged ? 'price_changed' : 'valid',
  }
}
