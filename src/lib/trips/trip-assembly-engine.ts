import { buildBookingSession, buildPriceQuoteFromBookableEntity } from '~/lib/booking/buildBookingSession'
import { createBookingSession } from '~/lib/booking/createBookingSession'
import { getBookingSession } from '~/lib/booking/getBookingSession'
import { persistBookingSession } from '~/lib/booking/bookingSessionStore'
import { resolveInventoryRecord } from '~/lib/inventory/resolveInventory'
import {
  addItemToTrip,
  createTrip,
  getTripDetails,
  removeItemFromTrip,
  setTripBookingSession,
} from '~/lib/repos/trips-repo.server'
import type { BookableEntity } from '~/types/bookable-entity'
import type { BookingSession } from '~/types/booking'
import type { PriceQuote } from '~/types/pricing'
import type { TripDetails, TripItemCandidate } from '~/types/trips/trip'

export const TRIP_ITEM_BOOKING_SESSION_ID_KEY = 'bookingSessionId'
export const TRIP_ITEM_BOOKING_SESSION_BINDING_KEY = 'bookingSessionBinding'
export const TRIP_ITEM_BOOKING_SESSION_SOURCE_KEY = 'bookingSessionSource'
export const TRIP_ITEM_BOOKABLE_SOURCE_KEY = 'bookableSource'
export const TRIP_ITEM_BOOKABLE_PRICE_SOURCE_KEY = 'bookablePriceSource'

export type TripAssemblySessionBinding = 'created' | 'attached'

export class TripAssemblyError extends Error {
  readonly code:
    | 'trip_not_found'
    | 'trip_item_not_found'
    | 'invalid_booking_session'
    | 'booking_session_mismatch'
    | 'inventory_unavailable'

  constructor(
    code:
      | 'trip_not_found'
      | 'trip_item_not_found'
      | 'invalid_booking_session'
      | 'booking_session_mismatch'
      | 'inventory_unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'TripAssemblyError'
    this.code = code
  }
}

type TripAssemblyDeps = {
  createTripFn: typeof createTrip
  getTripDetailsFn: typeof getTripDetails
  addItemToTripFn: typeof addItemToTrip
  removeItemFromTripFn: typeof removeItemFromTrip
  setTripBookingSessionFn: typeof setTripBookingSession
  createBookingSessionFn: typeof createBookingSession
  getBookingSessionFn: typeof getBookingSession
  resolveInventoryRecordFn: typeof resolveInventoryRecord
  buildBookingSessionFn: typeof buildBookingSession
  persistBookingSessionFn: typeof persistBookingSession
}

