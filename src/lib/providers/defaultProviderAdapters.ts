import { parseInventoryId, type ParsedInventoryId } from '~/lib/inventory/inventory-id'
import { resolveCarInventory } from '~/lib/inventory/resolvers/resolveCarInventory'
import type {
  ProviderAdapter,
  ProviderResolveInventoryRecordInput,
} from '~/lib/providers/providerAdapter'
import {
  flightProviderAdapter,
} from '~/lib/providers/flight/flightProviderAdapter'
import { FLIGHT_PROVIDER_REGISTRY_ALIAS } from '~/lib/providers/flight/constants'
import {
  hotelProviderAdapter,
} from '~/lib/providers/hotel/hotelProviderAdapter'
import { HOTEL_PROVIDER_REGISTRY_ALIAS } from '~/lib/providers/hotel/constants'
import { loadCarRentalResultsPageFromDb } from '~/lib/queries/car-rentals-search.server'
import { isSearchEntity } from '~/lib/search/search-entity'
import type { BookableEntity } from '~/types/bookable-entity'
import type {
  InventoryProviderResolverInput,
  ResolvedInventoryRecord,
} from '~/types/inventory'
import type { PriceQuote } from '~/types/pricing'
import type { SearchEntity, SearchVertical } from '~/types/search-entity'
import type { SearchParams } from '~/types/search'

type SearchResponseWithEntities = {
  results: Array<{
    searchEntity?: SearchEntity | null
  }>
}

type DefaultProviderConfig<
  TVertical extends SearchVertical,
  TParsedInventory extends ParsedInventoryId,
  TSearchResponse extends SearchResponseWithEntities,
> = {
  provider: TVertical
  search: (params: SearchParams) => Promise<TSearchResponse>
  resolveRecord: (
    input: InventoryProviderResolverInput<TParsedInventory>,
  ) => Promise<ResolvedInventoryRecord | null>
}

const normalizeCheckedAt = (value?: string | null) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const toOptionalNumber = (value: unknown) => {
  if (value == null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const sanitizePriceQuote = (quote: PriceQuote | null | undefined): PriceQuote | null => {
  if (!quote) return null

  const currency = String(quote.currency || '').trim().toUpperCase()
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

const toPriceQuote = (entity: BookableEntity | null): PriceQuote | null => {
  if (!entity) return null

  const amountCents = entity.price.amountCents
  const currency = String(entity.price.currency || '').trim().toUpperCase()
  if (amountCents == null || !currency) return null

  return sanitizePriceQuote({
    currency,
    amount: Number((amountCents / 100).toFixed(2)),
  })
}

const extractSearchEntities = (response: SearchResponseWithEntities) =>
  response.results.flatMap((result) => {
    if (result.searchEntity && isSearchEntity(result.searchEntity)) {
      return [result.searchEntity]
    }

    return []
  })

const createDefaultProviderAdapter = <
  TVertical extends SearchVertical,
  TParsedInventory extends ParsedInventoryId,
  TSearchResponse extends SearchResponseWithEntities,
>(
  config: DefaultProviderConfig<TVertical, TParsedInventory, TSearchResponse>,
): ProviderAdapter<TSearchResponse, ResolvedInventoryRecord | null, PriceQuote | null> => {
  const resolveInventoryRecord = async (
    input: ProviderResolveInventoryRecordInput,
  ): Promise<ResolvedInventoryRecord | null> => {
    const parsedInventory = parseInventoryId(input.inventoryId)
    if (!parsedInventory || parsedInventory.vertical !== config.provider) return null

    try {
      return await config.resolveRecord({
        inventoryId: input.inventoryId,
        parsedInventory: parsedInventory as TParsedInventory,
        providerInventoryId: input.providerInventoryId,
        checkedAt: normalizeCheckedAt(input.checkedAt),
      })
    } catch {
      return null
    }
  }

  return {
    provider: config.provider,
    async search(params) {
      if (params.vertical !== config.provider) return []

      try {
        const response = await config.search(params)
        return extractSearchEntities(response)
      } catch {
        return []
      }
    },
    async resolveInventory(inventoryId) {
      const record = await resolveInventoryRecord({ inventoryId })
      return record?.entity || null
    },
    async fetchPrice(inventoryId) {
      const record = await resolveInventoryRecord({ inventoryId })
      return toPriceQuote(record?.entity || null)
    },
    normalizeSearchResponse(response) {
      return extractSearchEntities(response)
    },
    normalizeInventoryResponse(response) {
      return response?.entity || null
    },
    normalizePriceResponse(response) {
      return sanitizePriceQuote(response)
    },
    resolveInventoryRecord,
  }
}

const createProviderAliasAdapter = (
  provider: string,
  adapter: ProviderAdapter,
): ProviderAdapter => ({
  provider,
  search: (params, options) => adapter.search(params, options),
  resolveInventory: (inventoryId, options) => adapter.resolveInventory(inventoryId, options),
  fetchPrice: (inventoryId, options) => adapter.fetchPrice(inventoryId, options),
  ...(adapter.normalizeSearchResponse
    ? {
        normalizeSearchResponse: (response, params) =>
          adapter.normalizeSearchResponse?.(response, params) || [],
      }
    : {}),
  ...(adapter.normalizeInventoryResponse
    ? {
        normalizeInventoryResponse: (response, inventoryId) =>
          adapter.normalizeInventoryResponse?.(response, inventoryId) || null,
      }
    : {}),
  ...(adapter.normalizePriceResponse
    ? {
        normalizePriceResponse: (response, inventoryId) =>
          adapter.normalizePriceResponse?.(response, inventoryId) || null,
      }
    : {}),
  ...(adapter.resolveInventoryRecord
    ? {
        resolveInventoryRecord: (input, options) =>
          adapter.resolveInventoryRecord?.(input, options) || Promise.resolve(null),
      }
    : {}),
})

export const flightVerticalAdapter = createProviderAliasAdapter(
  FLIGHT_PROVIDER_REGISTRY_ALIAS,
  flightProviderAdapter,
)

export const hotelVerticalAdapter = createProviderAliasAdapter(
  HOTEL_PROVIDER_REGISTRY_ALIAS,
  hotelProviderAdapter,
)

export const carProviderAdapter = createDefaultProviderAdapter({
  provider: 'car',
  async search(params) {
    const citySlug = String(params.pickupLocation || params.destination || '').trim()
    return loadCarRentalResultsPageFromDb({
      citySlug,
      query: citySlug,
      pickupDate: params.departDate || null,
      dropoffDate: params.returnDate || null,
    })
  },
  resolveRecord: resolveCarInventory,
})

export const DEFAULT_PROVIDER_ADAPTERS = [
  flightProviderAdapter,
  flightVerticalAdapter,
  hotelProviderAdapter,
  hotelVerticalAdapter,
  carProviderAdapter,
] as const
