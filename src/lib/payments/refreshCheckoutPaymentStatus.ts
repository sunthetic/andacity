import { PAYMENT_ADAPTERS } from '~/lib/payments/adapters'
import {
  getCheckoutPaymentSession,
  updateCheckoutPaymentSession,
} from '~/lib/payments/getCheckoutPaymentSession'
import { mapProviderPaymentStatus } from '~/lib/payments/mapProviderPaymentStatus'
import type { CheckoutPaymentSession } from '~/types/payment'

export const refreshCheckoutPaymentStatus = async (
  paymentSessionId: string,
  options: {
    now?: Date | string | number
  } = {},
): Promise<CheckoutPaymentSession | null> => {
  const session = await getCheckoutPaymentSession(paymentSessionId, {
    now: options.now,
    includeTerminal: true,
  })
  if (!session) return null

  const adapter = PAYMENT_ADAPTERS[session.provider]
  if (!adapter) {
    throw new Error(`Payment adapter "${session.provider}" is unavailable.`)
  }

  const intent = await adapter.getPaymentIntent(session.providerPaymentIntentId)
  const nextStatus = mapProviderPaymentStatus(intent.status)

  return updateCheckoutPaymentSession(paymentSessionId, {
    status: nextStatus,
    paymentIntentStatus: intent.status,
    providerClientSecret: intent.clientSecret || session.providerClientSecret,
    providerMetadata: {
      ...(session.providerMetadata || {}),
      ...(intent.metadata || {}),
    },
    updatedAt: options.now,
    expiresAt: session.expiresAt,
  })
}
