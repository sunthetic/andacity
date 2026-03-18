import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import type { CheckoutReadinessState, CheckoutSession } from '~/types/checkout'

type CheckoutReadinessCandidate = Pick<
  CheckoutSession,
  'status' | 'expiresAt' | 'revalidationStatus' | 'revalidationSummary'
>

export const getCheckoutReadinessState = (
  session: CheckoutReadinessCandidate,
  options: {
    now?: Date | string | number
  } = {},
): CheckoutReadinessState => {
  if (isCheckoutSessionExpired(session, options.now)) return 'blocked'
  if (session.status === 'completed' || session.status === 'abandoned') return 'blocked'
  if (session.revalidationStatus !== 'passed') return 'blocked'
  if (!session.revalidationSummary?.allItemsPassed) return 'blocked'
  return 'ready'
}
