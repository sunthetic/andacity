import { PAYMENT_ADAPTERS } from '~/lib/payments/adapters'
import type { CreatePaymentIntentInput, CreatePaymentIntentResult, PaymentProvider } from '~/types/payment'

export const createPaymentIntent = async (
  provider: PaymentProvider,
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> => {
  const adapter = PAYMENT_ADAPTERS[provider]
  if (!adapter) {
    throw new Error(`Payment adapter "${provider}" is unavailable.`)
  }

  return adapter.createPaymentIntent(input)
}
