import { TRIP_ITEM_TYPES, TRIP_STATUSES, type TripItemCandidate, type TripStatus } from '~/types/trips/trip'

type ParsedCreateTripInput = {
  name?: string
  status?: TripStatus
  notes?: string | null
  metadata?: Record<string, unknown>
  startDate?: string | null
  endDate?: string | null
}

type ParsedUpdateTripInput = {
  name?: string
  status?: TripStatus
  notes?: string | null
  metadata?: Record<string, unknown>
  startDate?: string | null
  endDate?: string | null
  dateSource?: 'auto' | 'manual'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const toTrimmedString = (value: unknown): string => {
  return String(value || '').trim()
}

const toOptionalString = (value: unknown): string | undefined => {
  const text = toTrimmedString(value)
  return text ? text : undefined
}

const toOptionalIsoDate = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined
  if (value === null) return null
  const text = toTrimmedString(value)
  if (!text) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

const toOptionalStatus = (value: unknown): TripStatus | undefined => {
  const token = toTrimmedString(value).toLowerCase()
  return TRIP_STATUSES.includes(token as TripStatus) ? (token as TripStatus) : undefined
}

const toOptionalInt = (value: unknown): number | undefined => {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toOptionalCurrencyCode = (value: unknown): string | undefined => {
  const token = toTrimmedString(value).toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : undefined
}

const toMetaList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const list = value
    .map((entry) => toTrimmedString(entry))
    .filter(Boolean)
    .slice(0, 8)
  return list.length ? list : undefined
}

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
  return isRecord(value) ? value : undefined
}

export const parseTripIdParam = (value: string | undefined): number | null => {
  const id = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(id) || id < 1) return null
  return id
}

export const parseItemIdParam = (value: string | undefined): number | null => {
  const id = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(id) || id < 1) return null
  return id
}

export const parseCreateTripInput = (body: unknown): ParsedCreateTripInput => {
  const obj = isRecord(body) ? body : {}
  return {
    name: toOptionalString(obj.name),
    status: toOptionalStatus(obj.status),
    notes:
      obj.notes === undefined
        ? undefined
        : obj.notes == null
          ? null
          : toOptionalString(obj.notes) || null,
    metadata: toRecord(obj.metadata),
    startDate: toOptionalIsoDate(obj.startDate),
    endDate: toOptionalIsoDate(obj.endDate),
  }
}

export const parseUpdateTripInput = (body: unknown): ParsedUpdateTripInput => {
  const obj = isRecord(body) ? body : {}
  const dateSourceToken = toTrimmedString(obj.dateSource).toLowerCase()

  return {
    name: obj.name === undefined ? undefined : toOptionalString(obj.name),
    status: obj.status === undefined ? undefined : toOptionalStatus(obj.status),
    notes:
      obj.notes === undefined
        ? undefined
        : obj.notes == null
          ? null
          : toOptionalString(obj.notes) || null,
    metadata: obj.metadata === undefined ? undefined : toRecord(obj.metadata),
    startDate: toOptionalIsoDate(obj.startDate),
    endDate: toOptionalIsoDate(obj.endDate),
    dateSource:
      dateSourceToken === 'auto' || dateSourceToken === 'manual'
        ? (dateSourceToken as 'auto' | 'manual')
        : undefined,
  }
}

export const parseTripItemCandidateInput = (body: unknown): TripItemCandidate | null => {
  const obj = isRecord(body) ? body : {}
  const itemTypeToken = toTrimmedString(obj.itemType).toLowerCase()
  const itemType = TRIP_ITEM_TYPES.includes(itemTypeToken as TripItemCandidate['itemType'])
    ? (itemTypeToken as TripItemCandidate['itemType'])
    : null

  const inventoryId = toOptionalInt(obj.inventoryId)
  if (!itemType || inventoryId == null || inventoryId < 1) return null

  return {
    itemType,
    inventoryId,
    startDate: toOptionalIsoDate(obj.startDate) || undefined,
    endDate: toOptionalIsoDate(obj.endDate) || undefined,
    priceCents: toOptionalInt(obj.priceCents),
    currencyCode: toOptionalCurrencyCode(obj.currencyCode),
    title: toOptionalString(obj.title),
    subtitle: toOptionalString(obj.subtitle),
    imageUrl: toOptionalString(obj.imageUrl),
    meta: toMetaList(obj.meta),
    metadata: toRecord(obj.metadata),
  }
}

export const parseTripReorderInput = (body: unknown): number[] | null => {
  const obj = isRecord(body) ? body : {}
  const raw = obj.orderedItemIds
  if (!Array.isArray(raw)) return null

  const ids = raw
    .map((entry) => Number.parseInt(String(entry || ''), 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0)

  if (!ids.length) return null
  if (new Set(ids).size !== ids.length) return null
  return ids
}
