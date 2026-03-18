import type { CheckoutPaymentSessionStatus, PaymentIntentStatus } from '~/types/payment'

export const mapProviderPaymentStatus = (
  status: PaymentIntentStatus,
): CheckoutPaymentSessionStatus => {
  switch (status) {
    case 'requires_payment_method':
    case 'requires_action':
      return 'requires_action'
    case 'requires_capture':
      return 'authorized'
    case 'succeeded':
      return 'succeeded'
    case 'canceled':
      return 'canceled'
    case 'failed':
      return 'failed'
    case 'requires_confirmation':
    case 'processing':
    default:
      return 'pending'
  }
}
