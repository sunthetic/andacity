import { parseInventoryId } from '~/lib/inventory/inventory-id'
import { validateBookingSession } from '~/lib/booking/validateBookingSession'
import type { BookableEntity } from '~/types/bookable-entity'
import type { BookingSession, BookingSessionSource } from '~/types/booking'
import type { PriceQuote } from '~/types/pricing'

export const BOOKING_SESSION_DEFAULT_TTL_MS = 15 * 60 * 1000

const cloneValue = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }

  return value
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const centsToAmount = (value: number | null | undefined) =>
  value == null ? undefined : Math.round(value) / 100

export const createBookingSessionId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `bks_${globalThis.crypto.randomUUID()}`
  }

  return `bks_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export const buildPriceQuoteFromBookableEntity = (entity: BookableEntity): PriceQuote | null => {
  if (entity.price.amountCents == null || !entity.price.currency) {
    return null
  }

  if (entity.vertical === 'hotel') {
    return {
      currency: entity.price.currency,
      amount: entity.price.amountCents / 100,
      base: centsToAmount(entity.payload.priceSummary?.totalBaseCents),
      nightly: centsToAmount(entity.payload.priceSummary?.nightlyBaseCents),
      nights: entity.payload.priceSummary?.nights ?? undefined,
      taxes: centsToAmount(entity.payload.priceSummary?.taxesCents),
      fees: centsToAmount(entity.payload.priceSummary?.mandatoryFeesCents),
    }
  }

  if (entity.vertical === 'car') {
    return {
      currency: entity.price.currency,
      amount: entity.price.amountCents / 100,
      base: centsToAmount(entity.payload.priceSummary?.totalBaseCents),
      daily: centsToAmount(entity.payload.priceSummary?.dailyBaseCents),
      days: entity.payload.priceSummary?.days ?? undefined,
      taxes: centsToAmount(entity.payload.priceSummary?.taxesCents),
      fees: centsToAmount(entity.payload.priceSummary?.mandatoryFeesCents),
    }
  }

  return {
    currency: entity.price.currency,
    amount: entity.price.amountCents / 100,
  }
}

export const resolveBookingSessionProvider = (entity: BookableEntity) => {
  const parsedInventory = parseInventoryId(entity.inventoryId)

  if (parsedInventory?.vertical === 'hotel' && parsedInventory.provider) {
    return parsedInventory.provider
  }

  return entity.vertical
}

export const buildBookingSessionProviderMetadata = (
  entity: BookableEntity,
): Record<string, unknown> | null => {
  const provider = resolveBookingSessionProvider(entity)
  const parsedInventory = parseInventoryId(entity.inventoryId)
  const base = {
    inventoryId: entity.inventoryId,
    vertical: entity.vertical,
    provider,
    providerName:
      entity.vertical === 'flight'
        ? entity.payload.providerMetadata?.providerName || entity.provider || provider
        : entity.vertical === 'hotel'
          ? entity.payload.providerMetadata?.providerName || entity.provider || provider
          : entity.payload.providerMetadata?.providerName || entity.provider || provider,
    providerInventoryId: toPositiveInteger(entity.payload.providerInventoryId),
    href: toNullableText(entity.href),
  } satisfies Record<string, unknown>

  if (entity.vertical === 'flight') {
    const parsedFlight = parsedInventory?.vertical === 'flight' ? parsedInventory : null

    return {
      ...base,
      carrier:
        toNullableText(entity.bookingContext.carrier) ||
        toNullableText(parsedFlight?.airlineCode),
      // Keep canonical fallback tokens available for session validation even when
      // the visible UI intentionally hides a numeric route placeholder.
      flightNumber:
        toNullableText(entity.bookingContext.flightNumber) ||
        toNullableText(parsedFlight?.flightNumber),
      origin: toNullableText(entity.bookingContext.origin),
      destination: toNullableText(entity.bookingContext.destination),
      departDate: toNullableText(entity.bookingContext.departDate),
      cabinClass: toNullableText(entity.payload.cabinClass),
      fareCode: toNullableText(entity.payload.fareCode),
      itineraryType:
        toNullableText(entity.payload.providerMetadata?.itineraryType) ||
        toNullableText(entity.payload.itineraryType),
      requestedServiceDate: toNullableText(entity.payload.providerMetadata?.requestedServiceDate),
      serviceDate:
        toNullableText(entity.payload.providerMetadata?.serviceDate) ||
        toNullableText(entity.bookingContext.departDate),
      departureAt: toNullableText(entity.payload.departureAt),
      arrivalAt: toNullableText(entity.payload.arrivalAt),
      policy: cloneValue(entity.payload.policy || null),
      segments: cloneValue(entity.payload.segments || null),
      rawProviderMetadata: cloneValue(entity.payload.providerMetadata || null),
    }
  }

  if (entity.vertical === 'hotel') {
    const parsedInventory = parseInventoryId(entity.inventoryId)
    const parsedHotel = parsedInventory?.vertical === 'hotel' ? parsedInventory : null

    return {
      ...base,
      hotelId: toNullableText(entity.bookingContext.hotelId),
      hotelSlug: toNullableText(entity.payload.hotelSlug),
      checkInDate: toNullableText(entity.bookingContext.checkInDate),
      checkOutDate: toNullableText(entity.bookingContext.checkOutDate),
      roomType: toNullableText(entity.bookingContext.roomType),
      occupancy: toPositiveInteger(entity.bookingContext.occupancy),
      providerOfferId:
        toNullableText(entity.payload.providerMetadata?.providerOfferId) ||
        toNullableText(entity.payload.providerOfferId) ||
        toNullableText(parsedHotel?.providerOfferId),
      providerHotelId:
        toNullableText(entity.payload.providerMetadata?.providerHotelId) ||
        toNullableText(entity.bookingContext.hotelId),
      ratePlanId:
        toNullableText(entity.payload.providerMetadata?.ratePlanId) ||
        toNullableText(entity.payload.ratePlanId) ||
        toNullableText(parsedHotel?.ratePlanId),
      ratePlan: toNullableText(entity.payload.ratePlan),
      boardType:
        toNullableText(entity.payload.providerMetadata?.boardType) ||
        toNullableText(entity.payload.boardType) ||
        toNullableText(parsedHotel?.boardType),
      cancellationPolicy:
        toNullableText(entity.payload.providerMetadata?.cancellationPolicy) ||
        toNullableText(entity.payload.cancellationPolicy) ||
        toNullableText(parsedHotel?.cancellationPolicy),
      assumedStayDates: Boolean(entity.payload.assumedStayDates),
      assumedOccupancy: Boolean(entity.payload.assumedOccupancy),
      priceSummary: cloneValue(entity.payload.priceSummary || null),
      policy: cloneValue(entity.payload.policy || null),
      inclusions: cloneValue(entity.payload.inclusions || null),
      rawProviderMetadata: cloneValue(entity.payload.providerMetadata || null),
    }
  }

  return {
    ...base,
    providerLocationId: toNullableText(entity.bookingContext.providerLocationId),
    pickupDateTime: toNullableText(entity.bookingContext.pickupDateTime),
    dropoffDateTime: toNullableText(entity.bookingContext.dropoffDateTime),
    vehicleClass: toNullableText(entity.bookingContext.vehicleClass),
    pickupLocationName:
      toNullableText(entity.payload.providerMetadata?.pickupLocationName) ||
      toNullableText(entity.payload.pickupLocationName),
    dropoffLocationName:
      toNullableText(entity.payload.providerMetadata?.dropoffLocationName) ||
      toNullableText(entity.payload.dropoffLocationName),
    pickupLocationType:
      toNullableText(entity.payload.providerMetadata?.pickupLocationType) ||
      toNullableText(entity.payload.pickupLocationType),
    dropoffLocationType:
      toNullableText(entity.payload.providerMetadata?.dropoffLocationType) ||
      toNullableText(entity.payload.dropoffLocationType),
    pickupAddressLine:
      toNullableText(entity.payload.providerMetadata?.pickupAddressLine) ||
      toNullableText(entity.payload.pickupAddressLine),
    dropoffAddressLine:
      toNullableText(entity.payload.providerMetadata?.dropoffAddressLine) ||
      toNullableText(entity.payload.dropoffAddressLine),
    ratePlanCode:
      toNullableText(entity.payload.providerMetadata?.ratePlanCode) ||
      toNullableText(entity.payload.ratePlanCode),
    ratePlan:
      toNullableText(entity.payload.providerMetadata?.ratePlan) ||
      toNullableText(entity.payload.ratePlan),
    fuelPolicy:
      toNullableText(entity.payload.providerMetadata?.fuelPolicy) ||
      toNullableText(entity.payload.fuelPolicy),
    mileagePolicy:
      toNullableText(entity.payload.providerMetadata?.mileagePolicy) ||
      toNullableText(entity.payload.mileagePolicy),
    assumedRentalWindow: Boolean(entity.payload.assumedRentalWindow),
    priceSummary: cloneValue(entity.payload.priceSummary || null),
    policy: cloneValue(entity.payload.policy || null),
    inclusions: cloneValue(entity.payload.inclusions || null),
    badges: cloneValue(entity.payload.badges || null),
    features: cloneValue(entity.payload.features || null),
    rawProviderMetadata: cloneValue(entity.payload.providerMetadata || null),
  }
}

export const buildBookingSession = (input: {
  entity: BookableEntity
  price: PriceQuote
  createdAt?: Date | string | null
  ttlMs?: number
  source?: BookingSessionSource
  tripItemId?: number | null
  sessionId?: string | null
}): BookingSession | null => {
  const createdAt = normalizeTimestamp(input.createdAt)
  const ttlMs = Math.max(1000, Math.round(Number(input.ttlMs ?? BOOKING_SESSION_DEFAULT_TTL_MS) || 0))
  const expiresAt = new Date(Date.parse(createdAt) + ttlMs).toISOString()
  const providerMetadata = buildBookingSessionProviderMetadata(input.entity)

  if (!providerMetadata || !isRecord(providerMetadata)) {
    return null
  }

  const session: BookingSession = {
    sessionId: toNullableText(input.sessionId) || createBookingSessionId(),
    inventoryId: input.entity.inventoryId,
    vertical: input.entity.vertical,
    provider: resolveBookingSessionProvider(input.entity),
    status: 'active',
    source: input.source === 'trip_item' ? 'trip_item' : 'inventory',
    tripItemId: toPositiveInteger(input.tripItemId) ?? null,
    entity: cloneValue(input.entity),
    price: cloneValue(input.price),
    providerMetadata,
    createdAt,
    expiresAt,
  }

  return validateBookingSession(session, { now: createdAt }) ? session : null
}
