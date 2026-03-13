import { normalizeCarSearchResult } from '~/lib/providers/car/normalizeCarSearchResult'
import type { CarProviderRawOffer } from '~/lib/providers/car/carProviderClient'
import type { SearchParams } from '~/types/search'
import type { CarSearchEntity } from '~/types/search-entity'
import type { NormalizeSearchResultsOptions } from './normalizeSearchResults.ts'

export const normalizeCarSearch = (
  providerResults: readonly unknown[],
  context: SearchParams,
  options: NormalizeSearchResultsOptions = {},
): CarSearchEntity[] =>
  providerResults.flatMap((providerResult) => {
    const entity = normalizeCarSearchResult(providerResult as CarProviderRawOffer, context, {
      providerName: options.providerName,
      snapshotTimestamp: options.snapshotTimestamp,
    })

    return entity ? [entity] : []
  })
