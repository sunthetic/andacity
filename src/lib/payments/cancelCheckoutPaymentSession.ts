import { PAYMENT_ADAPTERS } from '~/lib/payments/adapters'
import {
  getCheckoutPaymentSession,
  updateCheckoutPaymentSession,
} from '~/lib/payments/getCheckoutPaymentSession'
import { isPaymentSessionTerminal } from '~/lib/payments/isPaymentSessionTerminal'
import { mapProviderPaymentStatus } from '~/lib/payments/mapProviderPaymentStatus'
import type { CheckoutPaymentSession } from '~/types/payment'

export const cancelCheckoutPaymentSession = async (
  paymentSessionId: string,
  options: {
    now?: Date | string | number
    reason?: string
  } = {},
): Promise<CheckoutPaymentSession | null> => {
  const session = await getCheckoutPaymentSession(paymentSessionId, {
    now: options.now,
    includeTerminal: true,
  })
  if (!session) return null
  if (isPaymentSessionTerminal(session.status)) return session

  const adapter = PAYMENT_ADAPTERS[session.provider]
  if (!adapter) {
    return updateCheckoutPaymentSession(paymentSessionId, {
      status: 'canceled',
      paymentIntentStatus: 'canceled',
      providerClientSecret: session.providerClientSecret,
      providerMetadata: {
        ...(session.providerMetadata || {}),
        cancelReason: options.reason || 'manual',
      },
      updatedAt: options.now,
      expiresAt: session.expiresAt,
    })
  }

  const intent = await adapter.cancelPaymentIntent(session.providerPaymentIntentId)
  return updateCheckoutPaymentSession(paymentSessionId, {
    status: mapProviderPaymentStatus(intent.status),
    paymentIntentStatus: intent.status,
    providerClientSecret: intent.clientSecret || session.providerClientSecret,
    providerMetadata: {
      ...(session.providerMetadata || {}),
      ...(intent.metadata || {}),
      cancelReason: options.reason || 'manual',
    },
    updatedAt: options.now,
    expiresAt: session.expiresAt,
  })
}
