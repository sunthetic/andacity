import { toHotelSearchEntity } from '~/lib/search/search-entity'
import type { SearchParams } from '~/types/search'
import type { HotelSearchEntity } from '~/types/search-entity'
import type {
  HotelPropertySummary,
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
  HotelRoomSummary,
} from '~/types/hotels/provider'
import { HOTEL_PROVIDER_NAME } from './constants.ts'
import type { HotelProviderRawOffer } from './hotelProviderClient.ts'

type NormalizeHotelSearchResultOptions = {
  providerName?: string
  snapshotTimestamp?: string | null
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const cloneStringArray = (value: string[] | null | undefined) =>
  Array.isArray(value) ? value.map((entry) => String(entry)) : null

const toFiniteInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed)
}

const buildPropertyNotes = (
  offer: Pick<HotelProviderRawOffer, "paymentBlurb" | "feesBlurb" | "noResortFees">,
) =>
  cloneStringArray(
    [
      offer.paymentBlurb,
      offer.feesBlurb,
      offer.noResortFees ? 'No resort fees' : null,
    ].filter((value): value is string => Boolean(toNullableText(value))),
  )

export const buildHotelProviderPolicy = (
  offer: Pick<
    HotelProviderRawOffer,
    'refundable' | 'freeCancellation' | 'payLater' | 'cancellationBlurb'
  >,
): HotelPolicySummary => ({
  refundable: offer.refundable,
  freeCancellation: offer.freeCancellation,
  payLater: offer.payLater,
  cancellationLabel: toNullableText(offer.cancellationBlurb),
})

export const buildHotelPriceSummary = (
  offer: Pick<
    HotelProviderRawOffer,
    'nightlyBaseCents' | 'totalBaseCents' | 'taxesCents' | 'mandatoryFeesCents' | 'totalPriceCents' | 'nights'
  >,
): HotelPriceSummary => ({
  nightlyBaseCents: offer.nightlyBaseCents,
  totalBaseCents: offer.totalBaseCents,
  taxesCents: offer.taxesCents,
  mandatoryFeesCents: offer.mandatoryFeesCents,
  totalPriceCents: offer.totalPriceCents,
  nights: offer.nights,
})

export const buildHotelPropertySummary = (
  offer: Pick<
    HotelProviderRawOffer,
    | 'brandName'
    | 'propertyType'
    | 'cityName'
    | 'neighborhood'
    | 'addressLine'
    | 'stars'
    | 'rating'
    | 'reviewCount'
    | 'checkInTime'
    | 'checkOutTime'
    | 'summary'
    | 'amenities'
    | 'paymentBlurb'
    | 'feesBlurb'
    | 'noResortFees'
  >,
): HotelPropertySummary => ({
  brandName: toNullableText(offer.brandName),
  propertyType: toNullableText(offer.propertyType),
  cityName: toNullableText(offer.cityName),
  neighborhood: toNullableText(offer.neighborhood),
  addressLine: toNullableText(offer.addressLine),
  stars: toFiniteInteger(offer.stars),
  rating: typeof offer.rating === 'number' && Number.isFinite(offer.rating) ? offer.rating : null,
  reviewCount: toFiniteInteger(offer.reviewCount),
  checkInTime: toNullableText(offer.checkInTime),
  checkOutTime: toNullableText(offer.checkOutTime),
  summary: toNullableText(offer.summary),
  amenities: cloneStringArray(offer.amenities),
  notes: buildPropertyNotes(offer),
})

export const buildHotelRoomSummary = (
  offer: Pick<
    HotelProviderRawOffer,
    'roomType' | 'beds' | 'sizeSqft' | 'roomSleeps' | 'offerFeatures' | 'offerBadges'
  >,
): HotelRoomSummary => ({
  roomName: toNullableText(offer.roomType),
  beds: toNullableText(offer.beds),
  sizeSqft: toFiniteInteger(offer.sizeSqft),
  sleeps: toFiniteInteger(offer.roomSleeps),
  features: cloneStringArray(offer.offerFeatures),
  badges: cloneStringArray(offer.offerBadges),
})

export const buildHotelProviderMetadata = (
  offer: Pick<
    HotelProviderRawOffer,
    | 'hotelId'
    | 'providerOfferId'
    | 'ratePlanId'
    | 'boardType'
    | 'cancellationPolicy'
    | 'checkInDate'
    | 'checkOutDate'
    | 'occupancy'
  >,
  providerName = HOTEL_PROVIDER_NAME,
): HotelProviderMetadata => ({
  providerName,
  providerHotelId: String(offer.hotelId),
  providerOfferId: toNullableText(offer.providerOfferId),
  ratePlanId: toNullableText(offer.ratePlanId),
  boardType: toNullableText(offer.boardType),
  cancellationPolicy: toNullableText(offer.cancellationPolicy),
  checkInDate: toNullableText(offer.checkInDate),
  checkOutDate: toNullableText(offer.checkOutDate),
  occupancy: offer.occupancy,
})

export const normalizeHotelSearchResult = (
  offer: HotelProviderRawOffer,
  params: SearchParams,
  options: NormalizeHotelSearchResultOptions = {},
): HotelSearchEntity | null => {
  try {
    const providerName = options.providerName || HOTEL_PROVIDER_NAME
    const entity = toHotelSearchEntity(
      {
        inventoryId: offer.hotelId,
        slug: offer.hotelSlug,
        name: offer.hotelName,
        neighborhood: offer.neighborhood,
        stars: offer.stars,
        rating: offer.rating,
        reviewCount: offer.reviewCount,
        priceFrom: Number((offer.totalPriceCents / 100).toFixed(2)),
        currency: offer.currencyCode,
        image: offer.imageUrl,
      },
      {
        checkInDate: offer.checkInDate,
        checkOutDate: offer.checkOutDate,
        occupancy: offer.occupancy,
        roomType: offer.roomTypeToken,
        providerName,
        providerOfferId: offer.providerOfferId,
        ratePlanId: offer.ratePlanId,
        ratePlan: offer.ratePlan,
        boardType: offer.boardType,
        cancellationPolicy: offer.cancellationPolicy,
        policy: buildHotelProviderPolicy(offer),
        priceSummary: buildHotelPriceSummary(offer),
        propertySummary: buildHotelPropertySummary(offer),
        roomSummary: buildHotelRoomSummary(offer),
        inclusions: cloneStringArray(offer.inclusions),
        providerMetadata: buildHotelProviderMetadata(offer, providerName),
        priceAmountCents: offer.totalPriceCents,
        snapshotTimestamp:
          toNullableText(options.snapshotTimestamp) ??
          toNullableText(offer.freshnessTimestamp),
        imageUrl: offer.imageUrl,
        href: `/hotels/${encodeURIComponent(offer.hotelSlug)}`,
        provider: offer.brandName || providerName,
      },
    )

    return {
      ...entity,
      metadata: {
        ...entity.metadata,
        cityName: offer.cityName,
        ratePlan: offer.ratePlan,
        boardType: offer.boardType,
        cancellationPolicy: offer.cancellationPolicy,
      },
      payload: {
        ...entity.payload,
        ratePlan: offer.ratePlan,
        boardType: offer.boardType,
        cancellationPolicy: offer.cancellationPolicy,
      },
    }
  } catch {
    void params
    return null
  }
}
