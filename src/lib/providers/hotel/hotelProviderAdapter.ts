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
  defaultHotelProviderClient,
  type HotelProviderClient,
  type HotelProviderPriceResponse,
  type HotelProviderRawOffer,
  type HotelProviderSearchResponse,
} from './hotelProviderClient.ts'
import {
  HOTEL_PROVIDER_NAME,
} from './constants.ts'
import { mapHotelSearchParams } from './mapHotelSearchParams.ts'
import {
  normalizeHotelInventory,
  normalizeHotelPriceQuote,
} from './normalizeHotelInventory.ts'

type CreateHotelProviderAdapterOptions = {
  client?: HotelProviderClient
  providerName?: string
}

const normalizeCheckedAt = (value?: string | null) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const buildResolveLookup = (
  inventoryId: string,
  providerName: string,
  input?: Pick<ProviderResolveInventoryRecordInput, 'providerInventoryId'>,
) => {
  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'hotel') {
    return null
  }

  if (parsedInventory.provider && parsedInventory.provider !== providerName) {
    return null
  }

  return {
    parsedInventory,
    providerInventoryId: input?.providerInventoryId,
  }
}

export const createHotelProviderAdapter = (
  options: CreateHotelProviderAdapterOptions = {},
): ProviderAdapter<HotelProviderSearchResponse, HotelProviderRawOffer | null, HotelProviderPriceResponse | null> => {
  const client = options.client || defaultHotelProviderClient
  const providerName = options.providerName || HOTEL_PROVIDER_NAME

  const resolveInventoryRecord = async (
    input: ProviderResolveInventoryRecordInput,
    requestOptions?: ProviderRequestOptions,
  ): Promise<ResolvedInventoryRecord | null> => {
    const lookup = buildResolveLookup(input.inventoryId, providerName, input)
    if (!lookup) return null

    try {
      const response = await client.resolveInventory(lookup, requestOptions)
      const checkedAt = normalizeCheckedAt(input.checkedAt)
      const entity = normalizeHotelInventory(response, input.inventoryId, {
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
    vertical: 'hotel',

    async search(params, requestOptions) {
      if (params.vertical !== 'hotel') return []

      try {
        const request = mapHotelSearchParams(params)
        const response = await client.search(request, requestOptions)
        return normalizeSearchResults('hotel', response.results, params, {
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
      const lookup = buildResolveLookup(inventoryId, providerName)
      if (!lookup) return null

      try {
        const response = await client.fetchPrice(lookup, requestOptions)
        return normalizeHotelPriceQuote(response)
      } catch {
        return null
      }
    },

    normalizeSearchResponse(response, params: SearchParams) {
      return normalizeSearchResults('hotel', response.results, params, {
        providerName,
      })
    },

    normalizeInventoryResponse(response, inventoryId) {
      return normalizeHotelInventory(response, inventoryId, {
        providerName,
      })
    },

    normalizePriceResponse(response) {
      return normalizeHotelPriceQuote(response)
    },

    resolveInventoryRecord,
  }
}

export const hotelProviderAdapter = createHotelProviderAdapter()
