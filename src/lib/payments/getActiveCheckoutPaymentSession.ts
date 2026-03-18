import {
  getLatestCheckoutPaymentSessionRow,
  mapCheckoutPaymentSessionRow,
  updateCheckoutPaymentSession,
} from '~/lib/payments/getCheckoutPaymentSession'
import { isPaymentSessionTerminal } from '~/lib/payments/isPaymentSessionTerminal'
import type { CheckoutPaymentSession } from '~/types/payment'

export const getActiveCheckoutPaymentSession = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number
  } = {},
): Promise<CheckoutPaymentSession | null> => {
  while (true) {
    const row = await getLatestCheckoutPaymentSessionRow(checkoutSessionId)
    if (!row) return null

    const session = mapCheckoutPaymentSessionRow(row)
    if (isPaymentSessionTerminal(session.status) || !session.expiresAt) {
      return isPaymentSessionTerminal(session.status) ? null : session
    }

    const expiresAtMs = Date.parse(session.expiresAt)
    const nowMs = Date.parse(String(options.now ?? new Date()))
    if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs) || expiresAtMs > nowMs) {
      return session
    }

    await updateCheckoutPaymentSession(session.id, {
      status: 'expired',
      paymentIntentStatus: session.paymentIntentStatus,
      providerClientSecret: session.providerClientSecret,
      providerMetadata: session.providerMetadata,
      updatedAt: options.now,
      expiresAt: session.expiresAt,
    })
  }
}
