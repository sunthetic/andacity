import { and, desc, eq, sql } from 'drizzle-orm'
import { getDb } from '~/lib/db/client.server'
import { checkoutPaymentSessions } from '~/lib/db/schema'
import { withCheckoutSchemaGuard } from '~/lib/checkout/getCheckoutSession'
import { isPaymentSessionTerminal } from '~/lib/payments/isPaymentSessionTerminal'
import {
  CHECKOUT_PAYMENT_SESSION_STATUSES,
  PAYMENT_INTENT_STATUSES,
  PAYMENT_PROVIDERS,
  type CheckoutPaymentSession,
  type CheckoutPaymentSessionStatus,
  type PaymentAmountSnapshot,
  type PaymentIntentStatus,
  type PaymentProvider,
} from '~/types/payment'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toNonNegativeInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null
}

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const normalizeProvider = (value: unknown): PaymentProvider => {
  return PAYMENT_PROVIDERS.includes(value as PaymentProvider)
    ? (value as PaymentProvider)
    : 'stripe'
}

const normalizePaymentIntentStatus = (value: unknown): PaymentIntentStatus => {
  return PAYMENT_INTENT_STATUSES.includes(value as PaymentIntentStatus)
    ? (value as PaymentIntentStatus)
    : 'failed'
}

const normalizeCheckoutPaymentSessionStatus = (
  value: unknown,
): CheckoutPaymentSessionStatus => {
  return CHECKOUT_PAYMENT_SESSION_STATUSES.includes(
    value as CheckoutPaymentSessionStatus,
  )
    ? (value as CheckoutPaymentSessionStatus)
    : 'draft'
}

const normalizeAmountSnapshot = (value: unknown): PaymentAmountSnapshot | null => {
  const input = isRecord(value) ? value : null
  const currency = toNullableText(input?.currency)?.toUpperCase() || null
  const totalAmountCents = toNonNegativeInteger(input?.totalAmountCents)
  if (!input || !currency || totalAmountCents == null) return null

  const items = Array.isArray(input.items)
    ? input.items
        .map((entry) => {
          const item = isRecord(entry) ? entry : null
          const inventoryId = toNullableText(item?.inventoryId)
          const tripItemId = toNonNegativeInteger(item?.tripItemId)
          if (!item || !inventoryId || tripItemId == null) return null
          return {
            tripItemId,
            inventoryId,
            totalAmountCents: toNonNegativeInteger(item.totalAmountCents),
            currency: toNullableText(item.currency)?.toUpperCase() || null,
          }
        })
        .filter(
          (entry): entry is PaymentAmountSnapshot['items'][number] =>
            Boolean(entry),
        )
    : []

  return {
    source:
      input.source === 'checkout_snapshot' ? 'checkout_snapshot' : 'revalidated_totals',
    currency,
    baseAmountCents: toNonNegativeInteger(input.baseAmountCents),
    taxesAmountCents: toNonNegativeInteger(input.taxesAmountCents),
    feesAmountCents: toNonNegativeInteger(input.feesAmountCents),
    totalAmountCents,
    itemCount: toNonNegativeInteger(input.itemCount) ?? items.length,
    items,
  }
}

