import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import { checkoutSessions } from '~/lib/db/schema'
import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import { isCheckoutSessionTerminal } from '~/lib/checkout/isCheckoutSessionTerminal'
import {
  CHECKOUT_ITEM_REVALIDATION_STATUSES,
  CHECKOUT_REVALIDATION_STATUSES,
  CHECKOUT_SESSION_STATUSES,
  type CheckoutItemRevalidationResult,
  type CheckoutItemSnapshot,
  type CheckoutPricingSnapshot,
  type CheckoutRevalidationStatus,
  type CheckoutRevalidationSummary,
  type CheckoutSession,
  type CheckoutSessionStatus,
} from '~/types/checkout'

export const CHECKOUT_SESSION_DEFAULT_TTL_MS = 30 * 60 * 1000
const LATEST_CHECKOUT_MIGRATION = '0015_notifications.sql'
const CHECKOUT_SCHEMA_IDENTIFIERS = [
  'checkout_sessions',
  'checkout_session_status',
  'checkout_revalidation_status',
  'checkout_payment_sessions',
  'checkout_payment_session_status',
  'payment_provider',
  'items_json',
  'totals_json',
  'revalidation_status',
  'revalidation_summary_json',
  'last_revalidated_at',
  'amount_json',
  'revalidation_fingerprint',
  'provider_payment_intent_id',
  'booking_runs',
  'booking_item_executions',
  'booking_run_status',
  'booking_item_execution_status',
  'execution_key',
  'summary_json',
  'booking_confirmations',
  'booking_confirmation_items',
  'booking_confirmation_status',
  'confirmation_item_status',
  'public_ref',
  'confirmed_at',
  'details_json',
  'itineraries',
  'itinerary_items',
  'itinerary_status',
  'itinerary_item_status',
  'itinerary_ownerships',
  'itinerary_ownership_mode',
  'itinerary_ownership_source',
  'confirmation_id',
  'ownership_mode',
  'owner_user_id',
  'owner_session_id',
  'owner_claim_token_hash',
  'source',
  'claimed_at',
  'canonical_entity_id',
  'canonical_bookable_entity_id',
  'canonical_inventory_id',
  'checkout_traveler_profiles',
  'checkout_traveler_assignments',
  'traveler_type',
  'traveler_role',
  'traveler_document_type',
  'driver_age',
  'document_number',
  'notifications',
  'notification_channel',
  'notification_provider',
  'notification_event_type',
  'notification_status',
  'event_type',
  'channel',
  'recipient_json',
  'payload_json',
  'provider_message_id',
  'provider_metadata_json',
  'dedupe_key',
  'related_confirmation_id',
  'related_itinerary_id',
  'related_checkout_session_id',
  'sent_at',
  'delivered_at',
  'failed_at',
  'failure_message',
  'skip_reason',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

const toNonNegativeInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null
}

const toStringList = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => toNullableText(entry))
    .filter((entry): entry is string => Boolean(entry))
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const normalizeCurrencyCode = (value: unknown) => {
  const token = String(value || '')
    .trim()
    .toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : null
}

const normalizeCheckoutSessionStatus = (value: unknown): CheckoutSessionStatus => {
  return CHECKOUT_SESSION_STATUSES.includes(value as CheckoutSessionStatus)
    ? (value as CheckoutSessionStatus)
    : 'draft'
}

const normalizeCheckoutRevalidationStatus = (
  value: unknown,
): CheckoutRevalidationStatus => {
  return CHECKOUT_REVALIDATION_STATUSES.includes(value as CheckoutRevalidationStatus)
    ? (value as CheckoutRevalidationStatus)
    : 'idle'
}

const normalizePricingSnapshot = (value: unknown): CheckoutPricingSnapshot => {
  const input = isRecord(value) ? value : {}

  return {
    currencyCode: normalizeCurrencyCode(input.currencyCode),
    baseAmountCents: toNonNegativeInteger(input.baseAmountCents),
    taxesAmountCents: toNonNegativeInteger(input.taxesAmountCents),
    feesAmountCents: toNonNegativeInteger(input.feesAmountCents),
    totalAmountCents: toNonNegativeInteger(input.totalAmountCents),
  }
}

