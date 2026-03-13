import { isSearchEntity } from '~/lib/search/search-entity'
import type { SearchEntity, SearchVertical } from '~/types/search-entity'

export type SearchCacheVertical = SearchVertical
export type SearchCacheParams = Record<string, unknown>

export type SearchCacheEntry<T extends SearchEntity = SearchEntity> = {
  key: string
  vertical: SearchCacheVertical
  createdAt: string
  expiresAt: string
  params: SearchCacheParams
  results: T[]
}

type StoredSearchCacheEntry<T extends SearchEntity = SearchEntity, TValue = T[]> = SearchCacheEntry<T> & {
  value?: TValue
}

type SearchCacheSetOptions<TValue> = {
  ttlMs?: number
  value?: TValue
}

type SearchCacheResultLike<T extends SearchEntity = SearchEntity> =
  | T
  | {
      searchEntity?: T | null
    }

const DEFAULT_CACHE_TTLS_MS: Record<SearchCacheVertical, number> = {
  flight: 5 * 60 * 1000,
  hotel: 10 * 60 * 1000,
  car: 10 * 60 * 1000,
}

const DEFAULT_PAGE_SIZES: Record<SearchCacheVertical, number> = {
  flight: 6,
  hotel: 24,
  car: 6,
}

const DEFAULT_MAX_ENTRIES = 200

const searchCache = new Map<string, StoredSearchCacheEntry<SearchEntity, unknown>>()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSearchCacheVertical = (value: unknown): value is SearchCacheVertical =>
  value === 'flight' || value === 'hotel' || value === 'car'

const cloneCacheValue = <TValue>(value: TValue): TValue => {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value)
  }

  return value
}

const toInteger = (
  value: unknown,
  fallback: number,
  options?: {
    min?: number
    max?: number
  },
) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed)) return fallback

  const min = options?.min ?? Number.MIN_SAFE_INTEGER
  const max = options?.max ?? Number.MAX_SAFE_INTEGER
  return Math.min(max, Math.max(min, parsed))
}

const toSearchCacheArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
  }

  const token = String(value ?? '').trim()
  if (!token) return []
  if (!token.includes(',')) return [token]

  return token
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

const getNestedValue = (params: SearchCacheParams, ...keys: string[]) => {
  for (const key of keys) {
    if (key in params) return params[key]
  }

  const filters = params.filters
  if (!isRecord(filters)) return undefined

  for (const key of keys) {
    if (key in filters) return filters[key]
  }

  return undefined
}

export const normalizeSearchCacheToken = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[:]/g, '-')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const normalizeOptionalToken = (value: unknown, fallback = 'any') => {
  const token = normalizeSearchCacheToken(value)
  return token || fallback
}

const normalizeStringArrayForCache = (value: unknown) =>
  Array.from(
    new Set(toSearchCacheArray(value).map((entry) => normalizeSearchCacheToken(entry)).filter(Boolean)),
  ).sort()

const serializeCacheArray = (values: string[]) => values.join(',') || 'any'

const normalizeFlightSearchParamsForCache = (params: SearchCacheParams) => {
  return {
    origin: normalizeOptionalToken(
      getNestedValue(params, 'origin', 'originCode', 'fromLocationSlug', 'from', 'fromSlug'),
    ),
    destination: normalizeOptionalToken(
      getNestedValue(params, 'destination', 'destinationCode', 'toLocationSlug', 'to', 'toSlug'),
    ),
    departDate: normalizeOptionalToken(getNestedValue(params, 'departDate', 'serviceDate')),
    itineraryType: normalizeOptionalToken(getNestedValue(params, 'itineraryType')),
    passengers: toInteger(getNestedValue(params, 'passengers', 'travelers'), 1, {
      min: 1,
      max: 12,
    }),
    cabinClass: normalizeOptionalToken(getNestedValue(params, 'cabinClass')),
    sort: normalizeOptionalToken(getNestedValue(params, 'sort'), 'recommended'),
    page: toInteger(getNestedValue(params, 'page'), 1, {
      min: 1,
      max: 999,
    }),
    pageSize: toInteger(getNestedValue(params, 'pageSize', 'limit'), DEFAULT_PAGE_SIZES.flight, {
      min: 1,
      max: 60,
    }),
    maxStops:
      getNestedValue(params, 'maxStops') == null
        ? 'any'
        : String(
            toInteger(getNestedValue(params, 'maxStops'), 0, {
              min: 0,
              max: 2,
            }),
          ),
    departureWindows: normalizeStringArrayForCache(getNestedValue(params, 'departureWindows')),
    arrivalWindows: normalizeStringArrayForCache(getNestedValue(params, 'arrivalWindows')),
    priceBand: normalizeOptionalToken(getNestedValue(params, 'priceBand')),
  }
}

