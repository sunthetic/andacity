import { and, asc, eq, inArray } from 'drizzle-orm'
import type { ParsedHotelInventoryId } from '~/lib/inventory/inventory-id'
import { normalizeInventoryToken } from '~/lib/inventory/inventory-id'
import { getDb } from '~/lib/db/client.server'
import {
  cities,
  hotelAmenityLinks,
  hotelAmenities,
  hotelAvailabilitySnapshots,
  hotelBrands,
  hotelImages,
  hotelOffers,
  hotels,
} from '~/lib/db/schema'
import type {
  ProviderRequestOptions,
  ProviderResolveInventoryRecordInput,
} from '~/lib/providers/providerAdapter'
import { searchHotels, type HotelSearchRow } from '~/lib/repos/hotels-repo.server'
import { computeNights } from '~/lib/search/hotels/dates'
import {
  DEFAULT_HOTEL_PROVIDER_MAX_OFFERS_PER_HOTEL,
  DEFAULT_HOTEL_PROVIDER_RETRIES,
  DEFAULT_HOTEL_PROVIDER_SEARCH_LIMIT,
  DEFAULT_HOTEL_PROVIDER_TIMEOUT_MS,
  HOTEL_PROVIDER_NAME,
} from './constants.ts'
import type { HotelProviderSearchRequest } from './mapHotelSearchParams.ts'

type HotelProviderHotelContextRow = {
  id: number
  slug: string
  name: string
  citySlug: string
  cityName: string
  neighborhood: string
  stars: number
  rating: string
  reviewCount: number
  propertyType: string
  currencyCode: string
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  brandName: string | null
  imageUrl: string | null
  freshnessTimestamp: Date | string | null
  checkInStart: string | null
  checkInEnd: string | null
  minNights: number | null
  maxNights: number | null
  blockedWeekdays: number[] | null
}

type HotelProviderOfferRow = {
  hotelId: number
  externalOfferId: string
  name: string
  sleeps: number
  beds: string
  sizeSqft: number
  priceNightlyCents: number
  currencyCode: string
  refundable: boolean
  payLater: boolean
  badges: string[]
  features: string[]
}

export type HotelProviderRawOffer = {
  provider: string
  hotelId: number
  hotelSlug: string
  hotelName: string
  citySlug: string
  cityName: string
  neighborhood: string
  stars: number
  rating: number
  reviewCount: number
  propertyType: string | null
  currencyCode: string
  imageUrl: string | null
  amenities: string[]
  brandName: string | null
  checkInDate: string
  checkOutDate: string
  occupancy: number
  nights: number
  roomType: string
  roomTypeToken: string
  providerOfferId: string
  ratePlanId: string
  ratePlan: string
  boardType: string
  cancellationPolicy: string
  refundable: boolean
  freeCancellation: boolean
  payLater: boolean
  inclusions: string[]
  nightlyBaseCents: number
  totalBaseCents: number
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number
  cancellationBlurb: string | null
  paymentBlurb: string | null
  feesBlurb: string | null
  freshnessTimestamp: string | null
  isAvailable: boolean | null
}

export type HotelProviderSearchResponse = {
  provider: string
  request: HotelProviderSearchRequest
  results: HotelProviderRawOffer[]
}

export type HotelProviderInventoryLookup = Pick<
  ProviderResolveInventoryRecordInput,
  'providerInventoryId'
> & {
  parsedInventory: ParsedHotelInventoryId
}

export type HotelProviderPriceResponse = {
  provider: string
  hotelId: number
  currencyCode: string
  nightlyBaseCents: number
  totalBaseCents: number
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number
  nights: number
}

export type HotelProviderClient = {
  search(
    request: HotelProviderSearchRequest,
    options?: ProviderRequestOptions,
  ): Promise<HotelProviderSearchResponse>
  resolveInventory(
    lookup: HotelProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<HotelProviderRawOffer | null>
  fetchPrice(
    lookup: HotelProviderInventoryLookup,
    options?: ProviderRequestOptions,
  ): Promise<HotelProviderPriceResponse | null>
}

export type HotelProviderClientErrorCode =
  | 'aborted'
  | 'timeout'
  | 'provider_failure'

export class HotelProviderClientError extends Error {
  code: HotelProviderClientErrorCode
  override cause?: unknown

  constructor(
    code: HotelProviderClientErrorCode,
    message: string,
    options?: {
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'HotelProviderClientError'
    this.code = code
    this.cause = options?.cause
  }
}

const toIsoTimestamp = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.round(parsed)
}

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new HotelProviderClientError('aborted', 'Hotel provider request was aborted.')
  }
}

