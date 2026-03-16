import {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
  parseInventoryId,
} from '../inventory/inventory-id.ts'
import {
  buildCarEntityHref,
  buildFlightEntityHref,
  buildHotelEntityHref,
  isBookableEntityPath,
} from '../entities/routing.ts'
import {
  isBookableEntity,
  toBookableEntityFromSearchEntity,
} from '../booking/bookable-entity.ts'
import type {
  BookableEntity,
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from '../../types/bookable-entity'
import type {
  CarSearchEntity,
  CarSearchEntityPayload,
  FlightSearchEntity,
  FlightSearchEntityPayload,
  HotelSearchEntity,
  HotelSearchEntityPayload,
  SearchEntity,
  SearchEntityPrice,
} from '../../types/search-entity'
import type {
  HotelPropertySummary,
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
  HotelRoomSummary,
} from '../../types/hotels/provider'

type SearchRecord = Record<string, unknown>

export type FlightSearchEntitySource = {
  id?: string
  itineraryId?: number | null
  serviceDate?: string | null
  requestedServiceDate?: string | null
  airline?: string | null
  airlineCode?: string | null
  flightNumber?: string | number | null
  origin?: string | null
  destination?: string | null
  originCode?: string | null
  destinationCode?: string | null
  stops?: number | null
  duration?: string | null
  cabinClass?: string | null
  fareCode?: string | null
  price?: number | null
  currency?: string | null
}

export type FlightSearchEntityContext = {
  departDate?: string | null
  priceAmountCents?: number | null
  snapshotTimestamp?: string | null
  imageUrl?: string | null
  href?: string | null
  durationMinutes?: number | null
}

export type HotelSearchEntitySource = {
  id?: string
  inventoryId?: number | null
  slug?: string | null
  name?: string | null
  neighborhood?: string | null
  stars?: number | null
  rating?: number | null
  reviewCount?: number | null
  priceFrom?: number | null
  currency?: string | null
  image?: string | null
}

export type HotelSearchEntityContext = {
  checkInDate?: string | null
  checkOutDate?: string | null
  occupancy?: number | string | null
  roomType?: string | null
  providerName?: string | null
  providerOfferId?: string | null
  ratePlanId?: string | null
  ratePlan?: string | null
  boardType?: string | null
  cancellationPolicy?: string | null
  policy?: HotelPolicySummary | null
  priceSummary?: HotelPriceSummary | null
  propertySummary?: HotelPropertySummary | null
  roomSummary?: HotelRoomSummary | null
  inclusions?: string[] | null
  providerMetadata?: HotelProviderMetadata | null
  priceAmountCents?: number | null
  snapshotTimestamp?: string | null
  imageUrl?: string | null
  href?: string | null
  provider?: string | null
  assumedStayDates?: boolean
  assumedOccupancy?: boolean
}

export type CarSearchEntitySource = {
  id?: string
  inventoryId?: number | null
  locationId?: number | string | null
  slug?: string | null
  name?: string | null
  pickupArea?: string | null
  vehicleName?: string | null
  category?: string | null
  transmission?: string | null
  seats?: number | null
  priceFrom?: number | null
  currency?: string | null
  image?: string | null
}

export type CarSearchEntityContext = {
  pickupDateTime?: string | null
  dropoffDateTime?: string | null
  providerLocationId?: string | number | null
  vehicleClass?: string | null
  priceAmountCents?: number | null
  snapshotTimestamp?: string | null
  imageUrl?: string | null
  href?: string | null
  assumedRentalWindow?: boolean
}

const isRecord = (value: unknown): value is SearchRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const hasStringOrNull = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

const hasNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value))

const hasIntegerOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isInteger(value))

const hasOptionalStringOrNull = (record: SearchRecord, key: string) =>
  !(key in record) || hasStringOrNull(record[key])

const hasOptionalNumberOrNull = (record: SearchRecord, key: string) =>
  !(key in record) || hasNumberOrNull(record[key])

const hasOptionalIntegerOrNull = (record: SearchRecord, key: string) =>
  !(key in record) || hasIntegerOrNull(record[key])

const toFiniteInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const toPositiveInteger = (value: unknown) => {
  const parsed = toFiniteInteger(value)
  if (parsed == null || parsed < 1) return null
  return parsed
}

const normalizeCurrencyCode = (value: unknown) => {
  const text = toNullableText(value)
  return text ? text.toUpperCase() : null
}

