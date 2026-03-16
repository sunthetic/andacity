import type { BookableEntity } from '~/types/bookable-entity'
import type { ResolvedInventoryRecord } from '~/types/inventory'
import type { PriceQuote } from '~/types/pricing'
import type { SearchEntity } from '~/types/search-entity'
import type { SearchVertical } from '~/types/search-entity'
import type { SearchParams } from '~/types/search'

export type ProviderRequestOptions = {
  signal?: AbortSignal
}

export type ProviderResolveInventoryRecordInput = {
  inventoryId: string
  providerInventoryId?: number | null
  checkedAt?: string | null
}

export interface ProviderAdapter<
  TRawSearchResponse = unknown,
  TRawInventoryResponse = unknown,
  TRawPriceResponse = unknown,
> {
  provider: string
  vertical?: SearchVertical
  aliasOf?: string
  search(params: SearchParams, options?: ProviderRequestOptions): Promise<SearchEntity[]>
  resolveInventory(
    inventoryId: string,
    options?: ProviderRequestOptions,
  ): Promise<BookableEntity | null>
  fetchPrice(inventoryId: string, options?: ProviderRequestOptions): Promise<PriceQuote | null>
  normalizeSearchResponse?(response: TRawSearchResponse, params: SearchParams): SearchEntity[]
  normalizeInventoryResponse?(
    response: TRawInventoryResponse,
    inventoryId: string,
  ): BookableEntity | null
  normalizePriceResponse?(response: TRawPriceResponse, inventoryId: string): PriceQuote | null
  // Optional richer resolver contract for callers that also need availability metadata.
  resolveInventoryRecord?(
    input: ProviderResolveInventoryRecordInput,
    options?: ProviderRequestOptions,
  ): Promise<ResolvedInventoryRecord | null>
}
