import type { CheckoutPaymentSessionStatus } from '~/types/payment'

export const isPaymentSessionTerminal = (
  status: CheckoutPaymentSessionStatus,
) => {
  return (
    status === 'succeeded' ||
    status === 'canceled' ||
    status === 'failed' ||
    status === 'expired'
  )
}
