import type { InventoryVertical } from '~/lib/inventory/inventory-id'

export type SearchMetricEvent = {
  vertical: InventoryVertical
  searchKey: string
  searchTimeMs: number
  providerTimeMs: number
  cacheHit: boolean
  resultsCount: number
}

export const emitSearchMetrics = (event: SearchMetricEvent) => {
  console.info('[search-metrics]', {
    vertical: event.vertical,
    search_key: event.searchKey,
    search_time_ms: event.searchTimeMs,
    provider_time_ms: event.providerTimeMs,
    cache_hit: event.cacheHit,
    results_count: event.resultsCount,
  })
}