export const createCheckoutPaymentSessionId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `pay_${globalThis.crypto.randomUUID()}`
  }

  return `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

type CheckoutPaymentSessionRow = typeof checkoutPaymentSessions.$inferSelect

export const mapCheckoutPaymentSessionRow = (
  row: CheckoutPaymentSessionRow,
): CheckoutPaymentSession => {
  const providerMetadata = isRecord(row.providerMetadataJson)
    ? row.providerMetadataJson
    : {}
  const amountSnapshot = normalizeAmountSnapshot(row.amountJson)

  if (!amountSnapshot) {
    throw new Error(`Checkout payment session ${row.id} has an invalid amount snapshot.`)
  }

  return {
    id: row.id,
    checkoutSessionId: row.checkoutSessionId,
    provider: normalizeProvider(row.provider),
    status: normalizeCheckoutPaymentSessionStatus(row.status),
    paymentIntentStatus: normalizePaymentIntentStatus(
      providerMetadata.paymentIntentStatus,
    ),
    currency: String(row.currency || '').trim().toUpperCase(),
    amountSnapshot,
    revalidationFingerprint: row.revalidationFingerprint,
    providerPaymentIntentId: row.providerPaymentIntentId,
    providerClientSecret: toNullableText(row.providerClientSecret),
    providerMetadata: providerMetadata,
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
    authorizedAt: row.authorizedAt ? normalizeTimestamp(row.authorizedAt) : null,
    succeededAt: row.succeededAt ? normalizeTimestamp(row.succeededAt) : null,
    failedAt: row.failedAt ? normalizeTimestamp(row.failedAt) : null,
    canceledAt: row.canceledAt ? normalizeTimestamp(row.canceledAt) : null,
    expiresAt: row.expiresAt ? normalizeTimestamp(row.expiresAt) : null,
  }
}

const refreshExpiredPaymentSession = async (
  session: CheckoutPaymentSession,
  options: {
    now?: Date | string | number
  } = {},
) => {
  if (isPaymentSessionTerminal(session.status) || !session.expiresAt) {
    return session
  }

  const expiresAtMs = Date.parse(session.expiresAt)
  const nowMs = Date.parse(String(options.now ?? new Date()))
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs) || expiresAtMs > nowMs) {
    return session
  }

  const expired = await updateCheckoutPaymentSession(session.id, {
    status: 'expired',
    paymentIntentStatus: session.paymentIntentStatus,
    providerClientSecret: session.providerClientSecret,
    providerMetadata: session.providerMetadata,
    updatedAt: String(options.now ?? new Date()),
    expiresAt: session.expiresAt,
  })

  return expired || { ...session, status: 'expired' }
}

export const updateCheckoutPaymentSession = async (
  paymentSessionId: string,
  input: {
    status: CheckoutPaymentSessionStatus
    paymentIntentStatus: PaymentIntentStatus
    providerClientSecret?: string | null
    providerMetadata?: Record<string, unknown> | null
    updatedAt?: Date | string | number
    expiresAt?: Date | string | null
  },
) => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const updatedAt = normalizeTimestamp(
      input.updatedAt instanceof Date || typeof input.updatedAt === 'string'
        ? input.updatedAt
        : input.updatedAt != null
          ? new Date(input.updatedAt)
          : new Date(),
    )

    await db
      .update(checkoutPaymentSessions)
      .set({
        status: input.status,
        providerClientSecret: input.providerClientSecret ?? null,
        providerMetadataJson: {
          ...(input.providerMetadata || {}),
          paymentIntentStatus: input.paymentIntentStatus,
        },
        updatedAt: new Date(updatedAt),
        authorizedAt:
          input.status === 'authorized' ? new Date(updatedAt) : undefined,
        succeededAt:
          input.status === 'succeeded' ? new Date(updatedAt) : undefined,
        failedAt: input.status === 'failed' ? new Date(updatedAt) : undefined,
        canceledAt:
          input.status === 'canceled' ? new Date(updatedAt) : undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      })
      .where(eq(checkoutPaymentSessions.id, paymentSessionId))

    return getCheckoutPaymentSession(paymentSessionId, { includeTerminal: true })
  })
}

export const getCheckoutPaymentSession = async (
  paymentSessionId: string,
  options: {
    now?: Date | string | number
    includeTerminal?: boolean
  } = {},
): Promise<CheckoutPaymentSession | null> => {
  const normalizedId = toNullableText(paymentSessionId)
  if (!normalizedId) return null

  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const [row] = await db
      .select()
      .from(checkoutPaymentSessions)
      .where(eq(checkoutPaymentSessions.id, normalizedId))
      .limit(1)

    if (!row) return null

    const session = await refreshExpiredPaymentSession(
      mapCheckoutPaymentSessionRow(row),
      options,
    )
    if (!options.includeTerminal && isPaymentSessionTerminal(session.status)) {
      return null
    }

    return session
  })
}

export const getLatestCheckoutPaymentSessionRow = async (
  checkoutSessionId: string,
  options: {
    includeTerminal?: boolean
  } = {},
): Promise<CheckoutPaymentSessionRow | null> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb()
    const filters = [eq(checkoutPaymentSessions.checkoutSessionId, checkoutSessionId)]
    if (!options.includeTerminal) {
      filters.push(
        sql`${checkoutPaymentSessions.status} in ('draft', 'pending', 'requires_action', 'authorized')`,
      )
    }

    const [row] = await db
      .select()
      .from(checkoutPaymentSessions)
      .where(and(...filters))
      .orderBy(
        desc(checkoutPaymentSessions.updatedAt),
        desc(checkoutPaymentSessions.createdAt),
      )
      .limit(1)

    return row || null
  })
}