const extractAirportCode = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null

  const direct = /^[A-Za-z]{3}$/.exec(text)
  if (direct) return direct[0].toUpperCase()

  const embedded = /\(([A-Za-z]{3})\)/.exec(text)
  if (embedded) return embedded[1].toUpperCase()

  return null
}

const parseDurationMinutes = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null

  const match = /^\s*(\d+)\s*h(?:\s+(\d+)\s*m)?\s*$/i.exec(text)
  if (!match) return null

  const hours = Number.parseInt(match[1], 10)
  const minutes = Number.parseInt(match[2] || '0', 10)
  return hours * 60 + minutes
}

const toPriceAmountCents = (amountCents: unknown, amount: unknown) => {
  const cents = toFiniteInteger(amountCents)
  if (cents != null) return Math.max(0, cents)

  const parsedAmount = typeof amount === 'number' ? amount : Number(amount)
  if (!Number.isFinite(parsedAmount)) return null
  return Math.max(0, Math.round(parsedAmount * 100))
}

const toTruthyStrings = (parts: Array<unknown>) =>
  parts
    .map((part) => toNullableText(part))
    .filter((part): part is string => Boolean(part))

const cloneStringArray = (value: string[] | null | undefined) => {
  if (!Array.isArray(value)) return value == null ? null : undefined
  return value.map((entry) => String(entry))
}

const cloneHotelPolicy = (
  value: HotelPolicySummary | null | undefined,
): HotelPolicySummary | null => {
  if (!value) return null
  return { ...value }
}

const cloneHotelPriceSummary = (
  value: HotelPriceSummary | null | undefined,
): HotelPriceSummary | null => {
  if (!value) return null
  return { ...value }
}

const cloneHotelPropertySummary = (
  value: HotelPropertySummary | null | undefined,
): HotelPropertySummary | null => {
  if (!value) return null
  return {
    ...value,
    amenities: cloneStringArray(value.amenities) || null,
    notes: cloneStringArray(value.notes) || null,
  }
}

const cloneHotelRoomSummary = (
  value: HotelRoomSummary | null | undefined,
): HotelRoomSummary | null => {
  if (!value) return null
  return {
    ...value,
    features: cloneStringArray(value.features) || null,
    badges: cloneStringArray(value.badges) || null,
  }
}

const cloneHotelProviderMetadata = (
  value: HotelProviderMetadata | null | undefined,
): HotelProviderMetadata | null => {
  if (!value) return null
  return { ...value }
}

export const buildSearchEntityPrice = (input: {
  amountCents?: unknown
  amount?: unknown
  currency?: unknown
  displayText?: unknown
}): SearchEntityPrice => ({
  amountCents: toPriceAmountCents(input.amountCents, input.amount),
  currency: normalizeCurrencyCode(input.currency),
  displayText: toNullableText(input.displayText),
})

export const buildSearchEntityTitle = (...parts: Array<unknown>) =>
  toTruthyStrings(parts).join(' ').trim()

export const buildSearchEntitySubtitle = (
  parts: Array<unknown>,
  separator = ' · ',
) => {
  const subtitle = toTruthyStrings(parts).join(separator).trim()
  return subtitle || null
}

const resolveCanonicalHref = (href: unknown, fallback: () => string) => {
  const normalizedHref = toNullableText(href)
  if (normalizedHref && isBookableEntityPath(normalizedHref)) {
    return normalizedHref
  }

  return fallback()
}

const assertSearchEntity = <TEntity extends SearchEntity>(entity: TEntity): TEntity => {
  const vertical = entity.vertical
  if (!isSearchEntity(entity)) {
    throw new Error(`Invalid canonical search entity for ${vertical}.`)
  }

  return entity
}

const attachBookableSnapshot = <TEntity extends SearchEntity>(entity: TEntity): TEntity => ({
  ...entity,
  bookableSnapshot: toBookableEntityFromSearchEntity(entity),
})

const readBookableSnapshot = (entity: SearchEntity): BookableEntity | null => {
  const snapshot = entity.bookableSnapshot
  if (!isBookableEntity(snapshot)) return null
  if (snapshot.inventoryId !== entity.inventoryId || snapshot.vertical !== entity.vertical) {
    return null
  }

  return snapshot
}

const resolveFlightOriginCode = (source: FlightSearchEntitySource) =>
  toNullableText(source.originCode) ?? extractAirportCode(source.origin)

