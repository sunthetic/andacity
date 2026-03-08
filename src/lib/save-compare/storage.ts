import type {
  SavedCollections,
  SavedItem,
  SavedVertical,
} from '~/types/save-compare/saved-item'

export const SAVE_COMPARE_STORAGE_KEY = 'andacity-save-compare-v1'

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

  return {
    id,
    vertical,
    title,
    subtitle,
    price,
    meta,
    href,
    image,
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
  if (typeof window === 'undefined') return createEmptySavedCollections()

  try {
    const raw = window.localStorage.getItem(SAVE_COMPARE_STORAGE_KEY)
    if (!raw) return createEmptySavedCollections()
    return sanitizeSavedCollections(JSON.parse(raw))
  } catch {
    return createEmptySavedCollections()
  }
}

export const writeSavedCollections = (collections: SavedCollections) => {
  if (typeof window === 'undefined') return

  try {
    const payload = sanitizeSavedCollections(collections)
    window.localStorage.setItem(SAVE_COMPARE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota and serialization failures for MVP persistence.
  }
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
