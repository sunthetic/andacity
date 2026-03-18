import { isPaymentSessionTerminal } from '~/lib/payments/isPaymentSessionTerminal'
import type {
  CheckoutPaymentSession,
  CheckoutPaymentSessionStatus,
} from '~/types/payment'

const RESUMABLE_STATUSES: CheckoutPaymentSessionStatus[] = [
  'draft',
  'pending',
  'requires_action',
  'authorized',
]

export const canPaymentSessionBeResumed = (
  session:
    | Pick<CheckoutPaymentSession, 'status' | 'expiresAt'>
    | null
    | undefined,
  options: {
    now?: Date | string | number
  } = {},
) => {
  if (!session) return false
  if (!RESUMABLE_STATUSES.includes(session.status)) return false
  if (isPaymentSessionTerminal(session.status)) return false

  if (!session.expiresAt) return true
  const expiresAtMs = Date.parse(session.expiresAt)
  const nowMs = Date.parse(String(options.now ?? new Date()))
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) return true

  return expiresAtMs > nowMs
}
