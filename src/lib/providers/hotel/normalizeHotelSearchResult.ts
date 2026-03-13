import { toHotelSearchEntity } from '~/lib/search/search-entity'
import type { SearchParams } from '~/types/search'
import type { HotelSearchEntity } from '~/types/search-entity'
import type {
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
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
