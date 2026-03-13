import type { SearchParams } from '~/types/search'
import type { SearchEntity, SearchVertical } from '~/types/search-entity'
import { normalizeCarSearch } from './normalizeCarSearch.ts'
import { normalizeFlightSearch } from './normalizeFlightSearch.ts'
import { normalizeHotelSearch } from './normalizeHotelSearch.ts'

export type NormalizeSearchResultsOptions = {
  providerName?: string
  snapshotTimestamp?: string | null
}

const normalizeContext = (vertical: SearchVertical, context: SearchParams): SearchParams =>
  context.vertical === vertical
    ? context
    : {
        ...context,
        vertical,
      }

const dedupeNormalizedResults = <TEntity extends SearchEntity>(
  results: readonly TEntity[],
): TEntity[] => {
  const seenInventoryIds = new Set<string>()
  const dedupedResults: TEntity[] = []

  for (const result of results) {
    if (seenInventoryIds.has(result.inventoryId)) continue
    seenInventoryIds.add(result.inventoryId)
    dedupedResults.push(result)
  }

  return dedupedResults
}

export function normalizeSearchResults(
  vertical: 'flight',
  providerResults: readonly unknown[],
  context: SearchParams,
  options?: NormalizeSearchResultsOptions,
): ReturnType<typeof normalizeFlightSearch>
export function normalizeSearchResults(
  vertical: 'hotel',
  providerResults: readonly unknown[],
  context: SearchParams,
  options?: NormalizeSearchResultsOptions,
): ReturnType<typeof normalizeHotelSearch>
export function normalizeSearchResults(
  vertical: 'car',
  providerResults: readonly unknown[],
  context: SearchParams,
  options?: NormalizeSearchResultsOptions,
): ReturnType<typeof normalizeCarSearch>
export function normalizeSearchResults(
  vertical: SearchVertical,
  providerResults: readonly unknown[],
  context: SearchParams,
  options: NormalizeSearchResultsOptions = {},
): SearchEntity[] {
  const normalizedContext = normalizeContext(vertical, context)

  switch (vertical) {
    case 'flight':
      return dedupeNormalizedResults(
        normalizeFlightSearch(providerResults, normalizedContext, options),
      )

    case 'hotel':
      return dedupeNormalizedResults(
        normalizeHotelSearch(providerResults, normalizedContext, options),
      )

    case 'car':
      return dedupeNormalizedResults(
        normalizeCarSearch(providerResults, normalizedContext, options),
      )
  }
}
