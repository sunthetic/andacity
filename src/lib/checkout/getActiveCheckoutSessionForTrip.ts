import { getLatestActiveCheckoutSessionRow, mapCheckoutSessionRow, persistCheckoutSessionStatus } from '~/lib/checkout/getCheckoutSession'
import { isCheckoutSessionExpired } from '~/lib/checkout/isCheckoutSessionExpired'
import type { CheckoutSession } from '~/types/checkout'

export const getActiveCheckoutSessionForTrip = async (
  tripId: number,
  options: {
    now?: Date | string | number
  } = {},
): Promise<CheckoutSession | null> => {
  const row = await getLatestActiveCheckoutSessionRow(tripId)
  if (!row) return null

  const session = mapCheckoutSessionRow(row)
  if (!isCheckoutSessionExpired(session, options.now)) {
    return session
  }

  await persistCheckoutSessionStatus(session.id, 'expired', options)
  return null
}
