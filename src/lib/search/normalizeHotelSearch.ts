import { normalizeHotelSearchResult } from '~/lib/providers/hotel/normalizeHotelSearchResult'
import type { HotelProviderRawOffer } from '~/lib/providers/hotel/hotelProviderClient'
import type { SearchParams } from '~/types/search'
import type { HotelSearchEntity } from '~/types/search-entity'
import type { NormalizeSearchResultsOptions } from './normalizeSearchResults.ts'

export const normalizeHotelSearch = (
  providerResults: readonly unknown[],
  context: SearchParams,
  options: NormalizeSearchResultsOptions = {},
): HotelSearchEntity[] =>
  providerResults.flatMap((providerResult) => {
    const entity = normalizeHotelSearchResult(providerResult as HotelProviderRawOffer, context, {
      providerName: options.providerName,
      snapshotTimestamp: options.snapshotTimestamp,
    })

    return entity ? [entity] : []
  })
