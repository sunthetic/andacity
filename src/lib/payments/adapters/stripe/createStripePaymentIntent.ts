import { buildStripeIntentBody, mapStripeIntentResponse, stripeRequest } from '~/lib/payments/adapters/stripe/shared'
import type { CreatePaymentIntentInput, CreatePaymentIntentResult } from '~/types/payment'

export const createStripePaymentIntent = async (
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> => {
  const payload = await stripeRequest('/v1/payment_intents', {
    method: 'POST',
    body: buildStripeIntentBody({
      amount: input.amountSnapshot.totalAmountCents,
      currency: input.currency,
      checkoutSessionId: input.checkoutSessionId,
      metadata: input.metadata,
    }),
  })

  return mapStripeIntentResponse(payload)
}