const runWithTimeout = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let removeAbortListener: undefined | (() => void)

  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new HotelProviderClientError(
            'timeout',
            `Hotel provider ${operationName} timed out after ${DEFAULT_HOTEL_PROVIDER_TIMEOUT_MS}ms.`,
          ),
        )
      }, DEFAULT_HOTEL_PROVIDER_TIMEOUT_MS)

      if (signal) {
        const abortHandler = () => {
          reject(new HotelProviderClientError('aborted', 'Hotel provider request was aborted.'))
        }

        signal.addEventListener('abort', abortHandler, { once: true })
        removeAbortListener = () => {
          signal.removeEventListener('abort', abortHandler)
        }
      }

      operation().then(resolve, reject)
    })
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    if (typeof removeAbortListener === 'function') {
      removeAbortListener()
    }
  }
}

const runProviderOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: ProviderRequestOptions,
): Promise<T> => {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= DEFAULT_HOTEL_PROVIDER_RETRIES; attempt += 1) {
    throwIfAborted(options?.signal)

    try {
      return await runWithTimeout(operationName, operation, options?.signal)
    } catch (error) {
      lastError = error
      if (
        error instanceof HotelProviderClientError &&
        (error.code === 'aborted' || error.code === 'timeout')
      ) {
        throw error
      }
    }
  }

  throw new HotelProviderClientError(
    'provider_failure',
    `Hotel provider ${operationName} failed.`,
    {
      cause: lastError,
    },
  )
}

const normalizeStringArray = (value: string[] | null | undefined) =>
  Array.from(
    new Set(
      (value || [])
        .map((entry) => String(entry || '').trim())
        .filter(Boolean),
    ),
  )

const normalizeLowerTokenArray = (value: string[] | null | undefined) =>
  normalizeStringArray(value).map((entry) => entry.toLowerCase())

const toUtcWeekday = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date.getUTCDay()
}

const isStayAvailable = (
  hotel: Pick<
    HotelProviderHotelContextRow,
    'checkInStart' | 'checkInEnd' | 'minNights' | 'maxNights' | 'blockedWeekdays'
  >,
  checkInDate: string,
  checkOutDate: string,
) => {
  if (
    !hotel.checkInStart ||
    !hotel.checkInEnd ||
    hotel.minNights == null ||
    hotel.maxNights == null
  ) {
    return null
  }

  const nights = computeNights(checkInDate, checkOutDate)
  if (nights == null) return null

  if (checkInDate < hotel.checkInStart || checkInDate > hotel.checkInEnd) {
    return false
  }

  if (nights < hotel.minNights || nights > hotel.maxNights) {
    return false
  }

  const weekday = toUtcWeekday(checkInDate)
  if (weekday != null && (hotel.blockedWeekdays || []).includes(weekday)) {
    return false
  }

  return true
}

const buildBoardType = (offer: Pick<HotelProviderOfferRow, 'badges' | 'features'>) => {
  const combined = normalizeLowerTokenArray([...(offer.badges || []), ...(offer.features || [])]).join(
    ' ',
  )

  if (combined.includes('all inclusive')) return 'all-inclusive'
  if (combined.includes('full board')) return 'full-board'
  if (combined.includes('half board')) return 'half-board'
  if (combined.includes('breakfast')) return 'breakfast-included'
  return 'room-only'
}

const buildRatePlanId = (
  offer: Pick<HotelProviderOfferRow, 'refundable' | 'payLater' | 'badges' | 'features'>,
) => {
  const boardType = buildBoardType(offer)
  const pricingToken = offer.refundable ? 'flexible' : 'prepaid'
  const paymentToken = offer.payLater ? 'pay-later' : 'pay-now'
  return normalizeInventoryToken(
    `${pricingToken} ${paymentToken} ${boardType}`,
    'rate plan',
  )
}

const buildRatePlanLabel = (
  offer: Pick<HotelProviderOfferRow, 'refundable' | 'payLater' | 'badges' | 'features'>,
) => {
  const parts = [offer.refundable ? 'Flexible rate' : 'Prepaid rate']
  if (offer.payLater) {
    parts.push('Pay later')
  }

  const boardType = buildBoardType(offer)
  if (boardType === 'breakfast-included') {
    parts.push('Breakfast included')
  } else if (boardType === 'half-board') {
    parts.push('Half board')
  } else if (boardType === 'full-board') {
    parts.push('Full board')
  } else if (boardType === 'all-inclusive') {
    parts.push('All inclusive')
  }

  return parts.join(' · ')
}

