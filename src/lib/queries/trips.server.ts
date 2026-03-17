import {
  TRIP_ITEM_TYPES,
  TRIP_STATUSES,
  type TripEditPreviewActionType,
  type TripItemCandidate,
  type TripRollbackDraft,
  type TripStatus,
} from '~/types/trips/trip'

type ParsedCreateTripInput = {
  name?: string
  status?: TripStatus
  bookingSessionId?: string | null
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

type ParsedUpdateTripItemInput = {
  locked?: boolean
  candidate?: TripItemCandidate
}

type ParsedMoveTripItemInput = {
  targetTripId: number
}

type ParsedTripEditPreviewInput =
  | {
      actionType: Extract<TripEditPreviewActionType, 'reorder'>
      orderedItemIds: number[]
    }
  | {
      actionType: Extract<TripEditPreviewActionType, 'remove'>
    }
  | {
      actionType: Extract<TripEditPreviewActionType, 'replace'>
      candidate: TripItemCandidate
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

const toOptionalInventoryId = (value: unknown): string | undefined => {
  const text = toTrimmedString(value)
  return text ? text : undefined
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

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  return undefined
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
    bookingSessionId:
      obj.bookingSessionId === undefined
        ? undefined
        : obj.bookingSessionId == null
          ? null
          : toOptionalString(obj.bookingSessionId) || null,
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

  const inventoryId = toOptionalInventoryId(obj.inventoryId)
  if (!itemType || !inventoryId) return null

  const providerInventoryId = toOptionalInt(obj.providerInventoryId ?? obj.inventoryId)

  return {
    itemType,
    inventoryId,
    providerInventoryId:
      providerInventoryId == null || providerInventoryId < 1
        ? undefined
        : providerInventoryId,
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

export const parseUpdateTripItemInput = (body: unknown): ParsedUpdateTripItemInput | null => {
  const obj = isRecord(body) ? body : {}
  const locked = toOptionalBoolean(obj.locked)
  const candidate = obj.candidate === undefined ? undefined : parseTripItemCandidateInput(obj.candidate)

  if (locked === undefined && candidate === undefined) return null
  if (obj.candidate !== undefined && candidate == null) return null

  return {
    locked,
    candidate: candidate || undefined,
  }
}

export const parseMoveTripItemInput = (body: unknown): ParsedMoveTripItemInput | null => {
  const obj = isRecord(body) ? body : {}
  const targetTripId = toOptionalInt(obj.targetTripId)
  if (targetTripId == null || targetTripId < 1) return null

  return {
    targetTripId,
  }
}

export const parseTripEditPreviewInput = (body: unknown): ParsedTripEditPreviewInput | null => {
  const obj = isRecord(body) ? body : {}
  const actionType = toTrimmedString(obj.actionType).toLowerCase()

  if (actionType === 'reorder') {
    const orderedItemIds = parseTripReorderInput(body)
    if (!orderedItemIds) return null
    return {
      actionType,
      orderedItemIds,
    }
  }

  if (actionType === 'remove') {
    return { actionType }
  }

  if (actionType === 'replace') {
    const candidate = parseTripItemCandidateInput(obj.candidate)
    if (!candidate) return null
    return {
      actionType,
      candidate,
    }
  }

  return null
}

export const parseTripRollbackDraftInput = (body: unknown): TripRollbackDraft | null => {
  const obj = isRecord(body) ? body : {}
  if (!Array.isArray(obj.items)) return null

  const items = obj.items
    .map((entry) => {
      if (!isRecord(entry)) return null

      const itemTypeToken = toTrimmedString(entry.itemType).toLowerCase()
      const itemType = TRIP_ITEM_TYPES.includes(itemTypeToken as TripItemCandidate['itemType'])
        ? (itemTypeToken as TripItemCandidate['itemType'])
        : null
      const id = toOptionalInt(entry.id)
      const inventoryId = toOptionalInventoryId(entry.inventoryId)
      const position = toOptionalInt(entry.position)
      const snapshotPriceCents = toOptionalInt(entry.snapshotPriceCents)
      const snapshotCurrencyCode = toOptionalCurrencyCode(entry.snapshotCurrencyCode)
      const snapshotTimestamp = toTrimmedString(entry.snapshotTimestamp)
      const meta = Array.isArray(entry.meta)
        ? entry.meta.map((value) => toTrimmedString(value)).filter(Boolean)
        : null
      const bookingSessionId =
        entry.bookingSessionId == null ? null : toOptionalString(entry.bookingSessionId) || null
      const inventorySnapshot =
        entry.inventorySnapshot == null ? null : toRecord(entry.inventorySnapshot)
      const metadata = toRecord(entry.metadata)

      if (
        !itemType ||
        id == null ||
        id < 1 ||
        !inventoryId ||
        position == null ||
        position < 0 ||
        snapshotPriceCents == null ||
        !snapshotCurrencyCode ||
        !snapshotTimestamp ||
        Number.isNaN(Date.parse(snapshotTimestamp)) ||
        meta == null ||
        !metadata
      ) {
        return null
      }

      const hotelId =
        entry.hotelId == null ? null : (toOptionalInt(entry.hotelId) ?? null)
      const flightItineraryId =
        entry.flightItineraryId == null
          ? null
          : (toOptionalInt(entry.flightItineraryId) ?? null)
      const carInventoryId =
        entry.carInventoryId == null
          ? null
          : (toOptionalInt(entry.carInventoryId) ?? null)
      const startCityId =
        entry.startCityId == null ? null : (toOptionalInt(entry.startCityId) ?? null)
      const endCityId =
        entry.endCityId == null ? null : (toOptionalInt(entry.endCityId) ?? null)

      return {
        id,
        itemType,
        inventoryId,
        position,
        hotelId,
        flightItineraryId,
        carInventoryId,
        startCityId,
        endCityId,
        startDate: toOptionalIsoDate(entry.startDate) ?? null,
        endDate: toOptionalIsoDate(entry.endDate) ?? null,
        snapshotPriceCents,
        snapshotCurrencyCode,
        snapshotTimestamp,
        title: toTrimmedString(entry.title),
        bookingSessionId,
        subtitle:
          entry.subtitle == null ? null : toOptionalString(entry.subtitle) || null,
        imageUrl: entry.imageUrl == null ? null : toOptionalString(entry.imageUrl) || null,
        meta,
        inventorySnapshot:
          (inventorySnapshot as TripRollbackDraft["items"][number]["inventorySnapshot"]) || null,
        metadata,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  if (items.length !== obj.items.length) return null
  return { items }
}
