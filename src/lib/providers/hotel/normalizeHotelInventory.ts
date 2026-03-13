import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type { HotelBookableEntity } from '~/types/bookable-entity'
import type { PriceQuote } from '~/types/pricing'
import { HOTEL_PROVIDER_NAME } from './constants.ts'
import type {
  HotelProviderPriceResponse,
  HotelProviderRawOffer,
} from './hotelProviderClient.ts'
import { normalizeHotelSearchResult } from './normalizeHotelSearchResult.ts'

type NormalizeHotelInventoryOptions = {
  providerName?: string
  snapshotTimestamp?: string | null
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toOptionalNumber = (value: unknown) => {
  if (value == null || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const sanitizePriceQuote = (quote: PriceQuote | null | undefined): PriceQuote | null => {
  if (!quote) return null

  const currency = toNullableText(quote.currency)?.toUpperCase() || null
  const amount = Number(quote.amount)
  if (!currency || !Number.isFinite(amount)) return null

  return {
    currency,
    amount,
    ...(toOptionalNumber(quote.base) != null ? { base: toOptionalNumber(quote.base) } : {}),
    ...(toOptionalNumber(quote.nightly) != null
      ? { nightly: toOptionalNumber(quote.nightly) }
      : {}),
    ...(toOptionalNumber(quote.nights) != null ? { nights: toOptionalNumber(quote.nights) } : {}),
    ...(toOptionalNumber(quote.taxes) != null ? { taxes: toOptionalNumber(quote.taxes) } : {}),
    ...(toOptionalNumber(quote.fees) != null ? { fees: toOptionalNumber(quote.fees) } : {}),
  }
}

export const normalizeHotelInventory = (
  offer: HotelProviderRawOffer | null,
  inventoryId: string,
  options: NormalizeHotelInventoryOptions = {},
): HotelBookableEntity | null => {
  if (!offer) return null

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'hotel') {
    return null
  }

  const searchEntity = normalizeHotelSearchResult(
    offer,
    {
      vertical: 'hotel',
      destination: offer.citySlug,
      checkInDate: offer.checkInDate,
      checkOutDate: offer.checkOutDate,
      occupancy: offer.occupancy,
    },
    {
      providerName: options.providerName || HOTEL_PROVIDER_NAME,
      snapshotTimestamp:
        toNullableText(options.snapshotTimestamp) ??
        toNullableText(offer.freshnessTimestamp),
    },
  )

  if (!searchEntity) return null

  const entity = toBookableEntityFromSearchEntity(searchEntity)
  if (entity.vertical !== 'hotel') return null

  return {
    ...entity,
    snapshotTimestamp:
      toNullableText(options.snapshotTimestamp) ??
      toNullableText(entity.snapshotTimestamp),
    payload: {
      ...entity.payload,
      providerOfferId: searchEntity.payload.providerOfferId ?? null,
      ratePlanId: searchEntity.payload.ratePlanId ?? null,
      ratePlan: searchEntity.payload.ratePlan ?? null,
      boardType: searchEntity.payload.boardType ?? null,
      cancellationPolicy: searchEntity.payload.cancellationPolicy ?? null,
      policy: searchEntity.payload.policy ?? null,
      priceSummary: searchEntity.payload.priceSummary ?? null,
      inclusions: Array.isArray(searchEntity.payload.inclusions)
        ? searchEntity.payload.inclusions.map((entry) => String(entry))
        : null,
      providerMetadata: searchEntity.payload.providerMetadata ?? null,
    },
  }
}

export const normalizeHotelPriceQuote = (
  response: HotelProviderPriceResponse | HotelProviderRawOffer | null,
): PriceQuote | null => {
  if (!response) return null

  return sanitizePriceQuote({
    currency: response.currencyCode,
    amount: Number((response.totalPriceCents / 100).toFixed(2)),
    base: Number((response.totalBaseCents / 100).toFixed(2)),
    nightly: Number((response.nightlyBaseCents / 100).toFixed(2)),
    nights: response.nights,
    ...(response.taxesCents != null
      ? { taxes: Number((response.taxesCents / 100).toFixed(2)) }
      : {}),
    ...(response.mandatoryFeesCents != null
      ? { fees: Number((response.mandatoryFeesCents / 100).toFixed(2)) }
      : {}),
  })
}