const normalizeCheckoutItemSnapshot = (value: unknown): CheckoutItemSnapshot | null => {
  const input = isRecord(value) ? value : {}
  const itemType = toNullableText(input.itemType)
  if (itemType !== 'flight' && itemType !== 'hotel' && itemType !== 'car') {
    return null
  }

  const inventory = isRecord(input.inventory) ? input.inventory : {}
  const inventoryId = toNullableText(inventory.inventoryId)
  if (!inventoryId) return null

  return {
    tripItemId: toPositiveInteger(input.tripItemId) ?? 0,
    itemType,
    vertical: itemType,
    entityId: toPositiveInteger(input.entityId),
    bookableEntityId: toPositiveInteger(input.bookableEntityId),
    inventory: {
      inventoryId,
      providerInventoryId: toPositiveInteger(inventory.providerInventoryId),
      hotelAvailabilitySnapshotId: toPositiveInteger(
        inventory.hotelAvailabilitySnapshotId,
      ),
      availability: (inventory.availability || null) as CheckoutItemSnapshot['inventory']['availability'],
      bookableEntity: (inventory.bookableEntity || null) as CheckoutItemSnapshot['inventory']['bookableEntity'],
      providerMetadata: isRecord(inventory.providerMetadata)
        ? inventory.providerMetadata
        : null,
    },
    title: toNullableText(input.title) || inventoryId,
    subtitle: toNullableText(input.subtitle),
    imageUrl: toNullableText(input.imageUrl),
    meta: toStringList(input.meta),
    startDate: toNullableText(input.startDate),
    endDate: toNullableText(input.endDate),
    snapshotTimestamp: normalizeTimestamp(input.snapshotTimestamp as string | Date | null | undefined),
    pricing: normalizePricingSnapshot(input.pricing),
  }
}

const normalizeCheckoutItemRevalidationStatus = (value: unknown) => {
  return CHECKOUT_ITEM_REVALIDATION_STATUSES.includes(
    value as CheckoutItemRevalidationResult['status'],
  )
    ? (value as CheckoutItemRevalidationResult['status'])
    : 'failed'
}

const normalizeCheckoutItemRevalidationResult = (
  value: unknown,
): CheckoutItemRevalidationResult | null => {
  const input = isRecord(value) ? value : {}
  const previousPricing = normalizePricingSnapshot(input.previousPricing)
  const currentPricing = input.currentPricing == null
    ? null
    : normalizePricingSnapshot(input.currentPricing)
  const previousInventory = normalizeCheckoutItemSnapshot({
    itemType: input.itemType,
    inventory: input.previousInventory,
  })?.inventory || null
  const currentInventory =
    input.currentInventory == null
      ? null
      : normalizeCheckoutItemSnapshot({
          itemType: input.itemType,
          inventory: input.currentInventory,
        })?.inventory || null
  const itemType = toNullableText(input.itemType)
  if (itemType !== 'flight' && itemType !== 'hotel' && itemType !== 'car') {
    return null
  }

  return {
    tripItemId: toPositiveInteger(input.tripItemId) ?? 0,
    itemType,
    vertical: itemType,
    title: toNullableText(input.title) || previousInventory?.inventoryId || 'Checkout item',
    subtitle: toNullableText(input.subtitle),
    status: normalizeCheckoutItemRevalidationStatus(input.status),
    message: toNullableText(input.message),
    previousPricing,
    currentPricing,
    previousInventory,
    currentInventory,
    providerMetadata: isRecord(input.providerMetadata) ? input.providerMetadata : null,
  }
}

const normalizeCheckoutRevalidationSummary = (
  value: unknown,
): CheckoutRevalidationSummary | null => {
  const input = isRecord(value) ? value : null
  if (!input) return null

  const itemResults = Array.isArray(input.itemResults)
    ? input.itemResults
        .map((entry) => normalizeCheckoutItemRevalidationResult(entry))
        .filter((entry): entry is CheckoutItemRevalidationResult => Boolean(entry))
    : []

  return {
    status: normalizeCheckoutRevalidationStatus(input.status),
    checkedAt: normalizeTimestamp(input.checkedAt as string | Date | null | undefined),
    itemResults,
    allItemsPassed: Boolean(input.allItemsPassed),
    blockingIssueCount: toNonNegativeInteger(input.blockingIssueCount) ?? 0,
    priceChangeCount: toNonNegativeInteger(input.priceChangeCount) ?? 0,
    unavailableCount: toNonNegativeInteger(input.unavailableCount) ?? 0,
    changedCount: toNonNegativeInteger(input.changedCount) ?? 0,
    failedCount: toNonNegativeInteger(input.failedCount) ?? 0,
    currentTotals:
      input.currentTotals == null ? null : normalizePricingSnapshot(input.currentTotals),
  }
}

const normalizeCheckoutItems = (value: unknown): CheckoutItemSnapshot[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => normalizeCheckoutItemSnapshot(entry))
    .filter((entry): entry is CheckoutItemSnapshot => Boolean(entry))
}