const buildProviderOfferId = (value: string) =>
  normalizeInventoryToken(value, 'provider offer')

const buildCancellationPolicy = (
  hotel: Pick<HotelProviderHotelContextRow, 'freeCancellation'>,
  offer: Pick<HotelProviderOfferRow, 'refundable'>,
) => {
  if (offer.refundable || hotel.freeCancellation) return 'free-cancellation'
  return 'non-refundable'
}

const buildCancellationLabel = (
  hotel: Pick<HotelProviderHotelContextRow, 'cancellationBlurb'>,
  offer: Pick<HotelProviderOfferRow, 'refundable'>,
) => {
  const label = String(hotel.cancellationBlurb || '').trim()
  if (label) return label
  return offer.refundable ? 'Free cancellation' : 'Non-refundable'
}

const buildInclusions = (offer: Pick<HotelProviderOfferRow, 'badges' | 'features'>) =>
  normalizeStringArray([...(offer.badges || []), ...(offer.features || [])])

const toRawOffer = (
  hotel: HotelProviderHotelContextRow,
  amenities: string[],
  offer: HotelProviderOfferRow,
  input: {
    checkInDate: string
    checkOutDate: string
    occupancy: number
  },
): HotelProviderRawOffer | null => {
  const nights = computeNights(input.checkInDate, input.checkOutDate)
  if (nights == null) return null

  const roomTypeToken = normalizeInventoryToken(offer.name, 'room type')
  const providerOfferId = buildProviderOfferId(offer.externalOfferId)
  const ratePlanId = buildRatePlanId(offer)
  const boardType = buildBoardType(offer)
  const cancellationPolicy = buildCancellationPolicy(hotel, offer)
  const taxesCents = null
  const mandatoryFeesCents = null
  const totalBaseCents = offer.priceNightlyCents * nights
  const totalPriceCents = totalBaseCents

  return {
    provider: HOTEL_PROVIDER_NAME,
    hotelId: hotel.id,
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    citySlug: hotel.citySlug,
    cityName: hotel.cityName,
    neighborhood: hotel.neighborhood,
    stars: hotel.stars,
    rating: Number(hotel.rating),
    reviewCount: hotel.reviewCount,
    propertyType: hotel.propertyType,
    currencyCode: offer.currencyCode || hotel.currencyCode,
    imageUrl: hotel.imageUrl,
    amenities: normalizeStringArray(amenities),
    brandName: hotel.brandName,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    occupancy: input.occupancy,
    nights,
    roomType: offer.name,
    roomTypeToken,
    providerOfferId,
    ratePlanId,
    ratePlan: buildRatePlanLabel(offer),
    boardType,
    cancellationPolicy,
    refundable: offer.refundable,
    freeCancellation: hotel.freeCancellation || offer.refundable,
    payLater: offer.payLater || hotel.payLater,
    inclusions: buildInclusions(offer),
    nightlyBaseCents: offer.priceNightlyCents,
    totalBaseCents,
    taxesCents,
    mandatoryFeesCents,
    totalPriceCents,
    cancellationBlurb: buildCancellationLabel(hotel, offer),
    paymentBlurb: hotel.paymentBlurb,
    feesBlurb: hotel.feesBlurb,
    freshnessTimestamp: toIsoTimestamp(hotel.freshnessTimestamp),
    isAvailable: isStayAvailable(hotel, input.checkInDate, input.checkOutDate),
  }
}

const fetchHotelContexts = async (hotelIds: number[]) => {
  const db = getDb()
  const rows = await db
    .select({
      id: hotels.id,
      slug: hotels.slug,
      name: hotels.name,
      citySlug: cities.slug,
      cityName: cities.name,
      neighborhood: hotels.neighborhood,
      stars: hotels.stars,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      propertyType: hotels.propertyType,
      currencyCode: hotels.currencyCode,
      freeCancellation: hotels.freeCancellation,
      payLater: hotels.payLater,
      noResortFees: hotels.noResortFees,
      cancellationBlurb: hotels.cancellationBlurb,
      paymentBlurb: hotels.paymentBlurb,
      feesBlurb: hotels.feesBlurb,
      brandName: hotelBrands.name,
      imageUrl: hotelImages.url,
      freshnessTimestamp: hotelAvailabilitySnapshots.snapshotAt,
      checkInStart: hotelAvailabilitySnapshots.checkInStart,
      checkInEnd: hotelAvailabilitySnapshots.checkInEnd,
      minNights: hotelAvailabilitySnapshots.minNights,
      maxNights: hotelAvailabilitySnapshots.maxNights,
      blockedWeekdays: hotelAvailabilitySnapshots.blockedWeekdays,
    })
    .from(hotels)
    .innerJoin(cities, eq(hotels.cityId, cities.id))
    .leftJoin(hotelBrands, eq(hotels.brandId, hotelBrands.id))
    .leftJoin(
      hotelImages,
      and(eq(hotelImages.hotelId, hotels.id), eq(hotelImages.sortOrder, 0)),
    )
    .leftJoin(
      hotelAvailabilitySnapshots,
      and(
        eq(hotelAvailabilitySnapshots.hotelId, hotels.id),
        eq(hotelAvailabilitySnapshots.snapshotSource, 'seed'),
      ),
    )
    .where(inArray(hotels.id, hotelIds))

  return new Map(rows.map((row) => [row.id, row satisfies HotelProviderHotelContextRow]))
}

