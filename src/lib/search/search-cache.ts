type CacheRecord<TValue> = {
  expiresAt: number
  value: TValue
}

const DEFAULT_TTL_MS = 1000 * 60 * 5
const DEFAULT_MAX_ENTRIES = 200

const searchCache = new Map<string, CacheRecord<unknown>>()

const pruneExpiredEntries = (now: number) => {
  for (const [key, record] of searchCache.entries()) {
    if (record.expiresAt <= now) {
      searchCache.delete(key)
    }
  }
}

const pruneLeastRecentEntries = () => {
  while (searchCache.size > DEFAULT_MAX_ENTRIES) {
    const firstKey = searchCache.keys().next().value
    if (!firstKey) return
    searchCache.delete(firstKey)
  }
}

export const getCachedResults = <TValue>(searchKey: string): TValue | null => {
  const now = Date.now()
  pruneExpiredEntries(now)

  const record = searchCache.get(searchKey)
  if (!record) return null
  if (record.expiresAt <= now) {
    searchCache.delete(searchKey)
    return null
  }

  searchCache.delete(searchKey)
  searchCache.set(searchKey, record)
  return record.value as TValue
}

export const setCachedResults = <TValue>(
  searchKey: string,
  results: TValue,
  ttlMs = DEFAULT_TTL_MS,
) => {
  const expiresAt = Date.now() + Math.max(1, Math.round(ttlMs))
  searchCache.set(searchKey, {
    expiresAt,
    value: results,
  })
  pruneLeastRecentEntries()
  return results
}

export const invalidateSearchCache = (searchKey?: string) => {
  if (searchKey) {
    searchCache.delete(searchKey)
    return
  }

  searchCache.clear()
}
