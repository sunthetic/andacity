import { TERMINAL_CHECKOUT_SESSION_STATUSES, type CheckoutSessionStatus } from '~/types/checkout'

export const isCheckoutSessionTerminal = (status: CheckoutSessionStatus) => {
  return (TERMINAL_CHECKOUT_SESSION_STATUSES as readonly CheckoutSessionStatus[]).includes(
    status,
  )
}