const fetchHotelAmenities = async (hotelIds: number[]) => {
  const db = getDb()
  const rows = await db
    .select({
      hotelId: hotelAmenityLinks.hotelId,
      label: hotelAmenities.label,
    })
    .from(hotelAmenityLinks)
    .innerJoin(hotelAmenities, eq(hotelAmenityLinks.amenityId, hotelAmenities.id))
    .where(inArray(hotelAmenityLinks.hotelId, hotelIds))
    .orderBy(asc(hotelAmenityLinks.hotelId), asc(hotelAmenities.label))

  const amenitiesByHotelId = new Map<number, string[]>()
  for (const row of rows) {
    const existing = amenitiesByHotelId.get(row.hotelId)
    if (existing) {
      existing.push(row.label)
      continue
    }

    amenitiesByHotelId.set(row.hotelId, [row.label])
  }

  return amenitiesByHotelId
}

const fetchHotelOffers = async (hotelIds: number[]) => {
  const db = getDb()
  const rows = await db
    .select({
      hotelId: hotelOffers.hotelId,
      externalOfferId: hotelOffers.externalOfferId,
      name: hotelOffers.name,
      sleeps: hotelOffers.sleeps,
      beds: hotelOffers.beds,
      sizeSqft: hotelOffers.sizeSqft,
      priceNightlyCents: hotelOffers.priceNightlyCents,
      currencyCode: hotelOffers.currencyCode,
      refundable: hotelOffers.refundable,
      payLater: hotelOffers.payLater,
      badges: hotelOffers.badges,
      features: hotelOffers.features,
    })
    .from(hotelOffers)
    .where(inArray(hotelOffers.hotelId, hotelIds))
    .orderBy(
      asc(hotelOffers.hotelId),
      asc(hotelOffers.priceNightlyCents),
      asc(hotelOffers.externalOfferId),
    )

  const offersByHotelId = new Map<number, HotelProviderOfferRow[]>()
  for (const row of rows) {
    const existing = offersByHotelId.get(row.hotelId)
    const normalizedRow = row satisfies HotelProviderOfferRow

    if (existing) {
      existing.push(normalizedRow)
      continue
    }

    offersByHotelId.set(row.hotelId, [normalizedRow])
  }

  return offersByHotelId
}

const selectOffersForSearch = (
  offers: HotelProviderOfferRow[],
  occupancy: number,
) =>
  offers
    .filter((offer) => offer.sleeps >= occupancy)
    .slice(0, DEFAULT_HOTEL_PROVIDER_MAX_OFFERS_PER_HOTEL)

const matchesLegacyOffer = (
  offer: HotelProviderRawOffer,
  parsedInventory: ParsedHotelInventoryId,
) =>
  offer.roomTypeToken === parsedInventory.roomType &&
  offer.occupancy >= parsedInventory.occupancy

const matchesProviderScopedOffer = (
  offer: HotelProviderRawOffer,
  parsedInventory: ParsedHotelInventoryId,
) =>
  offer.roomTypeToken === parsedInventory.roomType &&
  offer.providerOfferId === parsedInventory.providerOfferId &&
  offer.ratePlanId === parsedInventory.ratePlanId &&
  offer.boardType === parsedInventory.boardType &&
  offer.cancellationPolicy === parsedInventory.cancellationPolicy &&
  offer.occupancy >= parsedInventory.occupancy

