import {
  buildBookingSessionProviderMetadata,
} from '~/lib/booking/buildBookingSession'
import { toBookableEntityFromTripItem } from '~/lib/booking/bookable-entity'
import type { BookableEntity } from '~/types/bookable-entity'
import type {
  CheckoutItemSnapshot,
  CheckoutPricingSnapshot,
  CheckoutSessionStatus,
  CreateCheckoutSessionInput,
} from '~/types/checkout'
import type { TripDetails, TripItem } from '~/types/trips/trip'

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const addNullableAmounts = (values: Array<number | null | undefined>) => {
  const present = values.filter((value): value is number => Number.isFinite(value as number))
  if (!present.length) return null
  return present.reduce((sum, value) => sum + Math.round(value), 0)
}

const resolveEntityId = (item: TripItem) => {
  if (item.itemType === 'hotel') return item.hotelId
  if (item.itemType === 'flight') return item.flightItineraryId
  return item.carInventoryId
}

const resolveBookableEntity = (item: TripItem): BookableEntity | null => {
  const snapshotEntity = item.inventorySnapshot?.bookableEntity || item.bookableEntity
  if (snapshotEntity && snapshotEntity.vertical === item.itemType) {
    return snapshotEntity
  }

  try {
    return toBookableEntityFromTripItem(item)
  } catch {
    return null
  }
}

const toItemPricingSnapshot = (item: TripItem, entity: BookableEntity | null): CheckoutPricingSnapshot => {
  const hotelSummary =
    entity?.vertical === 'hotel' ? entity.payload.priceSummary || null : null
  const carSummary = entity?.vertical === 'car' ? entity.payload.priceSummary || null : null

  const baseAmountCents =
    hotelSummary?.totalBaseCents ??
    carSummary?.totalBaseCents ??
    item.snapshotPriceCents
  const taxesAmountCents =
    hotelSummary?.taxesCents ?? carSummary?.taxesCents ?? null
  const feesAmountCents =
    hotelSummary?.mandatoryFeesCents ?? carSummary?.mandatoryFeesCents ?? null

  return {
    currencyCode: item.snapshotCurrencyCode || entity?.price.currency || null,
    baseAmountCents,
    taxesAmountCents,
    feesAmountCents,
    totalAmountCents: item.snapshotPriceCents,
  }
}

const toCheckoutItemSnapshot = (item: TripItem): CheckoutItemSnapshot => {
  const entity = resolveBookableEntity(item)
  const pricing = toItemPricingSnapshot(item, entity)
  const entityId = resolveEntityId(item)

  return {
    tripItemId: item.id,
    itemType: item.itemType,
    vertical: item.itemType,
    entityId,
    bookableEntityId: entityId,
    inventory: {
      inventoryId: item.inventoryId,
      providerInventoryId: item.inventorySnapshot?.providerInventoryId ?? entityId,
      hotelAvailabilitySnapshotId:
        item.inventorySnapshot?.hotelAvailabilitySnapshotId ?? null,
      availability: item.inventorySnapshot?.availability ?? null,
      bookableEntity: entity,
      providerMetadata: entity ? buildBookingSessionProviderMetadata(entity) : null,
    },
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    meta: item.meta,
    startDate: item.startDate,
    endDate: item.endDate,
    snapshotTimestamp: normalizeTimestamp(item.snapshotTimestamp),
    pricing,
  }
}

const resolveSessionCurrency = (trip: TripDetails, items: CheckoutItemSnapshot[]) => {
  if (trip.pricing.hasMixedCurrencies) return null

  const tripCurrency = String(trip.pricing.currencyCode || '').trim().toUpperCase()
  if (tripCurrency) return tripCurrency

  const itemCurrencies = Array.from(
    new Set(
      items
        .map((item) => String(item.pricing.currencyCode || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  )

  return itemCurrencies.length === 1 ? itemCurrencies[0] : null
}

const hasStructuralBlocker = (trip: TripDetails, items: CheckoutItemSnapshot[]) => {
  if (trip.pricing.hasMixedCurrencies) return true

  return items.some((item) => {
    return (
      !item.inventory.inventoryId ||
      item.inventory.bookableEntity == null ||
      item.inventory.providerMetadata == null
    )
  })
}

export const mapTripToCheckoutSession = (
  input: CreateCheckoutSessionInput,
): {
  currencyCode: string | null
  items: CheckoutItemSnapshot[]
  totals: CheckoutPricingSnapshot
  status: CheckoutSessionStatus
} => {
  const items = [...input.trip.items]
    .sort((left, right) => left.position - right.position)
    .map((item) => toCheckoutItemSnapshot(item))

  const currencyCode = resolveSessionCurrency(input.trip, items)
  const totalAmountCents =
    currencyCode && !input.trip.pricing.hasMixedCurrencies
      ? items.reduce(
          (sum, item) => sum + Math.max(0, Math.round(item.pricing.totalAmountCents || 0)),
          0,
        )
      : null

  return {
    currencyCode,
    items,
    totals: {
      currencyCode,
      baseAmountCents: addNullableAmounts(
        items.map((item) => item.pricing.baseAmountCents),
      ),
      taxesAmountCents: addNullableAmounts(
        items.map((item) => item.pricing.taxesAmountCents),
      ),
      feesAmountCents: addNullableAmounts(
        items.map((item) => item.pricing.feesAmountCents),
      ),
      totalAmountCents,
    },
    // Reserve `ready` for later tasks once revalidation and traveler requirements exist.
    status: hasStructuralBlocker(input.trip, items) ? 'blocked' : 'draft',
  }
}
