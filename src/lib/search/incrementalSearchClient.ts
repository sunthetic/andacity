import {
  mergeIncrementalSearchBatches,
  resolveIncrementalSearchResults,
} from '~/lib/search/incrementalSearch'
import type {
  SearchResultsApiError,
  SearchResultsIncrementalApiResponse,
  SearchResultsIncrementalBatch,
} from '~/types/search'
import type { SearchEntity } from '~/types/search-entity'

export const buildIncrementalSearchRequestUrl = (endpoint: string, cursor: number) => {
  const url = new URL(endpoint, window.location.href)
  url.searchParams.set('cursor', String(Math.max(0, Math.round(cursor || 0))))
  return `${url.pathname}${url.search}`
}

export const mergeIncrementalSearchResponse = <
  TEntity extends SearchEntity = SearchEntity,
>(
  currentResults: readonly TEntity[],
  currentBatches: readonly SearchResultsIncrementalBatch<TEntity>[],
  response: SearchResultsIncrementalApiResponse<TEntity>,
) => {
  const batches = mergeIncrementalSearchBatches(currentBatches, response.data.batches)
  const results =
    batches.length > 0
      ? resolveIncrementalSearchResults(batches)
      : response.data.results.length > 0
        ? response.data.results
        : currentResults.slice()

  return {
    batches,
    results,
  }
}

export const isIncrementalSearchApiError = (
  value: SearchResultsIncrementalApiResponse | SearchResultsApiError,
): value is SearchResultsApiError => value.ok === false
