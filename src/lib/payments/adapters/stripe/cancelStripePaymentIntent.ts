import { mapStripeIntentResponse, stripeRequest } from '~/lib/payments/adapters/stripe/shared'
import type { PaymentIntentRecord } from '~/types/payment-adapter'

export const cancelStripePaymentIntent = async (
  providerPaymentIntentId: string,
): Promise<PaymentIntentRecord> => {
  const payload = await stripeRequest(
    `/v1/payment_intents/${encodeURIComponent(providerPaymentIntentId)}/cancel`,
    {
      method: 'POST',
    },
  )
  return mapStripeIntentResponse(payload)
}
