import { createCheckoutSession } from '~/lib/checkout/createCheckoutSession'
import { getActiveCheckoutSessionForTrip } from '~/lib/checkout/getActiveCheckoutSessionForTrip'
import type {
  CheckoutEntryErrorCode,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
} from '~/types/checkout'

export class CheckoutSessionTransitionError extends Error {
  readonly code: Extract<
    CheckoutEntryErrorCode,
    'CHECKOUT_CREATE_FAILED' | 'CHECKOUT_RESUME_FAILED'
  >

  constructor(
    code: Extract<
      CheckoutEntryErrorCode,
      'CHECKOUT_CREATE_FAILED' | 'CHECKOUT_RESUME_FAILED'
    >,
    message: string,
  ) {
    super(message)
    this.name = 'CheckoutSessionTransitionError'
    this.code = code
  }
}

const buildCheckoutRedirectTo = (
  checkoutSessionId: string,
  entryMode: 'created' | 'resumed',
) => {
  return `/checkout/${checkoutSessionId}?entry=${entryMode}`
}

export const createOrResumeCheckoutSession = async (
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> => {
  let activeSession = null
  try {
    activeSession = await getActiveCheckoutSessionForTrip(input.trip.id, {
      now: input.now ?? undefined,
    })
  } catch (error) {
    throw new CheckoutSessionTransitionError(
      'CHECKOUT_RESUME_FAILED',
      error instanceof Error
        ? error.message
        : 'Failed to resume the active checkout session.',
    )
  }

  if (activeSession) {
    return {
      session: activeSession,
      createdNew: false,
      entryMode: 'resumed',
      redirectTo: buildCheckoutRedirectTo(activeSession.id, 'resumed'),
    }
  }

  let session = null
  try {
    session = await createCheckoutSession(input)
  } catch (error) {
    throw new CheckoutSessionTransitionError(
      'CHECKOUT_CREATE_FAILED',
      error instanceof Error
        ? error.message
        : 'Failed to create a checkout session from this trip.',
    )
  }

  return {
    session,
    createdNew: true,
    entryMode: 'created',
    redirectTo: buildCheckoutRedirectTo(session.id, 'created'),
  }
}
