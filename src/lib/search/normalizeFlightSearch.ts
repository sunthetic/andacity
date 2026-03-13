import { normalizeFlightSearchResult } from '~/lib/providers/flight/normalizeFlightSearchResult'
import type { FlightProviderRawOffer } from '~/lib/providers/flight/flightProviderClient'
import type { SearchParams } from '~/types/search'
import type { FlightSearchEntity } from '~/types/search-entity'
import type { NormalizeSearchResultsOptions } from './normalizeSearchResults.ts'

export const normalizeFlightSearch = (
  providerResults: readonly unknown[],
  context: SearchParams,
  options: NormalizeSearchResultsOptions = {},
): FlightSearchEntity[] =>
  providerResults.flatMap((providerResult) => {
    const entity = normalizeFlightSearchResult(providerResult as FlightProviderRawOffer, context, {
      providerName: options.providerName,
      snapshotTimestamp: options.snapshotTimestamp,
    })

    return entity ? [entity] : []
  })
