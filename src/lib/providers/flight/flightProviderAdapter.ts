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
  defaultFlightProviderClient,
  type FlightProviderClient,
  type FlightProviderPriceResponse,
  type FlightProviderRawOffer,
  type FlightProviderSearchResponse,
} from './flightProviderClient.ts'
import { FLIGHT_PROVIDER_NAME } from './constants.ts'
import { mapFlightSearchParams } from './mapFlightSearchParams.ts'
import {
  normalizeFlightInventory,
  normalizeFlightPriceQuote,
} from './normalizeFlightInventory.ts'

type CreateFlightProviderAdapterOptions = {
  client?: FlightProviderClient
  providerName?: string
}

const normalizeCheckedAt = (value?: string | null) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const isAvailable = (offer: FlightProviderRawOffer) =>
  offer.seatsRemaining == null ? true : offer.seatsRemaining > 0

const buildResolveLookup = (
  inventoryId: string,
  input?: Pick<ProviderResolveInventoryRecordInput, 'providerInventoryId'>,
) => {
  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory || parsedInventory.vertical !== 'flight') {
    return null
  }

  return {
    parsedInventory,
    providerInventoryId: input?.providerInventoryId,
  }
}

export const createFlightProviderAdapter = (
  options: CreateFlightProviderAdapterOptions = {},
): ProviderAdapter<FlightProviderSearchResponse, FlightProviderRawOffer | null, FlightProviderPriceResponse | null> => {
  const client = options.client || defaultFlightProviderClient
  const providerName = options.providerName || FLIGHT_PROVIDER_NAME

  const resolveInventoryRecord = async (
    input: ProviderResolveInventoryRecordInput,
    requestOptions?: ProviderRequestOptions,
  ): Promise<ResolvedInventoryRecord | null> => {
    const lookup = buildResolveLookup(input.inventoryId, input)
    if (!lookup) return null

    try {
      const response = await client.resolveInventory(lookup, requestOptions)
      const checkedAt = normalizeCheckedAt(input.checkedAt)
      const entity = normalizeFlightInventory(response, input.inventoryId, {
        providerName,
        snapshotTimestamp: checkedAt,
      })

      if (!response || !entity) return null

      return {
        entity,
        checkedAt,
        isAvailable: isAvailable(response),
      }
    } catch {
      return null
    }
  }

  return {
    provider: providerName,
    vertical: 'flight',

    async search(params, requestOptions) {
      if (params.vertical !== 'flight') return []

      try {
        const request = mapFlightSearchParams(params)
        const response = await client.search(request, requestOptions)
        return normalizeSearchResults('flight', response.results, params, {
          providerName,
        })
      } catch {
        return []
      }
    },

    async resolveInventory(inventoryId, requestOptions) {
      const record = await resolveInventoryRecord({ inventoryId }, requestOptions)
      return record?.entity || null
    },

    async fetchPrice(inventoryId, requestOptions) {
      const lookup = buildResolveLookup(inventoryId)
      if (!lookup) return null

      try {
        const response = await client.fetchPrice(lookup, requestOptions)
        return normalizeFlightPriceQuote(response)
      } catch {
        return null
      }
    },

    normalizeSearchResponse(response, params: SearchParams) {
      return normalizeSearchResults('flight', response.results, params, {
        providerName,
      })
    },

    normalizeInventoryResponse(response, inventoryId) {
      return normalizeFlightInventory(response, inventoryId, {
        providerName,
      })
    },

    normalizePriceResponse(response) {
      return normalizeFlightPriceQuote(response)
    },

    resolveInventoryRecord,
  }
}

export const flightProviderAdapter = createFlightProviderAdapter()
