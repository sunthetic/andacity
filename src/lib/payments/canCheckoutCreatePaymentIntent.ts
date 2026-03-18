import { getCheckoutReadinessState } from '~/lib/checkout/getCheckoutReadinessState'
import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import { mapCheckoutToPaymentAmountSnapshot } from '~/lib/payments/mapCheckoutToPaymentAmountSnapshot'
import type { CheckoutSession } from '~/types/checkout'
import type { PaymentAmountSnapshot } from '~/types/payment'

export type CheckoutPaymentEligibilityResult =
  | {
      ok: true
      amountSnapshot: PaymentAmountSnapshot
    }
  | {
      ok: false
      code:
        | 'CHECKOUT_NOT_FOUND'
        | 'CHECKOUT_NOT_READY'
        | 'CHECKOUT_EXPIRED'
      message: string
    }

export const canCheckoutCreatePaymentIntent = (
  checkoutSession: CheckoutSession | null | undefined,
  options: {
    now?: Date | string | number
  } = {},
): CheckoutPaymentEligibilityResult => {
  if (!checkoutSession) {
    return {
      ok: false,
      code: 'CHECKOUT_NOT_FOUND',
      message: 'Checkout session could not be found.',
    }
  }

  if (isCheckoutSessionExpired(checkoutSession, options.now)) {
    return {
      ok: false,
      code: 'CHECKOUT_EXPIRED',
      message: 'Checkout expired before payment could begin.',
    }
  }

  if (
    checkoutSession.status !== 'ready' ||
    getCheckoutReadinessState(checkoutSession, options) !== 'ready'
  ) {
    return {
      ok: false,
      code: 'CHECKOUT_NOT_READY',
      message:
        'Payment can only begin after the latest checkout revalidation passes.',
    }
  }

  const amountSnapshot = mapCheckoutToPaymentAmountSnapshot(checkoutSession)
  if (!amountSnapshot) {
    return {
      ok: false,
      code: 'CHECKOUT_NOT_READY',
      message:
        'Payment is blocked because this checkout does not have a valid payable total.',
    }
  }

  return {
    ok: true,
    amountSnapshot,
  }
}
