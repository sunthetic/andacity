import { cancelStripePaymentIntent } from '~/lib/payments/adapters/stripe/cancelStripePaymentIntent'
import { createStripePaymentIntent } from '~/lib/payments/adapters/stripe/createStripePaymentIntent'
import { getStripePaymentIntent } from '~/lib/payments/adapters/stripe/getStripePaymentIntent'
import type { PaymentAdapter } from '~/types/payment-adapter'

export const PAYMENT_ADAPTERS: Record<string, PaymentAdapter> = {
  stripe: {
    provider: 'stripe',
    createPaymentIntent: createStripePaymentIntent,
    getPaymentIntent: getStripePaymentIntent,
    cancelPaymentIntent: cancelStripePaymentIntent,
  },
}
