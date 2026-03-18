import { buildBookingSessionProviderMetadata } from '~/lib/booking/buildBookingSession'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type { ResolvedInventoryRecord } from '~/types/inventory'
import type {
  CheckoutInventoryReference,
  CheckoutItemRevalidationResult,
  CheckoutItemSnapshot,
  CheckoutPricingSnapshot,
} from '~/types/checkout'
import type {
  BookableEntity,
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from '~/types/bookable-entity'

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

const compareOptionalText = (
  snapshotValue: string | null | undefined,
  currentValue: string | null | undefined,
) => {
  const normalizedSnapshot = toNullableText(snapshotValue)
  const normalizedCurrent = toNullableText(currentValue)
  if (!normalizedSnapshot) return true
  return normalizedSnapshot === normalizedCurrent
}

const normalizePricingSnapshot = (
  value: CheckoutPricingSnapshot | null | undefined,
): CheckoutPricingSnapshot => {
  return {
    currencyCode: toNullableText(value?.currencyCode)?.toUpperCase() || null,
    baseAmountCents:
      typeof value?.baseAmountCents === 'number' && Number.isFinite(value.baseAmountCents)
        ? Math.round(value.baseAmountCents)
        : null,
    taxesAmountCents:
      typeof value?.taxesAmountCents === 'number' && Number.isFinite(value.taxesAmountCents)
        ? Math.round(value.taxesAmountCents)
        : null,
    feesAmountCents:
      typeof value?.feesAmountCents === 'number' && Number.isFinite(value.feesAmountCents)
        ? Math.round(value.feesAmountCents)
        : null,
    totalAmountCents:
      typeof value?.totalAmountCents === 'number' && Number.isFinite(value.totalAmountCents)
        ? Math.round(value.totalAmountCents)
        : null,
  }
}

const buildPricingSnapshotFromEntity = (
  entity: BookableEntity,
): CheckoutPricingSnapshot => {
  if (entity.vertical === 'hotel') {
    return {
      currencyCode: entity.price.currency,
      baseAmountCents: entity.payload.priceSummary?.totalBaseCents ?? null,
      taxesAmountCents: entity.payload.priceSummary?.taxesCents ?? null,
      feesAmountCents: entity.payload.priceSummary?.mandatoryFeesCents ?? null,
      totalAmountCents: entity.price.amountCents,
    }
  }

  if (entity.vertical === 'car') {
    return {
      currencyCode: entity.price.currency,
      baseAmountCents: entity.payload.priceSummary?.totalBaseCents ?? null,
      taxesAmountCents: entity.payload.priceSummary?.taxesCents ?? null,
      feesAmountCents: entity.payload.priceSummary?.mandatoryFeesCents ?? null,
      totalAmountCents: entity.price.amountCents,
    }
  }

  return {
    currencyCode: entity.price.currency,
    baseAmountCents: null,
    taxesAmountCents: null,
    feesAmountCents: null,
    totalAmountCents: entity.price.amountCents,
  }
}

const buildInventoryReferenceFromEntity = (
  entity: BookableEntity,
): CheckoutInventoryReference => {
  return {
    inventoryId: entity.inventoryId,
    providerInventoryId: toPositiveInteger(entity.payload.providerInventoryId),
    hotelAvailabilitySnapshotId: null,
    availability: null,
    bookableEntity: entity,
    providerMetadata: buildBookingSessionProviderMetadata(entity),
  }
}

const pricingSnapshotsMatch = (
  previousPricing: CheckoutPricingSnapshot,
  currentPricing: CheckoutPricingSnapshot,
) => {
  if (
    !previousPricing.currencyCode ||
    !currentPricing.currencyCode ||
    previousPricing.currencyCode !== currentPricing.currencyCode
  ) {
    return false
  }

  if (
    previousPricing.totalAmountCents == null ||
    currentPricing.totalAmountCents == null ||
    previousPricing.totalAmountCents !== currentPricing.totalAmountCents
  ) {
    return false
  }

  const optionalFields: Array<keyof CheckoutPricingSnapshot> = [
    'baseAmountCents',
    'taxesAmountCents',
    'feesAmountCents',
  ]

  return optionalFields.every((field) => {
    const previousValue = previousPricing[field]
    const currentValue = currentPricing[field]
    if (previousValue == null || currentValue == null) return true
    return previousValue === currentValue
  })
}

const verticalIdentityMatches = (
  snapshot: CheckoutItemSnapshot,
  current: BookableEntity,
) => {
  if (snapshot.vertical !== current.vertical) return false

  const snapshotParsed = parseInventoryId(snapshot.inventory.inventoryId)
  const currentParsed = parseInventoryId(current.inventoryId)
  if (!snapshotParsed || !currentParsed) return false
  if (snapshotParsed.vertical !== currentParsed.vertical) return false

  if (snapshotParsed.vertical === 'flight' && currentParsed.vertical === 'flight') {
    const snapshotEntity =
      snapshot.inventory.bookableEntity?.vertical === 'flight'
        ? (snapshot.inventory.bookableEntity as FlightBookableEntity)
        : null
    const currentEntity = current as FlightBookableEntity

    return (
      snapshotParsed.carrier === currentParsed.carrier &&
      snapshotParsed.flightNumber === currentParsed.flightNumber &&
      snapshotParsed.origin === currentParsed.origin &&
      snapshotParsed.destination === currentParsed.destination &&
      snapshotParsed.departDate === currentParsed.departDate &&
      compareOptionalText(snapshotEntity?.payload.fareCode, currentEntity.payload.fareCode) &&
      compareOptionalText(snapshotEntity?.payload.cabinClass, currentEntity.payload.cabinClass) &&
      compareOptionalText(
        snapshotEntity?.payload.departureAt,
        currentEntity.payload.departureAt,
      ) &&
      compareOptionalText(snapshotEntity?.payload.arrivalAt, currentEntity.payload.arrivalAt)
    )
  }

  if (snapshotParsed.vertical === 'hotel' && currentParsed.vertical === 'hotel') {
    const snapshotEntity =
      snapshot.inventory.bookableEntity?.vertical === 'hotel'
        ? (snapshot.inventory.bookableEntity as HotelBookableEntity)
        : null
    const currentEntity = current as HotelBookableEntity

    return (
      snapshotParsed.provider === currentParsed.provider &&
      snapshotParsed.hotelId === currentParsed.hotelId &&
      snapshotParsed.providerOfferId === currentParsed.providerOfferId &&
      snapshotParsed.ratePlanId === currentParsed.ratePlanId &&
      snapshotParsed.boardType === currentParsed.boardType &&
      snapshotParsed.cancellationPolicy === currentParsed.cancellationPolicy &&
      snapshotParsed.roomType === currentParsed.roomType &&
      snapshotParsed.occupancy === currentParsed.occupancy &&
      snapshotParsed.checkInDate === currentParsed.checkInDate &&
      snapshotParsed.checkOutDate === currentParsed.checkOutDate &&
      compareOptionalText(
        snapshotEntity?.bookingContext.hotelId,
        currentEntity.bookingContext.hotelId,
      )
    )
  }

  if (snapshotParsed.vertical !== 'car' || currentParsed.vertical !== 'car') {
    return false
  }

  const snapshotEntity =
    snapshot.inventory.bookableEntity?.vertical === 'car'
      ? (snapshot.inventory.bookableEntity as CarBookableEntity)
      : null
  const currentEntity = current as CarBookableEntity

  return (
    snapshotParsed.providerLocationId === currentParsed.providerLocationId &&
    snapshotParsed.vehicleClass === currentParsed.vehicleClass &&
    snapshotParsed.pickupDateTime === currentParsed.pickupDateTime &&
    snapshotParsed.dropoffDateTime === currentParsed.dropoffDateTime &&
    compareOptionalText(snapshotEntity?.payload.ratePlanCode, currentEntity.payload.ratePlanCode)
  )
}

const buildResult = (input: {
  snapshot: CheckoutItemSnapshot
  status: CheckoutItemRevalidationResult['status']
  message: string
  currentPricing: CheckoutPricingSnapshot | null
  currentInventory: CheckoutInventoryReference | null
  providerMetadata?: Record<string, unknown> | null
}): CheckoutItemRevalidationResult => {
  return {
    tripItemId: input.snapshot.tripItemId,
    itemType: input.snapshot.itemType,
    vertical: input.snapshot.vertical,
    title: input.snapshot.title,
    subtitle: input.snapshot.subtitle,
    status: input.status,
    message: input.message,
    previousPricing: normalizePricingSnapshot(input.snapshot.pricing),
    currentPricing: input.currentPricing ? normalizePricingSnapshot(input.currentPricing) : null,
    previousInventory: input.snapshot.inventory,
    currentInventory: input.currentInventory,
    providerMetadata:
      input.providerMetadata === undefined
        ? input.currentInventory?.providerMetadata || input.snapshot.inventory.providerMetadata
        : input.providerMetadata,
  }
}

export const compareCheckoutSnapshotToResolvedInventory = (input: {
  snapshot: CheckoutItemSnapshot
  resolved: ResolvedInventoryRecord
}): CheckoutItemRevalidationResult => {
  const currentEntity = input.resolved.entity
  const currentInventory = buildInventoryReferenceFromEntity(currentEntity)
  const currentPricing = buildPricingSnapshotFromEntity(currentEntity)
  const previousPricing = normalizePricingSnapshot(input.snapshot.pricing)

  if (!parseInventoryId(currentEntity.inventoryId)) {
    return buildResult({
      snapshot: input.snapshot,
      status: 'failed',
      message: 'Current inventory resolved with an invalid canonical identifier.',
      currentPricing,
      currentInventory,
    })
  }

  if (input.resolved.isAvailable === false) {
    return buildResult({
      snapshot: input.snapshot,
      status: 'unavailable',
      message: 'This item is no longer available for checkout.',
      currentPricing,
      currentInventory,
    })
  }

  if (!verticalIdentityMatches(input.snapshot, currentEntity)) {
    return buildResult({
      snapshot: input.snapshot,
      status: 'changed',
      message: 'This item resolved, but it no longer matches the saved checkout snapshot.',
      currentPricing,
      currentInventory,
    })
  }

  if (
    previousPricing.totalAmountCents == null ||
    !previousPricing.currencyCode ||
    currentPricing.totalAmountCents == null ||
    !currentPricing.currencyCode
  ) {
    return buildResult({
      snapshot: input.snapshot,
      status: 'failed',
      message: 'Pricing could not be fully confirmed for this checkout item.',
      currentPricing,
      currentInventory,
    })
  }

  if (!pricingSnapshotsMatch(previousPricing, currentPricing)) {
    return buildResult({
      snapshot: input.snapshot,
      status: 'price_changed',
      message: 'Pricing changed since this checkout snapshot was created.',
      currentPricing,
      currentInventory,
    })
  }

  return buildResult({
    snapshot: input.snapshot,
    status: 'passed',
    message: 'Pricing and availability still match the saved checkout snapshot.',
    currentPricing,
    currentInventory,
  })
}
