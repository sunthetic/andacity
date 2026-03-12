import type {
  SavedCollections,
  CompareData,
  SavedItem,
  SavedVertical,
} from '~/types/save-compare/saved-item'
import { TRIP_ITEM_TYPES, type TripItemCandidate, type TripItemType } from '~/types/trips/trip'

export const SAVE_COMPARE_STORAGE_KEY = 'andacity-save-compare-v1'
export const COMPARE_SESSION_STORAGE_KEY = 'andacity-compare-v1'
export const RECENTLY_VIEWED_SESSION_STORAGE_KEY = 'andacity-recently-viewed-v1'

const EMPTY_SAVED_COLLECTIONS: SavedCollections = {
  hotels: [],
  cars: [],
  flights: [],
}

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

const toNonEmptyString = (value: unknown): string | null => {
  const text = String(value || '').trim()
  return text ? text : null
}

const sanitizeMeta = (value: unknown) => {
  if (!Array.isArray(value)) return undefined
  const list = value
    .map((entry) => toNonEmptyString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 8)
  return list.length ? list : undefined
}

const toSafeDate = (value: unknown) => {
  const text = toNonEmptyString(value)
  if (!text) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined
}

const toSafeInt = (value: unknown) => {
  const n = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(n) ? n : undefined
}

const toTripItemType = (value: unknown): TripItemType | null => {
  const token = String(value || '').trim().toLowerCase()
  return TRIP_ITEM_TYPES.includes(token as TripItemType) ? (token as TripItemType) : null
}

const sanitizeCandidateMetadata = (value: unknown): Record<string, unknown> | undefined => {
  const obj = asObject(value)
  if (!obj) return undefined
  return obj
}

const sanitizeTripItemCandidate = (value: unknown): TripItemCandidate | undefined => {
  const obj = asObject(value)
  if (!obj) return undefined

  const itemType = toTripItemType(obj.itemType)
  const inventoryId = toSafeInt(obj.inventoryId)
  if (!itemType || inventoryId == null || inventoryId < 1) return undefined

  const startDate = toSafeDate(obj.startDate)
  const endDate = toSafeDate(obj.endDate)
  const priceCents = toSafeInt(obj.priceCents)
  const currencyCode = toNonEmptyString(obj.currencyCode) || undefined
  const title = toNonEmptyString(obj.title) || undefined
  const subtitle = toNonEmptyString(obj.subtitle) || undefined
  const imageUrl = toNonEmptyString(obj.imageUrl) || undefined
  const meta = sanitizeMeta(obj.meta)
  const metadata = sanitizeCandidateMetadata(obj.metadata)

  return {
    itemType,
    inventoryId,
    startDate,
    endDate,
    priceCents: priceCents == null ? undefined : Math.max(0, priceCents),
    currencyCode,
    title,
    subtitle,
    imageUrl,
    meta,
    metadata,
  }
}

const sanitizeCompareData = (value: unknown): CompareData | undefined => {
  const obj = asObject(value)
  if (!obj) return undefined

  const entries = Object.entries(obj)
    .map(([key, raw]) => {
      const safeKey = toNonEmptyString(key)
      const safeValue = toNonEmptyString(raw)
      if (!safeKey || !safeValue) return null
      return [safeKey, safeValue] as const
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry))
    .slice(0, 24)

  return entries.length ? Object.fromEntries(entries) : undefined
}

const normalizeSavedItem = (value: unknown, vertical: SavedVertical): SavedItem | null => {
  const obj = asObject(value)
  if (!obj) return null

  const id = toNonEmptyString(obj.id)
  const title = toNonEmptyString(obj.title)
  const href = toNonEmptyString(obj.href)
  if (!id || !title || !href) return null

  const subtitle = toNonEmptyString(obj.subtitle) || undefined
  const price = toNonEmptyString(obj.price) || undefined
  const image = toNonEmptyString(obj.image) || undefined
  const meta = sanitizeMeta(obj.meta)
  const compareData = sanitizeCompareData(obj.compareData)
  const tripCandidate = sanitizeTripItemCandidate(obj.tripCandidate)

  return {
    id,
    vertical,
    title,
    subtitle,
    price,
    meta,
    href,
    image,
    compareData,
    tripCandidate,
  }
}

const normalizeSavedCollection = (value: unknown, vertical: SavedVertical): SavedItem[] => {
  if (!Array.isArray(value)) return []

  const deduped = new Map<string, SavedItem>()

  for (const entry of value) {
    const item = normalizeSavedItem(entry, vertical)
    if (!item) continue
    deduped.set(item.id, item)
  }

  return [...deduped.values()]
}

export const createEmptySavedCollections = (): SavedCollections => ({
  hotels: [],
  cars: [],
  flights: [],
})

const sanitizeSavedCollections = (value: unknown): SavedCollections => {
  const obj = asObject(value)
  if (!obj) return createEmptySavedCollections()

  return {
    hotels: normalizeSavedCollection(obj.hotels, 'hotels'),
    cars: normalizeSavedCollection(obj.cars, 'cars'),
    flights: normalizeSavedCollection(obj.flights, 'flights'),
  }
}

export const readSavedCollections = (): SavedCollections => {
  return readCollectionsFromWindowStorage('local', SAVE_COMPARE_STORAGE_KEY)
}

export const writeSavedCollections = (collections: SavedCollections) => {
  writeCollectionsToWindowStorage('local', SAVE_COMPARE_STORAGE_KEY, collections)
}

export const readSavedItems = (vertical: SavedVertical) => {
  return readSavedCollections()[vertical]
}

export const writeSavedItems = (vertical: SavedVertical, items: SavedItem[]) => {
  const current = readSavedCollections()
  current[vertical] = normalizeSavedCollection(items, vertical)
  writeSavedCollections(current)
}

export const clearSavedItems = (vertical: SavedVertical) => {
  const current = readSavedCollections()
  current[vertical] = EMPTY_SAVED_COLLECTIONS[vertical]
  writeSavedCollections(current)
}

export const readSessionCompareCollections = () => {
  return readCollectionsFromWindowStorage('session', COMPARE_SESSION_STORAGE_KEY)
}

export const writeSessionCompareCollections = (collections: SavedCollections) => {
  writeCollectionsToWindowStorage('session', COMPARE_SESSION_STORAGE_KEY, collections)
}

export const readRecentlyViewedCollections = () => {
  return readCollectionsFromWindowStorage('session', RECENTLY_VIEWED_SESSION_STORAGE_KEY)
}

export const writeRecentlyViewedCollections = (collections: SavedCollections) => {
  writeCollectionsToWindowStorage('session', RECENTLY_VIEWED_SESSION_STORAGE_KEY, collections)
}

const readCollectionsFromWindowStorage = (
  storageType: 'local' | 'session',
  key: string,
): SavedCollections => {
  if (typeof window === 'undefined') return createEmptySavedCollections()

  try {
    const storage = storageType === 'local' ? window.localStorage : window.sessionStorage
    const raw = storage.getItem(key)
    if (!raw) return createEmptySavedCollections()
    return sanitizeSavedCollections(JSON.parse(raw))
  } catch {
    return createEmptySavedCollections()
  }
}

const writeCollectionsToWindowStorage = (
  storageType: 'local' | 'session',
  key: string,
  collections: SavedCollections,
) => {
  if (typeof window === 'undefined') return

  try {
    const storage = storageType === 'local' ? window.localStorage : window.sessionStorage
    const payload = sanitizeSavedCollections(collections)
    storage.setItem(key, JSON.stringify(payload))
  } catch {
    // Ignore quota and serialization failures for MVP persistence.
  }
}