const findOfferMatch = (
  offers: HotelProviderRawOffer[],
  parsedInventory: ParsedHotelInventoryId,
) => {
  if (parsedInventory.isProviderScoped) {
    return offers.find((offer) => matchesProviderScopedOffer(offer, parsedInventory)) || null
  }

  return (
    offers.find((offer) => matchesLegacyOffer(offer, parsedInventory)) ||
    offers.find((offer) => offer.roomTypeToken === parsedInventory.roomType) ||
    null
  )
}

const resolveHotelId = (lookup: HotelProviderInventoryLookup) => {
  if (lookup.providerInventoryId != null) {
    return toPositiveInteger(lookup.providerInventoryId)
  }

  return toPositiveInteger(lookup.parsedInventory.hotelId)
}

export const createHotelProviderClient = (): HotelProviderClient => {
  const client: HotelProviderClient = {
    async search(request, options) {
    return runProviderOperation(
      'search',
      async () => {
        const hotelSearch = await searchHotels({
          citySlug: request.citySlug,
          checkIn: request.checkInDate,
          checkOut: request.checkOutDate,
          stars: request.filters.starRatings,
          ratingMin: request.filters.guestRatingMin ?? undefined,
          priceRanges: request.filters.priceRanges,
          amenities: request.filters.amenities,
          sort: request.sort,
          limit: DEFAULT_HOTEL_PROVIDER_SEARCH_LIMIT,
          offset: 0,
        })

        const filteredHotels = request.filters.refundableOnly
          ? hotelSearch.rows.filter((row) => row.freeCancellation)
          : hotelSearch.rows
        if (!filteredHotels.length) {
          return {
            provider: HOTEL_PROVIDER_NAME,
            request,
            results: [],
          }
        }

        const hotelIds = filteredHotels.map((row) => row.id)
        const [hotelContexts, hotelAmenities, hotelOfferRows] = await Promise.all([
          fetchHotelContexts(hotelIds),
          fetchHotelAmenities(hotelIds),
          fetchHotelOffers(hotelIds),
        ])

        const results = filteredHotels.flatMap((row: HotelSearchRow) => {
          const hotel = hotelContexts.get(row.id)
          if (!hotel) return []

          const amenities = hotelAmenities.get(row.id) || row.amenities || []
          const offers = selectOffersForSearch(hotelOfferRows.get(row.id) || [], request.occupancy)
          if (!offers.length) return []

          return offers.flatMap((offer) => {
            const rawOffer = toRawOffer(hotel, amenities, offer, {
              checkInDate: request.checkInDate,
              checkOutDate: request.checkOutDate,
              occupancy: request.occupancy,
            })

            return rawOffer ? [rawOffer] : []
          })
        })

        return {
          provider: HOTEL_PROVIDER_NAME,
          request,
          results,
        }
      },
      options,
    )
  },

  async resolveInventory(lookup, options) {
    return runProviderOperation(
      'resolveInventory',
      async () => {
        const hotelId = resolveHotelId(lookup)
        if (!hotelId) return null

        const [hotelContexts, hotelAmenities, hotelOfferRows] = await Promise.all([
          fetchHotelContexts([hotelId]),
          fetchHotelAmenities([hotelId]),
          fetchHotelOffers([hotelId]),
        ])

        const hotel = hotelContexts.get(hotelId)
        if (!hotel) return null

        const offers = (hotelOfferRows.get(hotelId) || []).flatMap((offer) => {
          const rawOffer = toRawOffer(hotel, hotelAmenities.get(hotelId) || [], offer, {
            checkInDate: lookup.parsedInventory.checkInDate,
            checkOutDate: lookup.parsedInventory.checkOutDate,
            occupancy: lookup.parsedInventory.occupancy,
          })

          return rawOffer ? [rawOffer] : []
        })

        return findOfferMatch(offers, lookup.parsedInventory)
      },
      options,
    )
  },

  async fetchPrice(lookup, options) {
    return runProviderOperation(
      'fetchPrice',
      async () => {
        const offer = await client.resolveInventory(lookup, options)
        if (!offer || offer.isAvailable === false) return null

        return {
          provider: HOTEL_PROVIDER_NAME,
          hotelId: offer.hotelId,
          currencyCode: offer.currencyCode,
          nightlyBaseCents: offer.nightlyBaseCents,
          totalBaseCents: offer.totalBaseCents,
          taxesCents: offer.taxesCents,
          mandatoryFeesCents: offer.mandatoryFeesCents,
          totalPriceCents: offer.totalPriceCents,
          nights: offer.nights,
        }
      },
      options,
    )
  },
  }

  return client
}

export const defaultHotelProviderClient = createHotelProviderClient()
