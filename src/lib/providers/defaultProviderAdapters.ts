import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import {
  flightProviderAdapter,
} from '~/lib/providers/flight/flightProviderAdapter'
import { FLIGHT_PROVIDER_REGISTRY_ALIAS } from '~/lib/providers/flight/constants'
import {
  hotelProviderAdapter,
} from '~/lib/providers/hotel/hotelProviderAdapter'
import { HOTEL_PROVIDER_REGISTRY_ALIAS } from '~/lib/providers/hotel/constants'
import {
  carProviderAdapter,
} from '~/lib/providers/car/carProviderAdapter'
import { CAR_PROVIDER_REGISTRY_ALIAS } from '~/lib/providers/car/constants'

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

export const carVerticalAdapter = createProviderAliasAdapter(
  CAR_PROVIDER_REGISTRY_ALIAS,
  carProviderAdapter,
)

export const DEFAULT_PROVIDER_ADAPTERS = [
  flightProviderAdapter,
  flightVerticalAdapter,
  hotelProviderAdapter,
  hotelVerticalAdapter,
  carProviderAdapter,
  carVerticalAdapter,
] as const
