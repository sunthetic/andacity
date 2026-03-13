import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type {
  BookableEntity,
  BookableEntityPrice,
  BookableEntitySource,
  BookablePriceSource,
  BookableVertical,
  CarBookableEntity,
  CarBookableEntityPayload,
  FlightBookableEntity,
  FlightBookableEntityPayload,
  HotelBookableEntity,
  HotelBookableEntityPayload,
} from '~/types/bookable-entity'
import type { SavedItem, SavedVertical } from '~/types/save-compare/saved-item'
import type {
  CarSearchEntity,
  FlightSearchEntity,
  HotelSearchEntity,
  SearchEntity,
} from '~/types/search-entity'
import type {
  FlightPolicySummary,
  FlightProviderMetadata,
  FlightSegmentSummary,
} from '~/types/flights/provider'
import type {
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
} from '~/types/hotels/provider'
import type {
  CarPolicySummary,
  CarPriceSummary,
  CarProviderMetadata,
} from '~/types/car-rentals/provider'
import type { TripItem, TripItemCandidate } from '~/types/trips/trip'

export class BookableEntityValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookableEntityValidationError'
  }
}

const SAVED_TO_BOOKABLE_VERTICAL: Record<SavedVertical, BookableVertical> = {
  hotels: 'hotel',
  cars: 'car',
  flights: 'flight',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toNonNegativeInteger = (value: unknown) => {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Math.round(parsed))
}

const toPositiveInteger = (value: unknown) => {
  const parsed = toNonNegativeInteger(value)
  return parsed == null || parsed < 1 ? null : parsed
}

const toNullableBoolean = (value: unknown) => {
  if (value === true || value === false) return value
  return null
}

const normalizeCurrencyCode = (value: unknown) => {
  const text = toNullableText(value)?.toUpperCase() || null
  return text && /^[A-Z]{3}$/.test(text) ? text : null
}

