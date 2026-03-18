import { mapStripeIntentResponse, stripeRequest } from '~/lib/payments/adapters/stripe/shared'
import type { PaymentIntentRecord } from '~/types/payment-adapter'

export const getStripePaymentIntent = async (
  providerPaymentIntentId: string,
): Promise<PaymentIntentRecord> => {
  const payload = await stripeRequest(
    `/v1/payment_intents/${encodeURIComponent(providerPaymentIntentId)}`,
  )
  return mapStripeIntentResponse(payload)
}
