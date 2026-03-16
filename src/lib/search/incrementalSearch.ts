import type { SearchResultsIncrementalBatch } from '~/types/search'
import type { SearchEntity } from '~/types/search-entity'

type ProviderBucket<TEntity extends SearchEntity> = {
  provider: string
  providerIndex: number
  results: TEntity[]
}

export const mergeIncrementalSearchBatches = <
  TEntity extends SearchEntity = SearchEntity,
>(
  existing: readonly SearchResultsIncrementalBatch<TEntity>[],
  incoming: readonly SearchResultsIncrementalBatch<TEntity>[],
): SearchResultsIncrementalBatch<TEntity>[] => {
  const nextByCursor = new Map<number, SearchResultsIncrementalBatch<TEntity>>()

  for (const batch of existing) {
    nextByCursor.set(batch.cursor, batch)
  }

  for (const batch of incoming) {
    nextByCursor.set(batch.cursor, batch)
  }

  return Array.from(nextByCursor.values()).sort((left, right) => left.cursor - right.cursor)
}

export const resolveIncrementalSearchResults = <
  TEntity extends SearchEntity = SearchEntity,
>(
  batches: readonly SearchResultsIncrementalBatch<TEntity>[],
): TEntity[] => {
  const buckets = new Map<string, ProviderBucket<TEntity>>()
  const seenInventoryIds = new Set<string>()

  for (const batch of batches) {
    const bucketKey = `${batch.provider}:${batch.providerIndex}`
    const bucket =
      buckets.get(bucketKey) ||
      ({
        provider: batch.provider,
        providerIndex: batch.providerIndex,
        results: [],
      } satisfies ProviderBucket<TEntity>)

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, bucket)
    }

    for (const result of batch.results) {
      if (seenInventoryIds.has(result.inventoryId)) continue
      seenInventoryIds.add(result.inventoryId)
      bucket.results.push(result)
    }
  }

  return Array.from(buckets.values())
    .sort((left, right) => left.providerIndex - right.providerIndex)
    .flatMap((bucket) => bucket.results)
}