const normalizeTimestamp = (value: unknown) => {
  const text = toNullableText(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toISOString()
}

const cloneFlightSegments = (
  segments: FlightSegmentSummary[] | null | undefined,
): FlightSegmentSummary[] | null | undefined => {
  if (!Array.isArray(segments)) {
    return segments == null ? segments : undefined
  }

  return segments.map((segment) => ({ ...segment }))
}

const cloneFlightPolicy = (
  policy: FlightPolicySummary | null | undefined,
): FlightPolicySummary | null | undefined => {
  if (!policy) return policy
  return { ...policy }
}

const cloneFlightProviderMetadata = (
  metadata: FlightProviderMetadata | null | undefined,
): FlightProviderMetadata | null | undefined => {
  if (!metadata) return metadata
  return { ...metadata }
}

const cloneStringArray = (value: string[] | null | undefined): string[] | null | undefined => {
  if (!Array.isArray(value)) {
    return value == null ? value : undefined
  }

  return value.map((entry) => String(entry))
}

const cloneHotelPolicy = (
  policy: HotelPolicySummary | null | undefined,
): HotelPolicySummary | null | undefined => {
  if (!policy) return policy
  return { ...policy }
}

const cloneHotelPriceSummary = (
  summary: HotelPriceSummary | null | undefined,
): HotelPriceSummary | null | undefined => {
  if (!summary) return summary
  return { ...summary }
}

const cloneHotelProviderMetadata = (
  metadata: HotelProviderMetadata | null | undefined,
): HotelProviderMetadata | null | undefined => {
  if (!metadata) return metadata
  return { ...metadata }
}

const cloneCarPolicy = (
  policy: CarPolicySummary | null | undefined,
): CarPolicySummary | null | undefined => {
  if (!policy) return policy
  return { ...policy }
}

const cloneCarPriceSummary = (
  summary: CarPriceSummary | null | undefined,
): CarPriceSummary | null | undefined => {
  if (!summary) return summary
  return { ...summary }
}

const cloneCarProviderMetadata = (
  metadata: CarProviderMetadata | null | undefined,
): CarProviderMetadata | null | undefined => {
  if (!metadata) return metadata
  return { ...metadata }
}

const readMetadata = (value: unknown) => (isRecord(value) ? value : {})

const assertBookableInventory = (
  inventoryId: unknown,
  vertical: unknown,
) => {
  const normalizedInventoryId = toNullableText(inventoryId)
  if (!normalizedInventoryId) {
    throw new BookableEntityValidationError('Bookable entity inventoryId is required.')
  }

  const normalizedVertical = toNullableText(vertical)
  if (
    normalizedVertical !== 'flight' &&
    normalizedVertical !== 'hotel' &&
    normalizedVertical !== 'car'
  ) {
    throw new BookableEntityValidationError('Bookable entity vertical is invalid.')
  }

  const parsedInventory = parseInventoryId(normalizedInventoryId)
  if (!parsedInventory) {
    throw new BookableEntityValidationError(
      `Bookable entity inventoryId "${normalizedInventoryId}" is not canonical.`,
    )
  }

  if (parsedInventory.vertical !== normalizedVertical) {
    throw new BookableEntityValidationError(
      `Bookable entity inventoryId "${normalizedInventoryId}" does not match vertical "${normalizedVertical}".`,
    )
  }

  return parsedInventory
}

const assertBookableTitle = (value: unknown) => {
  const title = toNullableText(value)
  if (!title) {
    throw new BookableEntityValidationError('Bookable entity title is required.')
  }

  return title
}

const resolvePriceSource = (
  price: BookableEntityPrice,
  preferred: Exclude<BookablePriceSource, 'display_only'>,
) => {
  if (price.amountCents != null && price.currency) return preferred
  if (price.displayText) return 'display_only'
  return preferred
}

export const buildBookableEntityPrice = (input: {
  amountCents?: unknown
  currency?: unknown
  displayText?: unknown
}): BookableEntityPrice => ({
  amountCents: toNonNegativeInteger(input.amountCents),
  currency: normalizeCurrencyCode(input.currency),
  displayText: toNullableText(input.displayText),
})

export const buildBookableEntityPayload = <TPayload extends Record<string, unknown>>(
  payload: TPayload,
): TPayload => ({ ...payload })

const buildFlightEntity = (input: {
  inventoryId: string
  provider: string | null
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string | null
  snapshotTimestamp: string | null
  price: BookableEntityPrice
  source: BookableEntitySource
  priceSource?: BookablePriceSource
  providerInventoryId: number | null
  cabinClass: string | null
  fareCode: string | null
  departureAt?: string | null
  arrivalAt?: string | null
  itineraryType?: FlightBookableEntityPayload['itineraryType']
  policy?: FlightBookableEntityPayload['policy']
  segments?: FlightBookableEntityPayload['segments']
  providerMetadata?: FlightBookableEntityPayload['providerMetadata']
  carrier: string | null
  flightNumber: string | null
  origin: string | null
  destination: string | null
  departDate: string | null
}): FlightBookableEntity => {
  const priceSource =
    input.priceSource ||
    resolvePriceSource(input.price, input.source === 'search' ? 'live' : 'snapshot')

  return {
    inventoryId: input.inventoryId,
    vertical: 'flight',
    provider: input.provider,
    title: assertBookableTitle(input.title),
    subtitle: input.subtitle,
    imageUrl: input.imageUrl,
    href: input.href,
    snapshotTimestamp: input.snapshotTimestamp,
    price: input.price,
    bookingContext: {
      carrier: input.carrier,
      flightNumber: input.flightNumber,
      origin: input.origin,
      destination: input.destination,
      departDate: input.departDate,
    },
    payload: buildBookableEntityPayload<FlightBookableEntityPayload>({
      source: input.source,
      priceSource,
      providerInventoryId: input.providerInventoryId,
      cabinClass: input.cabinClass,
      fareCode: input.fareCode,
      departureAt: toNullableText(input.departureAt),
      arrivalAt: toNullableText(input.arrivalAt),
      itineraryType: input.itineraryType || null,
      policy: cloneFlightPolicy(input.policy) || null,
      segments: cloneFlightSegments(input.segments) || null,
      providerMetadata: cloneFlightProviderMetadata(input.providerMetadata) || null,
    }),
  }
}

const buildHotelEntity = (input: {
  inventoryId: string
  provider: string | null
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string | null
  snapshotTimestamp: string | null
  price: BookableEntityPrice
  source: BookableEntitySource
  priceSource?: BookablePriceSource
  providerInventoryId: number | null
  hotelSlug: string | null
  providerOfferId?: string | null
  ratePlanId?: string | null
  ratePlan?: string | null
  boardType?: string | null
  cancellationPolicy?: string | null
  policy?: HotelPolicySummary | null
  priceSummary?: HotelPriceSummary | null
  inclusions?: string[] | null
  providerMetadata?: HotelProviderMetadata | null
  assumedStayDates?: boolean
  assumedOccupancy?: boolean
  hotelId: string | null
  checkInDate: string | null
  checkOutDate: string | null
  roomType: string | null
  occupancy: number | null
}): HotelBookableEntity => {
  const priceSource =
    input.priceSource ||
    resolvePriceSource(input.price, input.source === 'search' ? 'live' : 'snapshot')

  return {
    inventoryId: input.inventoryId,
    vertical: 'hotel',
    provider: input.provider,
    title: assertBookableTitle(input.title),
    subtitle: input.subtitle,
    imageUrl: input.imageUrl,
    href: input.href,
    snapshotTimestamp: input.snapshotTimestamp,
    price: input.price,
    bookingContext: {
      hotelId: input.hotelId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      roomType: input.roomType,
      occupancy: input.occupancy,
    },
    payload: buildBookableEntityPayload<HotelBookableEntityPayload>({
      source: input.source,
      priceSource,
      providerInventoryId: input.providerInventoryId,
      hotelSlug: input.hotelSlug,
      providerOfferId: toNullableText(input.providerOfferId),
      ratePlanId: toNullableText(input.ratePlanId),
      ratePlan: toNullableText(input.ratePlan),
      boardType: toNullableText(input.boardType),
      cancellationPolicy: toNullableText(input.cancellationPolicy),
      policy: cloneHotelPolicy(input.policy) || null,
      priceSummary: cloneHotelPriceSummary(input.priceSummary) || null,
      inclusions: cloneStringArray(input.inclusions) || null,
      providerMetadata: cloneHotelProviderMetadata(input.providerMetadata) || null,
      assumedStayDates: input.assumedStayDates || undefined,
      assumedOccupancy: input.assumedOccupancy || undefined,
    }),
  }
}

const buildCarEntity = (input: {
  inventoryId: string
  provider: string | null
  title: string
  subtitle: string | null
  imageUrl: string | null
  href: string | null
  snapshotTimestamp: string | null
  price: BookableEntityPrice
  source: BookableEntitySource
  priceSource?: BookablePriceSource
  providerInventoryId: number | null
  pickupLocationName?: string | null
  dropoffLocationName?: string | null
  pickupLocationType?: string | null
  dropoffLocationType?: string | null
  pickupAddressLine?: string | null
  dropoffAddressLine?: string | null
  transmissionType?: string | null
  seatingCapacity?: number | null
  luggageCapacity?: string | null
  doors?: number | null
  airConditioning?: boolean | null
  fuelPolicy?: string | null
  mileagePolicy?: string | null
  ratePlanCode?: string | null
  ratePlan?: string | null
  policy?: CarPolicySummary | null
  priceSummary?: CarPriceSummary | null
  inclusions?: string[] | null
  badges?: string[] | null
  features?: string[] | null
  providerMetadata?: CarProviderMetadata | null
  assumedRentalWindow?: boolean
  providerLocationId: string | null
  pickupDateTime: string | null
  dropoffDateTime: string | null
  vehicleClass: string | null
}): CarBookableEntity => {
  const priceSource =
    input.priceSource ||
    resolvePriceSource(input.price, input.source === 'search' ? 'live' : 'snapshot')

  return {
    inventoryId: input.inventoryId,
    vertical: 'car',
    provider: input.provider,
    title: assertBookableTitle(input.title),
    subtitle: input.subtitle,
    imageUrl: input.imageUrl,
    href: input.href,
    snapshotTimestamp: input.snapshotTimestamp,
    price: input.price,
    bookingContext: {
      providerLocationId: input.providerLocationId,
      pickupDateTime: input.pickupDateTime,
      dropoffDateTime: input.dropoffDateTime,
      vehicleClass: input.vehicleClass,
    },
    payload: buildBookableEntityPayload<CarBookableEntityPayload>({
      source: input.source,
      priceSource,
      providerInventoryId: input.providerInventoryId,
      pickupLocationName: toNullableText(input.pickupLocationName),
      dropoffLocationName: toNullableText(input.dropoffLocationName),
      pickupLocationType: toNullableText(input.pickupLocationType),
      dropoffLocationType: toNullableText(input.dropoffLocationType),
      pickupAddressLine: toNullableText(input.pickupAddressLine),
      dropoffAddressLine: toNullableText(input.dropoffAddressLine),
      transmissionType: toNullableText(input.transmissionType),
      seatingCapacity: toPositiveInteger(input.seatingCapacity),
      luggageCapacity: toNullableText(input.luggageCapacity),
      doors: toPositiveInteger(input.doors),
      airConditioning: toNullableBoolean(input.airConditioning),
      fuelPolicy: toNullableText(input.fuelPolicy),
      mileagePolicy: toNullableText(input.mileagePolicy),
      ratePlanCode: toNullableText(input.ratePlanCode),
      ratePlan: toNullableText(input.ratePlan),
      policy: cloneCarPolicy(input.policy) || null,
      priceSummary: cloneCarPriceSummary(input.priceSummary) || null,
      inclusions: cloneStringArray(input.inclusions) || null,
      badges: cloneStringArray(input.badges) || null,
      features: cloneStringArray(input.features) || null,
      providerMetadata: cloneCarProviderMetadata(input.providerMetadata) || null,
      assumedRentalWindow: input.assumedRentalWindow || undefined,
    }),
  }
}

const readTripItemProviderInventoryId = (item: TripItem) => {
  if (item.itemType === 'hotel') return item.hotelId
  if (item.itemType === 'flight') return item.flightItineraryId
  return item.carInventoryId
}

const resolveTripItemPrice = (item: TripItem) => {
  const livePrice = buildBookableEntityPrice({
    amountCents:
      item.revalidation.currentPriceCents ??
      item.currentPriceCents,
    currency:
      item.revalidation.currentCurrencyCode ??
      item.currentCurrencyCode,
  })

  if (livePrice.amountCents != null && livePrice.currency) {
    return {
      price: livePrice,
      priceSource: 'live' as const,
    }
  }

  return {
    price: buildBookableEntityPrice({
      amountCents: item.snapshotPriceCents,
      currency: item.snapshotCurrencyCode,
    }),
    priceSource: 'snapshot' as const,
  }
}

const resolveTripCandidatePrice = (
  candidate: TripItemCandidate,
  displayText?: string | null,
) => {
  const snapshotPrice = buildBookableEntityPrice({
    amountCents: candidate.priceCents,
    currency: candidate.currencyCode,
    displayText,
  })

  if (snapshotPrice.amountCents != null && snapshotPrice.currency) {
    return {
      price: snapshotPrice,
      priceSource: 'snapshot' as const,
    }
  }

  return {
    price: buildBookableEntityPrice({
      displayText,
    }),
    priceSource: 'display_only' as const,
  }
}

const resolveSavedItemBase = (item: SavedItem) => ({
  provider: null,
  title: assertBookableTitle(item.title),
  subtitle: toNullableText(item.subtitle),
  imageUrl: toNullableText(item.image),
  href: toNullableText(item.href),
  snapshotTimestamp: null,
})

const toBookableEntityFromTripCandidate = (
  candidate: TripItemCandidate,
  options: {
    title?: string | null
    subtitle?: string | null
    imageUrl?: string | null
    href?: string | null
    priceDisplayText?: string | null
    provider?: string | null
    snapshotTimestamp?: string | null
    source?: BookableEntitySource
  } = {},
): BookableEntity => {
  const parsedInventory = assertBookableInventory(candidate.inventoryId, candidate.itemType)
  const metadata = readMetadata(candidate.metadata)
  const resolvedPrice = resolveTripCandidatePrice(candidate, options.priceDisplayText)
  const source = options.source || 'saved_item'

  if (parsedInventory.vertical === 'flight') {
    return assertBookableEntity(
      buildFlightEntity({
        inventoryId: candidate.inventoryId,
        provider: toNullableText(options.provider) ?? toNullableText(metadata.carrier),
        title: options.title || candidate.title || candidate.inventoryId,
        subtitle: toNullableText(options.subtitle) ?? toNullableText(candidate.subtitle),
        imageUrl: toNullableText(options.imageUrl) ?? toNullableText(candidate.imageUrl),
        href: toNullableText(options.href),
        snapshotTimestamp: normalizeTimestamp(options.snapshotTimestamp),
        price: resolvedPrice.price,
        source,
        priceSource: resolvedPrice.priceSource,
        providerInventoryId:
          toPositiveInteger(candidate.providerInventoryId) ??
          toPositiveInteger(metadata.providerInventoryId),
        cabinClass: toNullableText(metadata.cabinClass),
        fareCode: toNullableText(metadata.fareCode),
        carrier: parsedInventory.airlineCode,
        flightNumber: parsedInventory.flightNumber,
        origin: parsedInventory.originCode,
        destination: parsedInventory.destinationCode,
        departDate: parsedInventory.departDate,
      }),
    )
  }

  if (parsedInventory.vertical === 'hotel') {
    return assertBookableEntity(
      buildHotelEntity({
        inventoryId: candidate.inventoryId,
        provider: toNullableText(options.provider) ?? toNullableText(metadata.provider),
        title: options.title || candidate.title || candidate.inventoryId,
        subtitle: toNullableText(options.subtitle) ?? toNullableText(candidate.subtitle),
        imageUrl: toNullableText(options.imageUrl) ?? toNullableText(candidate.imageUrl),
        href: toNullableText(options.href),
        snapshotTimestamp: normalizeTimestamp(options.snapshotTimestamp),
        price: resolvedPrice.price,
        source,
        priceSource: resolvedPrice.priceSource,
        providerInventoryId:
          toPositiveInteger(candidate.providerInventoryId) ??
          toPositiveInteger(metadata.providerInventoryId),
        hotelSlug: toNullableText(metadata.hotelSlug),
        assumedStayDates: toNullableBoolean(metadata.assumedStayDates) || undefined,
        assumedOccupancy: toNullableBoolean(metadata.assumedOccupancy) || undefined,
        hotelId: parsedInventory.hotelId,
        checkInDate: parsedInventory.checkInDate,
        checkOutDate: parsedInventory.checkOutDate,
        roomType: parsedInventory.roomType,
        occupancy: parsedInventory.occupancy,
      }),
    )
  }

  return assertBookableEntity(
    buildCarEntity({
      inventoryId: candidate.inventoryId,
      provider: toNullableText(options.provider) ?? toNullableText(metadata.provider),
      title: options.title || candidate.title || candidate.inventoryId,
      subtitle: toNullableText(options.subtitle) ?? toNullableText(candidate.subtitle),
      imageUrl: toNullableText(options.imageUrl) ?? toNullableText(candidate.imageUrl),
      href: toNullableText(options.href),
      snapshotTimestamp: normalizeTimestamp(options.snapshotTimestamp),
      price: resolvedPrice.price,
      source,
      priceSource: resolvedPrice.priceSource,
      providerInventoryId:
        toPositiveInteger(candidate.providerInventoryId) ??
        toPositiveInteger(metadata.providerInventoryId),
      assumedRentalWindow: toNullableBoolean(metadata.assumedRentalWindow) || undefined,
      providerLocationId: parsedInventory.providerLocationId,
      pickupDateTime: parsedInventory.pickupDateTime,
      dropoffDateTime: parsedInventory.dropoffDateTime,
      vehicleClass: parsedInventory.vehicleClass,
    }),
  )
}

export const toBookableEntityFromSearchEntity = (entity: SearchEntity): BookableEntity => {
  const parsedInventory = assertBookableInventory(entity.inventoryId, entity.vertical)

  if (parsedInventory.vertical === 'flight') {
    const flight = entity as FlightSearchEntity
    return assertBookableEntity(
      buildFlightEntity({
        inventoryId: flight.inventoryId,
        provider: toNullableText(flight.provider),
        title: flight.title,
        subtitle: toNullableText(flight.subtitle),
        imageUrl: toNullableText(flight.imageUrl),
        href: toNullableText(flight.href),
        snapshotTimestamp: normalizeTimestamp(flight.snapshotTimestamp),
        price: buildBookableEntityPrice(flight.price),
        source: 'search',
        priceSource: 'live',
        providerInventoryId: toPositiveInteger(flight.payload.providerInventoryId),
        cabinClass: toNullableText(flight.payload.cabinClass),
        fareCode: toNullableText(flight.payload.fareCode),
        departureAt: toNullableText(flight.payload.departureAt),
        arrivalAt: toNullableText(flight.payload.arrivalAt),
        itineraryType: flight.payload.itineraryType || null,
        policy: cloneFlightPolicy(flight.payload.policy) || null,
        segments: cloneFlightSegments(flight.payload.segments) || null,
        providerMetadata: cloneFlightProviderMetadata(flight.payload.providerMetadata) || null,
        carrier:
          toNullableText(flight.payload.airlineCode) ??
          toNullableText(flight.metadata.carrier) ??
          parsedInventory.airlineCode,
        flightNumber:
          toNullableText(flight.payload.flightNumber) ??
          toNullableText(flight.metadata.flightNumber) ??
          parsedInventory.flightNumber,
        origin:
          toNullableText(flight.route.origin) ??
          toNullableText(flight.payload.originCode) ??
          parsedInventory.originCode,
        destination:
          toNullableText(flight.route.destination) ??
          toNullableText(flight.payload.destinationCode) ??
          parsedInventory.destinationCode,
        departDate:
          toNullableText(flight.route.departDate) ??
          toNullableText(flight.payload.departDate) ??
          parsedInventory.departDate,
      }),
    )
  }

  if (parsedInventory.vertical === 'hotel') {
    const hotel = entity as HotelSearchEntity
    return assertBookableEntity(
      buildHotelEntity({
        inventoryId: hotel.inventoryId,
        provider: toNullableText(hotel.provider),
        title: hotel.title,
        subtitle: toNullableText(hotel.subtitle),
        imageUrl: toNullableText(hotel.imageUrl),
        href: toNullableText(hotel.href),
        snapshotTimestamp: normalizeTimestamp(hotel.snapshotTimestamp),
        price: buildBookableEntityPrice(hotel.price),
        source: 'search',
        priceSource: 'live',
        providerInventoryId: toPositiveInteger(hotel.payload.providerInventoryId),
        hotelSlug: toNullableText(hotel.payload.hotelSlug),
        providerOfferId: toNullableText(hotel.payload.providerOfferId),
        ratePlanId: toNullableText(hotel.payload.ratePlanId),
        ratePlan: toNullableText(hotel.payload.ratePlan),
        boardType: toNullableText(hotel.payload.boardType),
        cancellationPolicy: toNullableText(hotel.payload.cancellationPolicy),
        policy: cloneHotelPolicy(hotel.payload.policy) || null,
        priceSummary: cloneHotelPriceSummary(hotel.payload.priceSummary) || null,
        inclusions: cloneStringArray(hotel.payload.inclusions) || null,
        providerMetadata:
          cloneHotelProviderMetadata(hotel.payload.providerMetadata) || null,
        assumedStayDates: hotel.payload.assumedStayDates || undefined,
        assumedOccupancy: hotel.payload.assumedOccupancy || undefined,
        hotelId:
          toNullableText(hotel.payload.hotelId) ??
          toNullableText(hotel.metadata.hotelId) ??
          parsedInventory.hotelId,
        checkInDate:
          toNullableText(hotel.stay.checkInDate) ??
          toNullableText(hotel.payload.checkInDate) ??
          parsedInventory.checkInDate,
        checkOutDate:
          toNullableText(hotel.stay.checkOutDate) ??
          toNullableText(hotel.payload.checkOutDate) ??
          parsedInventory.checkOutDate,
        roomType:
          toNullableText(hotel.payload.roomType) ??
          toNullableText(hotel.metadata.roomType) ??
          parsedInventory.roomType,
        occupancy:
          toPositiveInteger(hotel.stay.occupancy) ??
          toPositiveInteger(hotel.payload.occupancy) ??
          parsedInventory.occupancy,
      }),
    )
  }

  const car = entity as CarSearchEntity
  return assertBookableEntity(
    buildCarEntity({
      inventoryId: car.inventoryId,
      provider: toNullableText(car.provider),
      title: car.title,
      subtitle: toNullableText(car.subtitle),
      imageUrl: toNullableText(car.imageUrl),
      href: toNullableText(car.href),
      snapshotTimestamp: normalizeTimestamp(car.snapshotTimestamp),
      price: buildBookableEntityPrice(car.price),
      source: 'search',
      providerInventoryId: toPositiveInteger(car.payload.providerInventoryId),
      pickupLocationName:
        toNullableText(car.payload.pickupLocationName) ??
        toNullableText(car.metadata.pickupArea),
      dropoffLocationName:
        toNullableText(car.payload.dropoffLocationName) ??
        toNullableText(car.metadata.dropoffArea) ??
        toNullableText(car.metadata.pickupArea),
      pickupLocationType:
        toNullableText(car.payload.pickupLocationType) ??
        toNullableText(car.metadata.pickupLocationType),
      dropoffLocationType:
        toNullableText(car.payload.dropoffLocationType) ??
        toNullableText(car.metadata.dropoffLocationType) ??
        toNullableText(car.metadata.pickupLocationType),
      pickupAddressLine: toNullableText(car.payload.pickupAddressLine),
      dropoffAddressLine:
        toNullableText(car.payload.dropoffAddressLine) ??
        toNullableText(car.payload.pickupAddressLine),
      transmissionType:
        toNullableText(car.payload.transmissionType) ??
        toNullableText(car.metadata.transmission),
      seatingCapacity:
        toPositiveInteger(car.payload.seatingCapacity) ??
        toPositiveInteger(car.metadata.seats),
      luggageCapacity:
        toNullableText(car.payload.luggageCapacity) ??
        toNullableText(car.metadata.luggageCapacity),
      doors:
        toPositiveInteger(car.payload.doors) ??
        toPositiveInteger(car.metadata.doors),
      airConditioning: toNullableBoolean(car.payload.airConditioning),
      fuelPolicy: toNullableText(car.payload.fuelPolicy),
      mileagePolicy: toNullableText(car.payload.mileagePolicy),
      ratePlanCode: toNullableText(car.payload.ratePlanCode),
      ratePlan: toNullableText(car.payload.ratePlan),
      policy: cloneCarPolicy(car.payload.policy) || null,
      priceSummary: cloneCarPriceSummary(car.payload.priceSummary) || null,
      inclusions: cloneStringArray(car.payload.inclusions) || null,
      badges: cloneStringArray(car.payload.badges) || null,
      features: cloneStringArray(car.payload.features) || null,
      providerMetadata: cloneCarProviderMetadata(car.payload.providerMetadata) || null,
      assumedRentalWindow: car.payload.assumedRentalWindow || undefined,
      providerLocationId:
        toNullableText(car.payload.providerLocationId) ??
        toNullableText(car.metadata.providerLocationId) ??
        parsedInventory.providerLocationId,
      pickupDateTime:
        toNullableText(car.rental.pickupDateTime) ??
        toNullableText(car.payload.pickupDateTime) ??
        parsedInventory.pickupDateTime,
      dropoffDateTime:
        toNullableText(car.rental.dropoffDateTime) ??
        toNullableText(car.payload.dropoffDateTime) ??
        parsedInventory.dropoffDateTime,
      vehicleClass:
        toNullableText(car.payload.vehicleClass) ??
        toNullableText(car.metadata.vehicleClass) ??
        parsedInventory.vehicleClass,
    }),
  )
}

export const toBookableEntityFromTripItem = (item: TripItem): BookableEntity => {
  const parsedInventory = assertBookableInventory(item.inventoryId, item.itemType)
  const metadata = readMetadata(item.metadata)
  const resolvedPrice = resolveTripItemPrice(item)
  const providerInventoryId = readTripItemProviderInventoryId(item)

  if (parsedInventory.vertical === 'flight') {
    return assertBookableEntity(
      buildFlightEntity({
        inventoryId: item.inventoryId,
        provider: toNullableText(metadata.carrier) ?? toNullableText(metadata.provider),
        title: item.title,
        subtitle: toNullableText(item.subtitle),
        imageUrl: toNullableText(item.imageUrl),
        href: toNullableText(metadata.href),
        snapshotTimestamp: normalizeTimestamp(item.snapshotTimestamp),
        price: resolvedPrice.price,
        source: 'trip_item',
        priceSource: resolvedPrice.priceSource,
        providerInventoryId:
          toPositiveInteger(providerInventoryId) ??
          toPositiveInteger(metadata.providerInventoryId),
        cabinClass: toNullableText(metadata.cabinClass),
        fareCode: toNullableText(metadata.fareCode),
        carrier: parsedInventory.airlineCode,
        flightNumber: parsedInventory.flightNumber,
        origin: parsedInventory.originCode,
        destination: parsedInventory.destinationCode,
        departDate: parsedInventory.departDate,
      }),
    )
  }

  if (parsedInventory.vertical === 'hotel') {
    return assertBookableEntity(
      buildHotelEntity({
        inventoryId: item.inventoryId,
        provider: toNullableText(metadata.provider),
        title: item.title,
        subtitle: toNullableText(item.subtitle),
        imageUrl: toNullableText(item.imageUrl),
        href: toNullableText(metadata.href),
        snapshotTimestamp: normalizeTimestamp(item.snapshotTimestamp),
        price: resolvedPrice.price,
        source: 'trip_item',
        priceSource: resolvedPrice.priceSource,
        providerInventoryId:
          toPositiveInteger(providerInventoryId) ??
          toPositiveInteger(metadata.providerInventoryId),
        hotelSlug: toNullableText(metadata.hotelSlug),
        hotelId: parsedInventory.hotelId,
        checkInDate: parsedInventory.checkInDate,
        checkOutDate: parsedInventory.checkOutDate,
        roomType: parsedInventory.roomType,
        occupancy: parsedInventory.occupancy,
      }),
    )
  }

  return assertBookableEntity(
    buildCarEntity({
      inventoryId: item.inventoryId,
      provider: toNullableText(metadata.provider),
      title: item.title,
      subtitle: toNullableText(item.subtitle),
      imageUrl: toNullableText(item.imageUrl),
      href: toNullableText(metadata.href),
      snapshotTimestamp: normalizeTimestamp(item.snapshotTimestamp),
      price: resolvedPrice.price,
      source: 'trip_item',
      priceSource: resolvedPrice.priceSource,
      providerInventoryId:
        toPositiveInteger(providerInventoryId) ??
        toPositiveInteger(metadata.providerInventoryId),
      providerLocationId: parsedInventory.providerLocationId,
      pickupDateTime: parsedInventory.pickupDateTime,
      dropoffDateTime: parsedInventory.dropoffDateTime,
      vehicleClass: parsedInventory.vehicleClass,
    }),
  )
}

export const toBookableEntityFromSavedItem = (
  item: SavedItem,
): BookableEntity | null => {
  const base = resolveSavedItemBase(item)
  const tripCandidate = item.tripCandidate
  if (tripCandidate) {
    const expectedVertical = SAVED_TO_BOOKABLE_VERTICAL[item.vertical]
    if (tripCandidate.itemType !== expectedVertical) {
      return null
    }

    return toBookableEntityFromTripCandidate(tripCandidate, {
      source: 'saved_item',
      provider: base.provider,
      title: base.title,
      subtitle: base.subtitle,
      imageUrl: base.imageUrl,
      href: base.href,
      priceDisplayText: toNullableText(item.price),
    })
  }

  const savedInventoryId = toNullableText(item.id)
  const vertical = SAVED_TO_BOOKABLE_VERTICAL[item.vertical]
  if (!savedInventoryId) return null

  const parsedInventory = parseInventoryId(savedInventoryId)
  if (!parsedInventory || parsedInventory.vertical !== vertical) {
    return null
  }

  const displayPrice = buildBookableEntityPrice({
    displayText: item.price,
  })

  if (parsedInventory.vertical === 'flight') {
    return assertBookableEntity(
      buildFlightEntity({
        inventoryId: savedInventoryId,
        provider: base.provider,
        title: base.title,
        subtitle: base.subtitle,
        imageUrl: base.imageUrl,
        href: base.href,
        snapshotTimestamp: base.snapshotTimestamp,
        price: displayPrice,
        source: 'saved_item',
        priceSource: 'display_only',
        providerInventoryId: null,
        cabinClass: null,
        fareCode: null,
        carrier: parsedInventory.airlineCode,
        flightNumber: parsedInventory.flightNumber,
        origin: parsedInventory.originCode,
        destination: parsedInventory.destinationCode,
        departDate: parsedInventory.departDate,
      }),
    )
  }

  if (parsedInventory.vertical === 'hotel') {
    return assertBookableEntity(
      buildHotelEntity({
        inventoryId: savedInventoryId,
        provider: base.provider,
        title: base.title,
        subtitle: base.subtitle,
        imageUrl: base.imageUrl,
        href: base.href,
        snapshotTimestamp: base.snapshotTimestamp,
        price: displayPrice,
        source: 'saved_item',
        priceSource: 'display_only',
        providerInventoryId: null,
        hotelSlug: null,
        hotelId: parsedInventory.hotelId,
        checkInDate: parsedInventory.checkInDate,
        checkOutDate: parsedInventory.checkOutDate,
        roomType: parsedInventory.roomType,
        occupancy: parsedInventory.occupancy,
      }),
    )
  }

  return assertBookableEntity(
    buildCarEntity({
      inventoryId: savedInventoryId,
      provider: base.provider,
      title: base.title,
      subtitle: base.subtitle,
      imageUrl: base.imageUrl,
      href: base.href,
      snapshotTimestamp: base.snapshotTimestamp,
      price: displayPrice,
      source: 'saved_item',
      priceSource: 'display_only',
      providerInventoryId: null,
      providerLocationId: parsedInventory.providerLocationId,
      pickupDateTime: parsedInventory.pickupDateTime,
      dropoffDateTime: parsedInventory.dropoffDateTime,
      vehicleClass: parsedInventory.vehicleClass,
    }),
  )
}

export const isBookableEntity = (value: unknown): value is BookableEntity => {
  if (!isRecord(value)) return false

  const vertical = toNullableText(value.vertical)
  const inventoryId = toNullableText(value.inventoryId)
  const title = toNullableText(value.title)
  if (!vertical || !inventoryId || !title) return false

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== vertical) return false

  if (
    !hasNullableString(value.provider) ||
    !hasNullableString(value.subtitle) ||
    !hasNullableString(value.imageUrl) ||
    !hasNullableString(value.href) ||
    !hasNullableString(value.snapshotTimestamp) ||
    !isRecord(value.price) ||
    !isRecord(value.bookingContext) ||
    !isRecord(value.payload)
  ) {
    return false
  }

  if (
    toNonNegativeInteger(value.price.amountCents) !==
      (value.price.amountCents == null ? null : value.price.amountCents) ||
    normalizeCurrencyCode(value.price.currency) !==
      (value.price.currency == null ? null : value.price.currency) ||
    (value.price.displayText !== undefined && !hasNullableString(value.price.displayText))
  ) {
    return false
  }

  if (
    value.payload.source !== 'search' &&
    value.payload.source !== 'trip_item' &&
    value.payload.source !== 'saved_item'
  ) {
    return false
  }

  if (
    value.payload.priceSource !== 'live' &&
    value.payload.priceSource !== 'snapshot' &&
    value.payload.priceSource !== 'display_only'
  ) {
    return false
  }

  if (!hasNullablePositiveInteger(value.payload.providerInventoryId)) return false

  if (vertical === 'flight') {
    return (
      hasNullableString(value.bookingContext.carrier) &&
      hasNullableString(value.bookingContext.flightNumber) &&
      hasNullableString(value.bookingContext.origin) &&
      hasNullableString(value.bookingContext.destination) &&
      hasNullableString(value.bookingContext.departDate) &&
      hasOptionalNullableString(value.payload.cabinClass) &&
      hasOptionalNullableString(value.payload.fareCode)
    )
  }

  if (vertical === 'hotel') {
    return (
      hasNullableString(value.bookingContext.hotelId) &&
      hasNullableString(value.bookingContext.checkInDate) &&
      hasNullableString(value.bookingContext.checkOutDate) &&
      hasNullableString(value.bookingContext.roomType) &&
      hasNullablePositiveInteger(value.bookingContext.occupancy) &&
      hasOptionalNullableString(value.payload.hotelSlug) &&
      hasOptionalBoolean(value.payload.assumedStayDates) &&
      hasOptionalBoolean(value.payload.assumedOccupancy)
    )
  }

  return (
    hasNullableString(value.bookingContext.providerLocationId) &&
    hasNullableString(value.bookingContext.pickupDateTime) &&
    hasNullableString(value.bookingContext.dropoffDateTime) &&
    hasNullableString(value.bookingContext.vehicleClass) &&
    hasOptionalBoolean(value.payload.assumedRentalWindow)
  )
}

export const assertBookableEntity = <TEntity extends BookableEntity>(
  entity: TEntity,
): TEntity => {
  const parsedInventory = assertBookableInventory(entity.inventoryId, entity.vertical)
  assertBookableTitle(entity.title)

  if (!isBookableEntity(entity)) {
    throw new BookableEntityValidationError(
      `Invalid canonical bookable entity for ${parsedInventory.vertical}.`,
    )
  }

  return entity
}

const hasNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string'

const hasOptionalNullableString = (
  value: unknown,
): value is string | null | undefined => value === undefined || hasNullableString(value)

const hasNullablePositiveInteger = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isInteger(value) && value > 0)

const hasOptionalBoolean = (value: unknown): value is boolean | undefined =>
  value === undefined || value === true || value === false