const resolveFlightDestinationCode = (source: FlightSearchEntitySource) =>
  toNullableText(source.destinationCode) ?? extractAirportCode(source.destination)

const resolveFlightDepartDate = (
  source: FlightSearchEntitySource,
  context: FlightSearchEntityContext,
) =>
  toNullableText(context.departDate) ??
  toNullableText(source.requestedServiceDate) ??
  toNullableText(source.serviceDate)

export const toFlightSearchEntity = (
  source: FlightSearchEntitySource,
  context: FlightSearchEntityContext = {},
): FlightSearchEntity<FlightSearchEntityPayload> => {
  const carrier = toNullableText(source.airlineCode) ?? toNullableText(source.airline)
  const flightNumber =
    toNullableText(source.flightNumber) ??
    toNullableText(source.id) ??
    (source.itineraryId != null ? String(source.itineraryId) : null)
  const departDate = resolveFlightDepartDate(source, context)
  const originCode = resolveFlightOriginCode(source)
  const destinationCode = resolveFlightDestinationCode(source)
  const inventoryId = buildFlightInventoryId({
    airlineCode: carrier || '',
    flightNumber: flightNumber || '',
    departDate: departDate || '',
    originCode: originCode || toNullableText(source.origin) || '',
    destinationCode: destinationCode || toNullableText(source.destination) || '',
  })
  const title =
    buildSearchEntityTitle(source.airline, flightNumber) ||
    buildSearchEntityTitle(source.airline) ||
    buildSearchEntityTitle(source.origin, 'to', source.destination) ||
    inventoryId
  const subtitle =
    buildSearchEntitySubtitle([
      toNullableText(source.origin) && toNullableText(source.destination)
        ? `${toNullableText(source.origin)} to ${toNullableText(source.destination)}`
        : null,
    ])

  return attachBookableSnapshot(
    assertSearchEntity({
    inventoryId,
    vertical: 'flight',
    provider: toNullableText(source.airline),
    snapshotTimestamp: toNullableText(context.snapshotTimestamp),
    price: buildSearchEntityPrice({
      amountCents: context.priceAmountCents,
      amount: source.price,
      currency: source.currency,
    }),
    title,
    subtitle,
    imageUrl: toNullableText(context.imageUrl),
    href: resolveCanonicalHref(context.href, () => buildFlightEntityHref(inventoryId)),
    payload: {
      providerInventoryId: toFiniteInteger(source.itineraryId),
      airlineCode: carrier,
      flightNumber,
      departDate,
      originCode,
      destinationCode,
      cabinClass: toNullableText(source.cabinClass),
      fareCode: toNullableText(source.fareCode),
    },
    route: {
      origin: originCode ?? toNullableText(source.origin),
      destination: destinationCode ?? toNullableText(source.destination),
      departDate,
    },
    metadata: {
      carrier: toNullableText(source.airline),
      flightNumber,
      stops: toFiniteInteger(source.stops),
      durationMinutes:
        toFiniteInteger(context.durationMinutes) ?? parseDurationMinutes(source.duration),
    },
    }),
  )
}