const defaultDeps = (): TripAssemblyDeps => ({
  createTripFn: createTrip,
  getTripDetailsFn: getTripDetails,
  addItemToTripFn: addItemToTrip,
  removeItemFromTripFn: removeItemFromTrip,
  setTripBookingSessionFn: setTripBookingSession,
  createBookingSessionFn: createBookingSession,
  getBookingSessionFn: getBookingSession,
  resolveInventoryRecordFn: resolveInventoryRecord,
  buildBookingSessionFn: buildBookingSession,
  persistBookingSessionFn: persistBookingSession,
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toIsoDate = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const dateTimeToIsoDate = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null
  return toIsoDate(text.slice(0, 10))
}

const toPriceQuoteAmountCents = (value: PriceQuote | null | undefined) => {
  if (!value) return null
  const amount = Number(value.amount)
  if (!Number.isFinite(amount)) return null
  return Math.max(0, Math.round(amount * 100))
}

const normalizeBookingSessionId = (value: string | null | undefined) => {
  const text = String(value || '').trim()
  return text ? text : null
}

const titleCaseToken = (value: string | null | undefined) => {
  const text = toNullableText(value)
  if (!text) return null

  return text
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

const buildTripItemMeta = (entity: BookableEntity) => {
  if (entity.vertical === 'flight') {
    return [
      titleCaseToken(entity.payload.itineraryType || null),
      titleCaseToken(entity.payload.cabinClass || null),
    ].filter((value): value is string => Boolean(value))
  }

  if (entity.vertical === 'hotel') {
    return [
      toNullableText(entity.bookingContext.roomType),
      toNullableText(entity.payload.ratePlan),
      toNullableText(entity.payload.boardType),
    ].filter((value): value is string => Boolean(value))
  }

  return [
    titleCaseToken(entity.bookingContext.vehicleClass),
    titleCaseToken(entity.payload.transmissionType || null),
  ].filter((value): value is string => Boolean(value))
}

const buildTripItemMetadata = (
  entity: BookableEntity,
  options: {
    bookingSessionId: string
    bookingSessionBinding: TripAssemblySessionBinding
    bookingSessionSource: BookingSession['source']
  },
) => {
  const metadata: Record<string, unknown> = {
    [TRIP_ITEM_BOOKING_SESSION_ID_KEY]: options.bookingSessionId,
    [TRIP_ITEM_BOOKING_SESSION_BINDING_KEY]: options.bookingSessionBinding,
    [TRIP_ITEM_BOOKING_SESSION_SOURCE_KEY]: options.bookingSessionSource,
    [TRIP_ITEM_BOOKABLE_SOURCE_KEY]: entity.payload.source,
    [TRIP_ITEM_BOOKABLE_PRICE_SOURCE_KEY]: entity.payload.priceSource,
  }

  const provider = toNullableText(entity.provider)
  if (provider) metadata.provider = provider

  const href = toNullableText(entity.href)
  if (href) metadata.href = href

  if (entity.payload.providerInventoryId != null) {
    metadata.providerInventoryId = entity.payload.providerInventoryId
  }

  if (entity.vertical === 'flight') {
    const carrier = toNullableText(entity.bookingContext.carrier)
    const cabinClass = toNullableText(entity.payload.cabinClass)
    const fareCode = toNullableText(entity.payload.fareCode)

    if (carrier) metadata.carrier = carrier
    if (cabinClass) metadata.cabinClass = cabinClass
    if (fareCode) metadata.fareCode = fareCode
  } else if (entity.vertical === 'hotel') {
    const hotelSlug = toNullableText(entity.payload.hotelSlug)
    const ratePlanId = toNullableText(entity.payload.ratePlanId)
    const ratePlan = toNullableText(entity.payload.ratePlan)
    const boardType = toNullableText(entity.payload.boardType)
    const cancellationPolicy = toNullableText(entity.payload.cancellationPolicy)

    if (hotelSlug) metadata.hotelSlug = hotelSlug
    if (ratePlanId) metadata.ratePlanId = ratePlanId
    if (ratePlan) metadata.ratePlan = ratePlan
    if (boardType) metadata.boardType = boardType
    if (cancellationPolicy) metadata.cancellationPolicy = cancellationPolicy
    if (entity.payload.assumedStayDates) metadata.assumedStayDates = true
    if (entity.payload.assumedOccupancy) metadata.assumedOccupancy = true
  } else {
    const ratePlanCode = toNullableText(entity.payload.ratePlanCode)
    const ratePlan = toNullableText(entity.payload.ratePlan)
    const fuelPolicy = toNullableText(entity.payload.fuelPolicy)
    const mileagePolicy = toNullableText(entity.payload.mileagePolicy)

    if (ratePlanCode) metadata.ratePlanCode = ratePlanCode
    if (ratePlan) metadata.ratePlan = ratePlan
    if (fuelPolicy) metadata.fuelPolicy = fuelPolicy
    if (mileagePolicy) metadata.mileagePolicy = mileagePolicy
    if (entity.payload.assumedRentalWindow) metadata.assumedRentalWindow = true
  }

  return metadata
}

export const readTripItemBookingSessionId = (value: unknown) => {
  if (!isRecord(value)) return null
  return normalizeBookingSessionId(value[TRIP_ITEM_BOOKING_SESSION_ID_KEY] as string | null | undefined)
}

export const buildTripItemCandidateFromBookableEntity = (
  entity: BookableEntity,
  options: {
    priceQuote?: PriceQuote | null
    bookingSessionId: string
    bookingSessionBinding: TripAssemblySessionBinding
    bookingSessionSource: BookingSession['source']
  },
): TripItemCandidate => {
  const priceQuote = options.priceQuote || buildPriceQuoteFromBookableEntity(entity)
  const priceCents =
    toPriceQuoteAmountCents(priceQuote) ??
    (entity.price.amountCents == null ? undefined : entity.price.amountCents)
  const currencyCode = toNullableText(priceQuote?.currency || entity.price.currency)?.toUpperCase()

  if (entity.vertical === 'flight') {
    const serviceDate = toIsoDate(entity.bookingContext.departDate)
    return {
      itemType: 'flight',
      inventoryId: entity.inventoryId,
      providerInventoryId: entity.payload.providerInventoryId || undefined,
      startDate: serviceDate || undefined,
      endDate: serviceDate || undefined,
      priceCents: priceCents ?? undefined,
      currencyCode: currencyCode || undefined,
      title: entity.title,
      subtitle: entity.subtitle || undefined,
      imageUrl: entity.imageUrl || undefined,
      meta: buildTripItemMeta(entity),
      metadata: buildTripItemMetadata(entity, options),
    }
  }

  if (entity.vertical === 'hotel') {
    return {
      itemType: 'hotel',
      inventoryId: entity.inventoryId,
      providerInventoryId: entity.payload.providerInventoryId || undefined,
      startDate: toIsoDate(entity.bookingContext.checkInDate) || undefined,
      endDate: toIsoDate(entity.bookingContext.checkOutDate) || undefined,
      priceCents: priceCents ?? undefined,
      currencyCode: currencyCode || undefined,
      title: entity.title,
      subtitle: entity.subtitle || undefined,
      imageUrl: entity.imageUrl || undefined,
      meta: buildTripItemMeta(entity),
      metadata: buildTripItemMetadata(entity, options),
    }
  }

  return {
    itemType: 'car',
    inventoryId: entity.inventoryId,
    providerInventoryId: entity.payload.providerInventoryId || undefined,
    startDate: dateTimeToIsoDate(entity.bookingContext.pickupDateTime) || undefined,
    endDate: dateTimeToIsoDate(entity.bookingContext.dropoffDateTime) || undefined,
    priceCents: priceCents ?? undefined,
    currencyCode: currencyCode || undefined,
    title: entity.title,
    subtitle: entity.subtitle || undefined,
    imageUrl: entity.imageUrl || undefined,
    meta: buildTripItemMeta(entity),
    metadata: buildTripItemMetadata(entity, options),
  }
}

const buildFallbackSessionFromInventory = async (
  entity: BookableEntity,
  deps: TripAssemblyDeps,
) => {
  const liveRecord = await deps.resolveInventoryRecordFn({
    inventoryId: entity.inventoryId,
    provider: entity.provider,
    providerInventoryId: entity.payload.providerInventoryId,
  })
  if (!liveRecord || liveRecord.isAvailable === false) return null

  const livePrice = buildPriceQuoteFromBookableEntity(liveRecord.entity)
  if (!livePrice) return null

  const session = deps.buildBookingSessionFn({
    entity: liveRecord.entity,
    price: livePrice,
    createdAt: liveRecord.checkedAt,
    source: 'inventory',
  })
  if (!session) return null

  return deps.persistBookingSessionFn(session)
}

const resolveActiveBookingSession = async (
  entity: BookableEntity,
  requestedBookingSessionId: string | null,
  deps: TripAssemblyDeps,
) => {
  if (requestedBookingSessionId) {
    const session = await deps.getBookingSessionFn(requestedBookingSessionId)
    if (!session) {
      throw new TripAssemblyError(
        'invalid_booking_session',
        `Booking session ${requestedBookingSessionId} is missing, expired, or inactive.`,
      )
    }

    if (session.inventoryId !== entity.inventoryId || session.vertical !== entity.vertical) {
      throw new TripAssemblyError(
        'booking_session_mismatch',
        `Booking session ${requestedBookingSessionId} does not match ${entity.vertical} inventory ${entity.inventoryId}.`,
      )
    }

    return {
      session,
      binding: 'attached' as const,
    }
  }

  const snapshotPrice = buildPriceQuoteFromBookableEntity(entity)
  const createdSession = snapshotPrice
    ? await deps.createBookingSessionFn(entity.inventoryId, {
        provider: entity.provider,
        snapshotPrice,
      })
    : null

  if (createdSession) {
    return {
      session: createdSession,
      binding: 'created' as const,
    }
  }

  const fallbackSession = await buildFallbackSessionFromInventory(entity, deps)
  if (!fallbackSession) {
    throw new TripAssemblyError(
      'inventory_unavailable',
      `${entity.vertical} inventory ${entity.inventoryId} could not be resolved into an active booking session.`,
    )
  }

  return {
    session: fallbackSession,
    binding: 'created' as const,
  }
}

export async function createTripAssembly(
  input: {
    name?: string
    status?: TripDetails['status']
    bookingSessionId?: string | null
    notes?: string | null
    metadata?: Record<string, unknown>
    startDate?: string | null
    endDate?: string | null
  } = {},
  options: {
    deps?: Partial<TripAssemblyDeps>
  } = {},
): Promise<TripDetails> {
  const deps = {
    ...defaultDeps(),
    ...(options.deps || {}),
  } satisfies TripAssemblyDeps
  const requestedBookingSessionId = normalizeBookingSessionId(input.bookingSessionId)

  if (requestedBookingSessionId) {
    const session = await deps.getBookingSessionFn(requestedBookingSessionId)
    if (!session) {
      throw new TripAssemblyError(
        'invalid_booking_session',
        `Booking session ${requestedBookingSessionId} is missing, expired, or inactive.`,
      )
    }
  }

  return deps.createTripFn({
    ...input,
    bookingSessionId: requestedBookingSessionId,
  })
}

export async function addBookableEntityToTrip(
  input: {
    tripId: number
    entity: BookableEntity
    bookingSessionId?: string | null
  },
  options: {
    deps?: Partial<TripAssemblyDeps>
  } = {},
): Promise<TripDetails> {
  const deps = {
    ...defaultDeps(),
    ...(options.deps || {}),
  } satisfies TripAssemblyDeps
  const currentTrip = await deps.getTripDetailsFn(input.tripId)
  if (!currentTrip) {
    throw new TripAssemblyError('trip_not_found', `Trip ${input.tripId} was not found.`)
  }

  const requestedBookingSessionId = normalizeBookingSessionId(input.bookingSessionId)
  const currentTripBookingSessionId = normalizeBookingSessionId(currentTrip.bookingSessionId)
  const matchingTripSession = currentTripBookingSessionId
    ? await deps.getBookingSessionFn(currentTripBookingSessionId)
    : null
  const reusableTripSession =
    matchingTripSession &&
    matchingTripSession.inventoryId === input.entity.inventoryId &&
    matchingTripSession.vertical === input.entity.vertical
      ? matchingTripSession
      : null

  const { session, binding } = requestedBookingSessionId
    ? await resolveActiveBookingSession(input.entity, requestedBookingSessionId, deps)
    : reusableTripSession
      ? {
          session: reusableTripSession,
          binding: 'attached' as const,
        }
      : await resolveActiveBookingSession(input.entity, null, deps)

  const candidate = buildTripItemCandidateFromBookableEntity(session.entity, {
    priceQuote: session.price,
    bookingSessionId: session.sessionId,
    bookingSessionBinding: binding,
    bookingSessionSource: session.source,
  })

  await deps.addItemToTripFn(input.tripId, candidate, {
    bookableEntity: session.entity,
  })
  return deps.setTripBookingSessionFn(input.tripId, session.sessionId)
}

export async function removeItemFromTripAssembly(
  input: {
    tripId: number
    itemId: number
  },
  options: {
    deps?: Partial<TripAssemblyDeps>
  } = {},
): Promise<TripDetails> {
  const deps = {
    ...defaultDeps(),
    ...(options.deps || {}),
  } satisfies TripAssemblyDeps
  const currentTrip = await deps.getTripDetailsFn(input.tripId)
  if (!currentTrip) {
    throw new TripAssemblyError('trip_not_found', `Trip ${input.tripId} was not found.`)
  }

  const currentItem = currentTrip.items.find((item) => item.id === input.itemId)
  if (!currentItem) {
    throw new TripAssemblyError(
      'trip_item_not_found',
      `Trip item ${input.itemId} was not found on trip ${input.tripId}.`,
    )
  }

  const removedItemBookingSessionId = readTripItemBookingSessionId(currentItem.metadata)
  const nextTrip = await deps.removeItemFromTripFn(input.tripId, input.itemId)
  const activeBookingSessionId = normalizeBookingSessionId(currentTrip.bookingSessionId)
  if (!activeBookingSessionId) return nextTrip

  if (!nextTrip.items.length) {
    return deps.setTripBookingSessionFn(input.tripId, null)
  }

  if (removedItemBookingSessionId !== activeBookingSessionId) {
    return nextTrip
  }

  const hasRemainingScopedItems = nextTrip.items.some(
    (item) => readTripItemBookingSessionId(item.metadata) === activeBookingSessionId,
  )
  if (hasRemainingScopedItems) {
    return nextTrip
  }

  return deps.setTripBookingSessionFn(input.tripId, null)
}
