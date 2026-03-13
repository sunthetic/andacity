import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type { CarBookableEntity } from '~/types/bookable-entity'
import type { PriceQuote } from '~/types/pricing'
import { CAR_PROVIDER_NAME } from './constants.ts'
import type {
  CarProviderPriceResponse,
  CarProviderRawOffer,
} from './carProviderClient.ts'
import { normalizeCarSearchResult } from './normalizeCarSearchResult.ts'

type NormalizeCarInventoryOptions = {
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
    ...(toOptionalNumber(quote.daily) != null ? { daily: toOptionalNumber(quote.daily) } : {}),
    ...(toOptionalNumber(quote.days) != null ? { days: toOptionalNumber(quote.days) } : {}),
    ...(toOptionalNumber(quote.taxes) != null ? { taxes: toOptionalNumber(quote.taxes) } : {}),
    ...(toOptionalNumber(quote.fees) != null ? { fees: toOptionalNumber(quote.fees) } : {}),
  }
}

export const normalizeCarInventory = (
  offer: CarProviderRawOffer | null,
  inventoryId: string,
  options: NormalizeCarInventoryOptions = {},
): CarBookableEntity | null => {
  if (!offer) return null

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'car') {
    return null
  }

  const searchEntity = normalizeCarSearchResult(
    offer,
    {
      vertical: 'car',
      pickupLocation: offer.pickupLocationName,
      dropoffLocation: offer.dropoffLocationName,
      departDate: offer.pickupDateTime.slice(0, 10),
      returnDate: offer.dropoffDateTime.slice(0, 10),
    },
    {
      providerName: options.providerName || CAR_PROVIDER_NAME,
      snapshotTimestamp:
        toNullableText(options.snapshotTimestamp) ??
        toNullableText(offer.freshnessTimestamp),
    },
  )

  if (!searchEntity) return null

  const entity = toBookableEntityFromSearchEntity(searchEntity)
  if (entity.vertical !== 'car') return null

  return {
    ...entity,
    snapshotTimestamp:
      toNullableText(options.snapshotTimestamp) ??
      toNullableText(entity.snapshotTimestamp),
    payload: {
      ...entity.payload,
      pickupLocationName: searchEntity.payload.pickupLocationName ?? null,
      dropoffLocationName: searchEntity.payload.dropoffLocationName ?? null,
      pickupLocationType: searchEntity.payload.pickupLocationType ?? null,
      dropoffLocationType: searchEntity.payload.dropoffLocationType ?? null,
      pickupAddressLine: searchEntity.payload.pickupAddressLine ?? null,
      dropoffAddressLine: searchEntity.payload.dropoffAddressLine ?? null,
      transmissionType: searchEntity.payload.transmissionType ?? null,
      seatingCapacity: searchEntity.payload.seatingCapacity ?? null,
      luggageCapacity: searchEntity.payload.luggageCapacity ?? null,
      doors: searchEntity.payload.doors ?? null,
      airConditioning: searchEntity.payload.airConditioning ?? null,
      fuelPolicy: searchEntity.payload.fuelPolicy ?? null,
      mileagePolicy: searchEntity.payload.mileagePolicy ?? null,
      ratePlanCode: searchEntity.payload.ratePlanCode ?? null,
      ratePlan: searchEntity.payload.ratePlan ?? null,
      policy: searchEntity.payload.policy ?? null,
      priceSummary: searchEntity.payload.priceSummary ?? null,
      inclusions: Array.isArray(searchEntity.payload.inclusions)
        ? searchEntity.payload.inclusions.map((entry) => String(entry))
        : null,
      badges: Array.isArray(searchEntity.payload.badges)
        ? searchEntity.payload.badges.map((entry) => String(entry))
        : null,
      features: Array.isArray(searchEntity.payload.features)
        ? searchEntity.payload.features.map((entry) => String(entry))
        : null,
      providerMetadata: searchEntity.payload.providerMetadata ?? null,
    },
  }
}

export const normalizeCarPriceQuote = (
  response: CarProviderPriceResponse | CarProviderRawOffer | null,
): PriceQuote | null => {
  if (!response) return null

  const dailyBaseCents =
    'dailyBaseCents' in response ? response.dailyBaseCents : response.priceDailyCents

  return sanitizePriceQuote({
    currency: response.currencyCode,
    amount: Number((response.totalPriceCents / 100).toFixed(2)),
    base: Number((response.totalBaseCents / 100).toFixed(2)),
    daily: Number((dailyBaseCents / 100).toFixed(2)),
    days: response.days,
    ...(response.taxesCents != null
      ? { taxes: Number((response.taxesCents / 100).toFixed(2)) }
      : {}),
    ...(response.mandatoryFeesCents != null
      ? { fees: Number((response.mandatoryFeesCents / 100).toFixed(2)) }
      : {}),
  })
}
