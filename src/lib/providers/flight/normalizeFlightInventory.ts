import { toBookableEntityFromSearchEntity } from '~/lib/booking/bookable-entity'
import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type { FlightBookableEntity } from '~/types/bookable-entity'
import type { PriceQuote } from '~/types/pricing'
import { FLIGHT_PROVIDER_NAME } from './constants.ts'
import type {
  FlightProviderPriceResponse,
  FlightProviderRawOffer,
} from './flightProviderClient.ts'
import {
  buildFlightProviderMetadata,
  buildFlightProviderPolicy,
  normalizeFlightSearchResult,
} from './normalizeFlightSearchResult.ts'

type NormalizeFlightInventoryOptions = {
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

  const taxes = toOptionalNumber(quote.taxes)
  const fees = toOptionalNumber(quote.fees)

  return {
    currency,
    amount,
    ...(taxes != null ? { taxes } : {}),
    ...(fees != null ? { fees } : {}),
  }
}

export const normalizeFlightInventory = (
  offer: FlightProviderRawOffer | null,
  inventoryId: string,
  options: NormalizeFlightInventoryOptions = {},
): FlightBookableEntity | null => {
  if (!offer) return null

  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'flight') {
    return null
  }

  const searchEntity = normalizeFlightSearchResult(
    offer,
    {
      vertical: 'flight',
      origin: parsedInventory.originCode,
      destination: parsedInventory.destinationCode,
      departDate: offer.serviceDate,
      returnDate: offer.itineraryType === 'round-trip' ? offer.serviceDate : undefined,
    },
    {
      providerName: options.providerName || FLIGHT_PROVIDER_NAME,
      departDate: offer.serviceDate,
      snapshotTimestamp:
        toNullableText(options.snapshotTimestamp) ??
        toNullableText(offer.freshnessTimestamp),
    },
  )

  if (!searchEntity) return null

  const entity = toBookableEntityFromSearchEntity(searchEntity)
  if (entity.vertical !== 'flight') return null

  return {
    ...entity,
    snapshotTimestamp:
      toNullableText(options.snapshotTimestamp) ??
      toNullableText(entity.snapshotTimestamp),
    payload: {
      ...entity.payload,
      departureAt: searchEntity.payload.departureAt ?? null,
      arrivalAt: searchEntity.payload.arrivalAt ?? null,
      itineraryType: searchEntity.payload.itineraryType ?? null,
      policy: buildFlightProviderPolicy(offer),
      segments: Array.isArray(searchEntity.payload.segments)
        ? searchEntity.payload.segments.map((segment) => ({ ...segment }))
        : null,
      providerMetadata: buildFlightProviderMetadata(
        {
          itineraryType: offer.itineraryType,
          requestedServiceDate: offer.requestedServiceDate,
          serviceDate: offer.serviceDate,
        },
        options.providerName || FLIGHT_PROVIDER_NAME,
      ),
    },
  }
}

export const normalizeFlightPriceQuote = (
  response: FlightProviderPriceResponse | FlightProviderRawOffer | null,
): PriceQuote | null => {
  if (!response) return null

  return sanitizePriceQuote({
    currency: response.currencyCode,
    amount: Number((response.priceAmountCents / 100).toFixed(2)),
  })
}
