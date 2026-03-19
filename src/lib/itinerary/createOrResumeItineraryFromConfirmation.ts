import { getBookingRun } from "~/lib/booking/getBookingRun";
import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { getCheckoutSession } from "~/lib/checkout/getCheckoutSession";
import { createItineraryFromConfirmation } from "~/lib/itinerary/createItineraryFromConfirmation";
import { canCreateItineraryFromConfirmation } from "~/lib/itinerary/canCreateItineraryFromConfirmation";
import { getItineraryForConfirmation } from "~/lib/itinerary/getItineraryForConfirmation";
import { isUniqueViolationError } from "~/lib/itinerary/shared";
import { getCheckoutPaymentSession } from "~/lib/payments/getCheckoutPaymentSession";

export const createOrResumeItineraryFromConfirmation = async (
  confirmationId: string,
  options: {
    now?: Date | string | null;
    ownerUserId?: string | null;
    ownerSessionId?: string | null;
  } = {},
  deps: {
    getItineraryForConfirmation?: typeof getItineraryForConfirmation;
    getBookingConfirmation?: typeof getBookingConfirmation;
    canCreateItineraryFromConfirmation?: typeof canCreateItineraryFromConfirmation;
    getBookingRun?: typeof getBookingRun;
    getCheckoutSession?: typeof getCheckoutSession;
    getCheckoutPaymentSession?: typeof getCheckoutPaymentSession;
    createItineraryFromConfirmation?: typeof createItineraryFromConfirmation;
  } = {},
) => {
  const getExistingItinerary =
    deps.getItineraryForConfirmation || getItineraryForConfirmation;
  const loadConfirmation = deps.getBookingConfirmation || getBookingConfirmation;
  const checkEligibility =
    deps.canCreateItineraryFromConfirmation || canCreateItineraryFromConfirmation;
  const loadBookingRun = deps.getBookingRun || getBookingRun;
  const loadCheckoutSession = deps.getCheckoutSession || getCheckoutSession;
  const loadPaymentSession =
    deps.getCheckoutPaymentSession || getCheckoutPaymentSession;
  const createItinerary =
    deps.createItineraryFromConfirmation || createItineraryFromConfirmation;

  const existing = await getExistingItinerary(confirmationId);
  if (existing) {
    return {
      itinerary: existing,
      created: false,
    };
  }

  const confirmation = await loadConfirmation(confirmationId);
  const eligibility = await checkEligibility({
    confirmation,
    allowExisting: true,
  });
  if (!eligibility.ok || !confirmation) {
    throw new Error(eligibility.message);
  }

  const bookingRun = await loadBookingRun(confirmation.bookingRunId);
  if (!bookingRun) {
    throw new Error(
      "Booking run could not be found while creating itinerary ownership.",
    );
  }

  const checkoutSession = await loadCheckoutSession(confirmation.checkoutSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });
  if (!checkoutSession) {
    throw new Error(
      "Checkout session could not be found while creating itinerary ownership.",
    );
  }

  const paymentSession = await loadPaymentSession(
    confirmation.paymentSessionId,
    {
      now: options.now ?? undefined,
      includeTerminal: true,
    },
  );
  if (!paymentSession) {
    throw new Error(
      "Payment session could not be found while creating itinerary ownership.",
    );
  }

  try {
    const itinerary = await createItinerary({
      confirmation,
      bookingRun,
      checkoutSession,
      paymentSession,
      ownerUserId: options.ownerUserId ?? null,
      ownerSessionId: options.ownerSessionId ?? null,
      now: options.now,
    });

    return {
      itinerary,
      created: true,
    };
  } catch (error) {
    if (isUniqueViolationError(error)) {
      const resumed = await getExistingItinerary(confirmationId);
      if (resumed) {
        return {
          itinerary: resumed,
          created: false,
        };
      }
    }

    throw error;
  }
};