export const toHotelSearchEntity = (
  source: HotelSearchEntitySource,
  context: HotelSearchEntityContext,
): HotelSearchEntity<HotelSearchEntityPayload> => {
  const hotelId =
    toNullableText(source.inventoryId) ??
    toNullableText(source.slug) ??
    toNullableText(source.id) ??
    toNullableText(source.name) ??
    'unknown-hotel'
  const checkInDate = toNullableText(context.checkInDate)
  const checkOutDate = toNullableText(context.checkOutDate)
  const occupancy = toPositiveInteger(context.occupancy)
  const roomType = toNullableText(context.roomType) ?? 'standard'
  const inventoryId = buildHotelInventoryId({
    hotelId,
    checkInDate: checkInDate || '',
    checkOutDate: checkOutDate || '',
    roomType,
    occupancy: occupancy ?? '',
    provider: toNullableText(context.providerName),
    providerOfferId: toNullableText(context.providerOfferId),
    ratePlanId: toNullableText(context.ratePlanId) ?? toNullableText(context.ratePlan),
    boardType: toNullableText(context.boardType),
    cancellationPolicy: toNullableText(context.cancellationPolicy),
  })
  const title = buildSearchEntityTitle(source.name) || hotelId
  const subtitle = buildSearchEntitySubtitle([
    source.neighborhood,
    toFiniteInteger(source.stars) != null ? `${toFiniteInteger(source.stars)}★` : null,
    hasNumberOrNull(source.rating) && source.rating != null ? `${source.rating.toFixed(1)}/10` : null,
  ])

  return attachBookableSnapshot(
    assertSearchEntity({
    inventoryId,
    vertical: 'hotel',
    provider: toNullableText(context.provider),
    snapshotTimestamp: toNullableText(context.snapshotTimestamp),
    price: buildSearchEntityPrice({
      amountCents: context.priceAmountCents,
      amount: source.priceFrom,
      currency: source.currency,
    }),
    title,
    subtitle,
    imageUrl: toNullableText(context.imageUrl) ?? toNullableText(source.image),
    href: resolveCanonicalHref(context.href, () => buildHotelEntityHref(inventoryId)),
    payload: {
      providerInventoryId: toFiniteInteger(source.inventoryId),
      hotelId,
      hotelSlug: toNullableText(source.slug),
      checkInDate,
      checkOutDate,
      roomType,
      occupancy,
      providerOfferId: toNullableText(context.providerOfferId),
      ratePlanId: toNullableText(context.ratePlanId),
      ratePlan: toNullableText(context.ratePlan),
      boardType: toNullableText(context.boardType),
      cancellationPolicy: toNullableText(context.cancellationPolicy),
      policy: cloneHotelPolicy(context.policy),
      priceSummary: cloneHotelPriceSummary(context.priceSummary),
      propertySummary: cloneHotelPropertySummary(context.propertySummary),
      roomSummary: cloneHotelRoomSummary(context.roomSummary),
      inclusions: cloneStringArray(context.inclusions),
      providerMetadata: cloneHotelProviderMetadata(context.providerMetadata),
      assumedStayDates: context.assumedStayDates || undefined,
      assumedOccupancy: context.assumedOccupancy || undefined,
    },
    stay: {
      checkInDate,
      checkOutDate,
      occupancy,
    },
    metadata: {
      hotelId,
      roomType,
      stars: toFiniteInteger(source.stars),
      rating: hasNumberOrNull(source.rating) ? source.rating : null,
      reviewCount: toFiniteInteger(source.reviewCount),
      neighborhood: toNullableText(source.neighborhood),
    },
    }),
  )
}

export const toCarSearchEntity = (
  source: CarSearchEntitySource,
  context: CarSearchEntityContext,
): CarSearchEntity<CarSearchEntityPayload> => {
  const providerLocationId =
    toNullableText(context.providerLocationId) ??
    toNullableText(source.locationId) ??
    toNullableText(source.inventoryId) ??
    toNullableText(source.slug) ??
    toNullableText(source.id) ??
    toNullableText(source.name) ??
    'unknown-location'
  const pickupDateTime = toNullableText(context.pickupDateTime)
  const dropoffDateTime = toNullableText(context.dropoffDateTime)
  const vehicleClass =
    toNullableText(context.vehicleClass) ??
    toNullableText(source.category) ??
    toNullableText(source.vehicleName) ??
    'standard'
  const inventoryId = buildCarInventoryId({
    providerLocationId,
    pickupDateTime: pickupDateTime || '',
    dropoffDateTime: dropoffDateTime || '',
    vehicleClass,
  })
  const title = buildSearchEntityTitle(source.name) || vehicleClass || inventoryId
  const subtitle = buildSearchEntitySubtitle([
    source.vehicleName || source.category,
    source.pickupArea,
    source.transmission,
  ])

  return attachBookableSnapshot(
    assertSearchEntity({
    inventoryId,
    vertical: 'car',
    provider: toNullableText(source.name),
    snapshotTimestamp: toNullableText(context.snapshotTimestamp),
    price: buildSearchEntityPrice({
      amountCents: context.priceAmountCents,
      amount: source.priceFrom,
      currency: source.currency,
    }),
    title,
    subtitle,
    imageUrl: toNullableText(context.imageUrl) ?? toNullableText(source.image),
    href: resolveCanonicalHref(context.href, () => buildCarEntityHref(inventoryId)),
    payload: {
      providerInventoryId: toFiniteInteger(source.inventoryId),
      providerLocationId,
      pickupDateTime,
      dropoffDateTime,
      vehicleClass,
      assumedRentalWindow: context.assumedRentalWindow || undefined,
    },
    rental: {
      pickupDateTime,
      dropoffDateTime,
    },
    metadata: {
      providerLocationId,
      vehicleClass,
      transmission: toNullableText(source.transmission),
      seats: toPositiveInteger(source.seats),
      pickupArea: toNullableText(source.pickupArea),
    },
    }),
  )
}

