import { getCheckoutReadinessState } from '~/lib/checkout/getCheckoutReadinessState'
import { canCheckoutProceedWithTravelers } from '~/fns/travelers/canCheckoutProceedWithTravelers'
import type { CheckoutSession } from '~/types/checkout'

export const canCheckoutProceedToPayment = (
  session: Pick<
    CheckoutSession,
    | 'status'
    | 'expiresAt'
    | 'revalidationStatus'
    | 'revalidationSummary'
    | 'travelerValidationSummary'
    | 'hasCompleteTravelerDetails'
  >,
  options: {
    now?: Date | string | number
  } = {},
) => {
  const travelersReady =
    typeof session.hasCompleteTravelerDetails === 'boolean'
      ? session.hasCompleteTravelerDetails
      : session.travelerValidationSummary
        ? canCheckoutProceedWithTravelers(session.travelerValidationSummary)
        : false

  return (
    session.status === 'ready' &&
    getCheckoutReadinessState(session, options) === 'ready' &&
    travelersReady
  )
}
