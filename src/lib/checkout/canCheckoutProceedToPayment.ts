import { getCheckoutReadinessState } from '~/lib/checkout/getCheckoutReadinessState'
import type { CheckoutSession } from '~/types/checkout'

export const canCheckoutProceedToPayment = (
  session: Pick<
    CheckoutSession,
    'status' | 'expiresAt' | 'revalidationStatus' | 'revalidationSummary'
  >,
  options: {
    now?: Date | string | number
  } = {},
) => {
  return (
    session.status === 'ready' &&
    getCheckoutReadinessState(session, options) === 'ready'
  )
}