const isMissingCheckoutSchemaError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const source = error as {
    code?: string
    cause?: {
      code?: string
      message?: string
    }
    message?: string
  }

  const code = source.code || source.cause?.code
  if (code === '42P01' || code === '3F000' || code === '42704' || code === '42703') return true

  const message = String(source.message || source.cause?.message || '').toLowerCase()
  if (!message) return false

  const missingSchemaObject =
    message.includes('does not exist') ||
    message.includes('undefined table') ||
    message.includes('undefined object') ||
    message.includes('undefined column')

  return (
    missingSchemaObject &&
    CHECKOUT_SCHEMA_IDENTIFIERS.some((identifier) => message.includes(identifier))
  )
}

export class CheckoutSessionError extends Error {
  readonly code:
    | 'checkout_not_found'
    | 'empty_trip'
    | 'invalid_session'
    | 'checkout_schema_missing'

  constructor(
    code:
      | 'checkout_not_found'
      | 'empty_trip'
      | 'invalid_session'
      | 'checkout_schema_missing',
    message: string,
  ) {
    super(message)
    this.name = 'CheckoutSessionError'
    this.code = code
  }
}

export const withCheckoutSchemaGuard = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    if (isMissingCheckoutSchemaError(error)) {
      throw new CheckoutSessionError(
        'checkout_schema_missing',
        `Checkout schema is not available or is outdated in Postgres. Apply migrations through ${LATEST_CHECKOUT_MIGRATION}.`,
      )
    }

    throw error
  }
}

export const createCheckoutSessionId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `cko_${globalThis.crypto.randomUUID()}`
  }

  return `cko_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

type CheckoutSessionRow = typeof checkoutSessions.$inferSelect

export const mapCheckoutSessionRow = (row: CheckoutSessionRow): CheckoutSession => {
  return {
    id: row.id,
    tripId: row.tripId,
    status: normalizeCheckoutSessionStatus(row.status),
    revalidationStatus: normalizeCheckoutRevalidationStatus(row.revalidationStatus),
    revalidationSummary: normalizeCheckoutRevalidationSummary(
      row.revalidationSummaryJson,
    ),
    lastRevalidatedAt: row.lastRevalidatedAt
      ? normalizeTimestamp(row.lastRevalidatedAt)
      : null,
    currencyCode: normalizeCurrencyCode(row.currency),
    items: normalizeCheckoutItems(row.itemsJson),
    totals: normalizePricingSnapshot(row.totalsJson),
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
    expiresAt: normalizeTimestamp(row.expiresAt),
    completedAt: row.completedAt ? normalizeTimestamp(row.completedAt) : null,
    abandonedAt: row.abandonedAt ? normalizeTimestamp(row.abandonedAt) : null,
  }
}

export const persistCheckoutSessionStatus = async (
  checkoutSessionId: string,
  status: CheckoutSessionStatus,
  options: {
    now?: Date | string | number
  } = {},
) => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const normalizedNow = normalizeTimestamp(
      options.now instanceof Date || typeof options.now === 'string'
        ? options.now
        : options.now != null
          ? new Date(options.now)
          : new Date(),
    )

    await db
      .update(checkoutSessions)
      .set({
        status,
        updatedAt: new Date(normalizedNow),
        completedAt: status === 'completed' ? new Date(normalizedNow) : null,
        abandonedAt: status === 'abandoned' ? new Date(normalizedNow) : null,
      })
      .where(eq(checkoutSessions.id, checkoutSessionId))
  })
}

const refreshExpiredCheckoutSession = async (
  session: CheckoutSession,
  options: {
    now?: Date | string | number
  } = {},
) => {
  if (!isCheckoutSessionExpired(session, options.now) || isCheckoutSessionTerminal(session.status)) {
    return session
  }

  await persistCheckoutSessionStatus(session.id, 'expired', options)
  return {
    ...session,
    status: 'expired' as const,
  }
}

export const getCheckoutSession = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number
    includeTerminal?: boolean
  } = {},
): Promise<CheckoutSession | null> => {
  const normalizedId = toNullableText(checkoutSessionId)
  if (!normalizedId) return null

  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const [row] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.id, normalizedId))
      .limit(1)

    if (!row) return null

    const session = await refreshExpiredCheckoutSession(mapCheckoutSessionRow(row), options)
    if (!options.includeTerminal && isCheckoutSessionTerminal(session.status)) {
      return null
    }

    return session
  })
}

export const getLatestActiveCheckoutSessionRow = async (
  tripId: number,
): Promise<CheckoutSessionRow | null> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const [row] = await db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.tripId, tripId),
          sql`${checkoutSessions.status} in ('draft', 'blocked', 'ready')`,
        ),
      )
      .orderBy(sql`${checkoutSessions.updatedAt} desc`, sql`${checkoutSessions.createdAt} desc`)
      .limit(1)

    return row || null
  })
}
