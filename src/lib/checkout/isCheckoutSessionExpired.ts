import { isCheckoutSessionTerminal } from '~/lib/checkout/isCheckoutSessionTerminal'
import type { CheckoutSession, CheckoutSessionStatus } from '~/types/checkout'

const toTimestamp = (value: Date | string | number | null | undefined) => {
  if (value == null) return Date.now()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime()
}

type ExpirableCheckoutSession =
  | Pick<CheckoutSession, 'status' | 'expiresAt'>
  | {
      status: CheckoutSessionStatus
      expiresAt: string | null | undefined
    }

export const isCheckoutSessionExpired = (
  session: ExpirableCheckoutSession,
  now?: Date | string | number,
) => {
  if (session.status === 'expired') return true
  if (isCheckoutSessionTerminal(session.status)) return false
  if (!session.expiresAt) return false

  return toTimestamp(session.expiresAt) <= toTimestamp(now)
}
