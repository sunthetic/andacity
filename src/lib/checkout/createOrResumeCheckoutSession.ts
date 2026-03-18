import { createCheckoutSession } from '~/lib/checkout/createCheckoutSession'
import { getActiveCheckoutSessionForTrip } from '~/lib/checkout/getActiveCheckoutSessionForTrip'
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
} from '~/types/checkout'

export const createOrResumeCheckoutSession = async (
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> => {
  const activeSession = await getActiveCheckoutSessionForTrip(input.trip.id, {
    now: input.now ?? undefined,
  })

  if (activeSession) {
    return {
      session: activeSession,
      createdNew: false,
      redirectHref: `/checkout/${activeSession.id}`,
    }
  }

  const session = await createCheckoutSession(input)
  return {
    session,
    createdNew: true,
    redirectHref: `/checkout/${session.id}`,
  }
}