const normalizeHotelSearchParamsForCache = (params: SearchCacheParams) => {
  return {
    location: normalizeOptionalToken(
      getNestedValue(params, 'citySlug', 'hotelSlug', 'location', 'query', 'city'),
    ),
    checkIn: normalizeOptionalToken(getNestedValue(params, 'checkIn', 'checkInDate')),
    checkOut: normalizeOptionalToken(getNestedValue(params, 'checkOut', 'checkOutDate')),
    occupancy: toInteger(getNestedValue(params, 'occupancy', 'adults'), 2, {
      min: 1,
      max: 12,
    }),
    rooms: toInteger(getNestedValue(params, 'rooms'), 1, {
      min: 1,
      max: 8,
    }),
    sort: normalizeOptionalToken(getNestedValue(params, 'sort'), 'recommended'),
    page: toInteger(getNestedValue(params, 'page'), 1, {
      min: 1,
      max: 999,
    }),
    pageSize: toInteger(getNestedValue(params, 'pageSize', 'limit'), DEFAULT_PAGE_SIZES.hotel, {
      min: 1,
      max: 60,
    }),
    priceRange: normalizeStringArrayForCache(getNestedValue(params, 'priceRange')),
    starRating: normalizeStringArrayForCache(getNestedValue(params, 'starRating', 'stars')),
    guestRating: normalizeStringArrayForCache(getNestedValue(params, 'guestRating', 'rating')),
    amenities: normalizeStringArrayForCache(getNestedValue(params, 'amenities')),
  }
}

const normalizeCarSearchParamsForCache = (params: SearchCacheParams) => {
  return {
    location: normalizeOptionalToken(
      getNestedValue(params, 'citySlug', 'pickupLocation', 'pickupLocationId', 'location', 'query'),
    ),
    pickupDateTime: normalizeOptionalToken(getNestedValue(params, 'pickupDateTime', 'pickupDate')),
    dropoffDateTime: normalizeOptionalToken(
      getNestedValue(params, 'dropoffDateTime', 'dropoffDate'),
    ),
    vehicleClass: serializeCacheArray(
      normalizeStringArrayForCache(getNestedValue(params, 'vehicleClass', 'vehicleClasses', 'class')),
    ),
    sort: normalizeOptionalToken(getNestedValue(params, 'sort'), 'recommended'),
    page: toInteger(getNestedValue(params, 'page'), 1, {
      min: 1,
      max: 999,
    }),
    pageSize: toInteger(getNestedValue(params, 'pageSize', 'limit'), DEFAULT_PAGE_SIZES.car, {
      min: 1,
      max: 60,
    }),
    pickupType: normalizeOptionalToken(getNestedValue(params, 'pickupType', 'pickup')),
    transmission: normalizeOptionalToken(getNestedValue(params, 'transmission')),
    seatsMin:
      getNestedValue(params, 'seatsMin', 'seats') == null
        ? 'any'
        : String(
            toInteger(getNestedValue(params, 'seatsMin', 'seats'), 1, {
              min: 1,
              max: 12,
            }),
          ),
    priceBand: normalizeOptionalToken(getNestedValue(params, 'priceBand', 'price', 'priceRange')),
  }
}

export const normalizeSearchParamsForCache = (
  vertical: SearchCacheVertical,
  params: SearchCacheParams,
): SearchCacheParams => {
  if (!isSearchCacheVertical(vertical)) {
    throw new Error(`Unsupported search cache vertical: ${String(vertical)}`)
  }

  const normalizedParams = isRecord(params) ? params : {}
  if (vertical === 'flight') return normalizeFlightSearchParamsForCache(normalizedParams)
  if (vertical === 'hotel') return normalizeHotelSearchParamsForCache(normalizedParams)
  return normalizeCarSearchParamsForCache(normalizedParams)
}

export const getSearchCacheKey = (vertical: SearchCacheVertical, params: SearchCacheParams) => {
  const normalized = normalizeSearchParamsForCache(vertical, params)

  if (vertical === 'flight') {
    return [
      'flights',
      normalized.origin,
      normalized.destination,
      normalized.departDate,
      `pax=${normalized.passengers}`,
      `trip=${normalized.itineraryType}`,
      `cabin=${normalized.cabinClass}`,
      `sort=${normalized.sort}`,
      `page=${normalized.page}`,
      `size=${normalized.pageSize}`,
      `stops=${normalized.maxStops}`,
      `depart=${serializeCacheArray(normalized.departureWindows as string[])}`,
      `arrive=${serializeCacheArray(normalized.arrivalWindows as string[])}`,
      `price=${normalized.priceBand}`,
    ].join(':')
  }

  if (vertical === 'hotel') {
    return [
      'hotels',
      normalized.location,
      normalized.checkIn,
      normalized.checkOut,
      `occ=${normalized.occupancy}`,
      `rooms=${normalized.rooms}`,
      `sort=${normalized.sort}`,
      `page=${normalized.page}`,
      `size=${normalized.pageSize}`,
      `price=${serializeCacheArray(normalized.priceRange as string[])}`,
      `stars=${serializeCacheArray(normalized.starRating as string[])}`,
      `rating=${serializeCacheArray(normalized.guestRating as string[])}`,
      `amenities=${serializeCacheArray(normalized.amenities as string[])}`,
    ].join(':')
  }

  return [
    'cars',
    normalized.location,
    normalized.pickupDateTime,
    normalized.dropoffDateTime,
    `class=${normalized.vehicleClass}`,
    `sort=${normalized.sort}`,
    `page=${normalized.page}`,
    `size=${normalized.pageSize}`,
    `pickup=${normalized.pickupType}`,
    `transmission=${normalized.transmission}`,
    `seats=${normalized.seatsMin}`,
    `price=${normalized.priceBand}`,
  ].join(':')
}