export function toBookableEntity(
  entity: FlightSearchEntity<FlightSearchEntityPayload>,
): FlightBookableEntity
export function toBookableEntity(
  entity: HotelSearchEntity<HotelSearchEntityPayload>,
): HotelBookableEntity
export function toBookableEntity(
  entity: CarSearchEntity<CarSearchEntityPayload>,
): CarBookableEntity
export function toBookableEntity<TPayload extends Record<string, unknown>>(
  entity: SearchEntity<TPayload>,
): BookableEntity
export function toBookableEntity<TPayload extends Record<string, unknown>>(
  entity: SearchEntity<TPayload>,
): BookableEntity {
  return readBookableSnapshot(entity) ?? toBookableEntityFromSearchEntity(entity)
}

export const isSearchEntity = (value: unknown): value is SearchEntity => {
  if (!isRecord(value)) return false

  const inventoryId = toNullableText(value.inventoryId)
  const vertical = toNullableText(value.vertical)
  const title = toNullableText(value.title)
  if (!inventoryId || !vertical || !title) return false

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== vertical) return false

  if (
    (vertical !== 'flight' && vertical !== 'hotel' && vertical !== 'car') ||
    !hasStringOrNull(value.provider) ||
    !hasStringOrNull(value.snapshotTimestamp) ||
    !hasStringOrNull(value.subtitle) ||
    !hasStringOrNull(value.imageUrl) ||
    !hasStringOrNull(value.href) ||
    !isRecord(value.payload)
  ) {
    return false
  }

  if (!isRecord(value.price)) return false
  const currency = normalizeCurrencyCode(value.price.currency)
  if (
    !hasIntegerOrNull(value.price.amountCents) ||
    !hasStringOrNull(value.price.currency) ||
    value.price.currency !== currency ||
    (value.price.displayText !== undefined && !hasStringOrNull(value.price.displayText))
  ) {
    return false
  }

  if ('bookableSnapshot' in value) {
    if (value.bookableSnapshot !== null && value.bookableSnapshot !== undefined) {
      if (!isBookableEntity(value.bookableSnapshot)) return false
      if (
        value.bookableSnapshot.inventoryId !== inventoryId ||
        value.bookableSnapshot.vertical !== vertical
      ) {
        return false
      }
    }
  }

  if (vertical === 'flight') {
    if (!isRecord(value.route) || !isRecord(value.metadata)) return false

    return (
      hasStringOrNull(value.route.origin) &&
      hasStringOrNull(value.route.destination) &&
      hasStringOrNull(value.route.departDate) &&
      hasOptionalStringOrNull(value.metadata, 'carrier') &&
      hasOptionalStringOrNull(value.metadata, 'flightNumber') &&
      hasOptionalIntegerOrNull(value.metadata, 'stops') &&
      hasOptionalIntegerOrNull(value.metadata, 'durationMinutes')
    )
  }

  if (vertical === 'hotel') {
    if (!isRecord(value.stay) || !isRecord(value.metadata)) return false

    return (
      hasStringOrNull(value.stay.checkInDate) &&
      hasStringOrNull(value.stay.checkOutDate) &&
      hasIntegerOrNull(value.stay.occupancy) &&
      hasOptionalStringOrNull(value.metadata, 'hotelId') &&
      hasOptionalStringOrNull(value.metadata, 'roomType') &&
      hasOptionalIntegerOrNull(value.metadata, 'stars') &&
      hasOptionalNumberOrNull(value.metadata, 'rating') &&
      hasOptionalIntegerOrNull(value.metadata, 'reviewCount') &&
      hasOptionalStringOrNull(value.metadata, 'neighborhood')
    )
  }

  if (!isRecord(value.rental) || !isRecord(value.metadata)) return false

  return (
    hasStringOrNull(value.rental.pickupDateTime) &&
    hasStringOrNull(value.rental.dropoffDateTime) &&
    hasOptionalStringOrNull(value.metadata, 'providerLocationId') &&
    hasOptionalStringOrNull(value.metadata, 'vehicleClass') &&
    hasOptionalStringOrNull(value.metadata, 'transmission') &&
    hasOptionalIntegerOrNull(value.metadata, 'seats') &&
    hasOptionalStringOrNull(value.metadata, 'pickupArea')
  )
}
