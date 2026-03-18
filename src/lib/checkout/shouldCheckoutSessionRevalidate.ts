import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import { isCheckoutSessionTerminal } from '~/lib/checkout/isCheckoutSessionTerminal'
import type { CheckoutSession } from '~/types/checkout'

export const CHECKOUT_REVALIDATION_TTL_MS = 5 * 60 * 1000

const toTimestamp = (value: Date | string | number | null | undefined) => {
  if (value == null) return Number.NaN
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? Number.NaN : date.getTime()
}

export const shouldCheckoutSessionRevalidate = (
  session: Pick<
    CheckoutSession,
    'status' | 'expiresAt' | 'revalidationStatus' | 'revalidationSummary' | 'lastRevalidatedAt'
  >,
  options: {
    now?: Date | string | number
    ttlMs?: number
  } = {},
) => {
  if (isCheckoutSessionExpired(session, options.now)) return false
  if (isCheckoutSessionTerminal(session.status)) return false
  if (!session.lastRevalidatedAt || !session.revalidationSummary) return true
  if (session.revalidationStatus === 'idle' || session.revalidationStatus === 'failed') {
    return true
  }

  const ttlMs = Math.max(60_000, Math.round(options.ttlMs ?? CHECKOUT_REVALIDATION_TTL_MS))
  const lastRevalidatedAtMs = toTimestamp(session.lastRevalidatedAt)
  const nowMs = toTimestamp(options.now ?? new Date())
  if (!Number.isFinite(lastRevalidatedAtMs) || !Number.isFinite(nowMs)) return true

  return nowMs - lastRevalidatedAtMs >= ttlMs
}