export const getSearchCacheTtlMs = (vertical: SearchCacheVertical) => {
  if (!isSearchCacheVertical(vertical)) {
    throw new Error(`Unsupported search cache vertical: ${String(vertical)}`)
  }

  return DEFAULT_CACHE_TTLS_MS[vertical]
}

const toTimestamp = (value: unknown) => {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString() === value ? date.getTime() : null
}

export const isExpiredSearchCacheEntry = (entry: Pick<SearchCacheEntry, 'expiresAt'>, now = Date.now()) => {
  const expiresAt = toTimestamp(entry.expiresAt)
  if (expiresAt == null) return true
  return expiresAt <= now
}

const assertValidSearchCacheKey = (key: string) => {
  if (!String(key || '').trim()) {
    throw new Error('Search cache key must be non-empty')
  }
}

const extractSearchCacheEntities = <T extends SearchEntity = SearchEntity>(
  vertical: SearchCacheVertical,
  results: Array<SearchCacheResultLike<T>>,
): T[] => {
  const entities = results.map((result) => {
    if (isSearchEntity(result)) {
      return result as T
    }

    const candidate = result?.searchEntity
    if (isSearchEntity(candidate)) {
      return candidate as T
    }

    throw new Error(`Search cache results for ${vertical} must include canonical search entities`)
  })

  if (entities.some((entity) => entity.vertical !== vertical)) {
    throw new Error(`Search cache results for ${vertical} contain mismatched vertical entities`)
  }

  return entities
}

const isValidSearchCacheEntry = (entry: unknown): entry is StoredSearchCacheEntry => {
  if (!isRecord(entry)) return false
  if (!isSearchCacheVertical(entry.vertical)) return false
  if (typeof entry.key !== 'string' || !entry.key.trim()) return false
  if (!isRecord(entry.params)) return false
  if (toTimestamp(entry.createdAt) == null || toTimestamp(entry.expiresAt) == null) return false
  if (!Array.isArray(entry.results)) return false

  return entry.results.every(
    (result) => isSearchEntity(result) && result.vertical === entry.vertical,
  )
}

const pruneExpiredEntries = (now = Date.now()) => {
  for (const [key, entry] of searchCache.entries()) {
    if (!isValidSearchCacheEntry(entry) || isExpiredSearchCacheEntry(entry, now)) {
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

export const getCachedResults = <TValue = SearchEntity[]>(key: string): TValue | null => {
  assertValidSearchCacheKey(key)
  const now = Date.now()
  pruneExpiredEntries(now)

  const entry = searchCache.get(key)
  if (!entry) return null
  if (!isValidSearchCacheEntry(entry) || isExpiredSearchCacheEntry(entry, now)) {
    searchCache.delete(key)
    return null
  }

  searchCache.delete(key)
  searchCache.set(key, entry)

  const cachedValue = entry.value === undefined ? entry.results : entry.value
  return cloneCacheValue(cachedValue) as TValue
}

export const setCachedResults = <
  TResult extends SearchEntity = SearchEntity,
  TValue = TResult[],
>(
  vertical: SearchCacheVertical,
  key: string,
  params: SearchCacheParams,
  results: Array<SearchCacheResultLike<TResult>>,
  options?: SearchCacheSetOptions<TValue>,
) => {
  if (!isSearchCacheVertical(vertical)) {
    throw new Error(`Unsupported search cache vertical: ${String(vertical)}`)
  }

  assertValidSearchCacheKey(key)

  if (!Array.isArray(results)) {
    throw new Error('Search cache results must be an array')
  }

  const normalizedParams = normalizeSearchParamsForCache(vertical, params)
  const canonicalResults = extractSearchCacheEntities(vertical, results)
  const createdAt = new Date().toISOString()
  const ttlMs = Math.max(0, Math.round(Number(options?.ttlMs ?? getSearchCacheTtlMs(vertical)) || 0))
  const expiresAt = new Date(Date.now() + ttlMs).toISOString()

  searchCache.set(key, {
    key,
    vertical,
    createdAt,
    expiresAt,
    params: cloneCacheValue(normalizedParams),
    results: cloneCacheValue(canonicalResults),
    value: options?.value === undefined ? undefined : cloneCacheValue(options.value),
  })

  pruneExpiredEntries()
  pruneLeastRecentEntries()

  return cloneCacheValue((options?.value === undefined ? canonicalResults : options.value) as TValue)
}

export const invalidateSearchCache = (key: string) => {
  assertValidSearchCacheKey(key)
  searchCache.delete(key)
}

export const clearSearchCache = () => {
  searchCache.clear()
}
