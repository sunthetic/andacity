import { parseInventoryId } from '~/lib/inventory/inventory-id'
import type {
  ProviderAdapter,
  ProviderRequestOptions,
  ProviderResolveInventoryRecordInput,
} from '~/lib/providers/providerAdapter'
import { normalizeSearchResults } from '~/lib/search/normalizeSearchResults'
import type { ResolvedInventoryRecord } from '~/types/inventory'
import type { SearchParams } from '~/types/search'
import {
  defaultCarProviderClient,
  type CarProviderClient,
  type CarProviderPriceResponse,
  type CarProviderRawOffer,
  type CarProviderSearchResponse,
} from './carProviderClient.ts'
import { CAR_PROVIDER_NAME } from './constants.ts'
import { mapCarSearchParams } from './mapCarSearchParams.ts'
import {
  normalizeCarInventory,
  normalizeCarPriceQuote,
} from './normalizeCarInventory.ts'

type CreateCarProviderAdapterOptions = {
  client?: CarProviderClient
  providerName?: string
}

const normalizeCheckedAt = (value?: string | null) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const buildResolveLookup = (
  inventoryId: string,
  input?: Pick<ProviderResolveInventoryRecordInput, 'providerInventoryId'>,
) => {
  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'car') {
    return null
  }

  return {
    parsedInventory,
    providerInventoryId: input?.providerInventoryId,
  }
}

export const createCarProviderAdapter = (
  options: CreateCarProviderAdapterOptions = {},
): ProviderAdapter<CarProviderSearchResponse, CarProviderRawOffer | null, CarProviderPriceResponse | null> => {
  const client = options.client || defaultCarProviderClient
  const providerName = options.providerName || CAR_PROVIDER_NAME

  const resolveInventoryRecord = async (
    input: ProviderResolveInventoryRecordInput,
    requestOptions?: ProviderRequestOptions,
  ): Promise<ResolvedInventoryRecord | null> => {
    const lookup = buildResolveLookup(input.inventoryId, input)
    if (!lookup) return null

    try {
      const response = await client.resolveInventory(lookup, requestOptions)
      const checkedAt = normalizeCheckedAt(input.checkedAt)
      const entity = normalizeCarInventory(response, input.inventoryId, {
        providerName,
        snapshotTimestamp: checkedAt,
      })

      if (!response || !entity) return null

      return {
        entity,
        checkedAt,
        isAvailable: response.isAvailable,
      }
    } catch {
      return null
    }
  }

  return {
    provider: providerName,

    async search(params, requestOptions) {
      if (params.vertical !== 'car') return []

      try {
        const request = mapCarSearchParams(params)
        const response = await client.search(request, requestOptions)
        return normalizeSearchResults('car', response.results, params, {
          providerName,
        })
      } catch {
        return []
      }
    },

    async resolveInventory(inventoryId, requestOptions) {
      const record = await resolveInventoryRecord({ inventoryId }, requestOptions)
      if (!record || record.isAvailable === false) return null
      return record.entity
    },

    async fetchPrice(inventoryId, requestOptions) {
      const lookup = buildResolveLookup(inventoryId)
      if (!lookup) return null

      try {
        const response = await client.fetchPrice(lookup, requestOptions)
        return normalizeCarPriceQuote(response)
      } catch {
        return null
      }
    },

    normalizeSearchResponse(response, params: SearchParams) {
      return normalizeSearchResults('car', response.results, params, {
        providerName,
      })
    },

    normalizeInventoryResponse(response, inventoryId) {
      return normalizeCarInventory(response, inventoryId, {
        providerName,
      })
    },

    normalizePriceResponse(response) {
      return normalizeCarPriceQuote(response)
    },

    resolveInventoryRecord,
  }
}

export const carProviderAdapter = createCarProviderAdapter()
