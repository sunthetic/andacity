import { getBookingRun } from "~/lib/booking/getBookingRun";
import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { getCheckoutSession } from "~/lib/checkout/getCheckoutSession";
import { createItineraryFromConfirmation } from "~/lib/itinerary/createItineraryFromConfirmation";
import { canCreateItineraryFromConfirmation } from "~/lib/itinerary/canCreateItineraryFromConfirmation";
import { getItineraryForConfirmation } from "~/lib/itinerary/getItineraryForConfirmation";
import { isUniqueViolationError } from "~/lib/itinerary/shared";
import { createOrResumeItineraryOwnership } from "~/lib/ownership/createOrResumeItineraryOwnership";
import { getCheckoutPaymentSession } from "~/lib/payments/getCheckoutPaymentSession";
import { sendItineraryLifecycleNotifications } from "~/fns/notifications/sendItineraryLifecycleNotifications";

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
    createOrResumeItineraryOwnership?: typeof createOrResumeItineraryOwnership;
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
  const createOrResumeOwnership =
    deps.createOrResumeItineraryOwnership || createOrResumeItineraryOwnership;

  const existing = await getExistingItinerary(confirmationId);
  if (existing) {
    const ownershipResult = await createOrResumeOwnership({
      itineraryId: existing.id,
      ownerUserId: options.ownerUserId ?? null,
      ownerSessionId: options.ownerSessionId ?? null,
      source: "confirmation_flow",
      now: options.now,
    });
    const hydrated = await getExistingItinerary(confirmationId);
    const resolvedItinerary = hydrated || existing;
    try {
      await sendItineraryLifecycleNotifications(resolvedItinerary);
    } catch {
      // Itinerary retrieval should not fail if outbound notification delivery fails.
    }

    return {
      itinerary: resolvedItinerary,
      created: false,
      ownership: ownershipResult.ownership,
      claimToken: ownershipResult.claimToken,
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
    const created = await createItinerary({
      confirmation,
      bookingRun,
      checkoutSession,
      paymentSession,
      ownerUserId: options.ownerUserId ?? null,
      ownerSessionId: options.ownerSessionId ?? null,
      now: options.now,
    });
    try {
      await sendItineraryLifecycleNotifications(created.itinerary);
    } catch {
      // Itinerary creation is canonical; notifications are downstream and non-blocking.
    }

    return {
      itinerary: created.itinerary,
      created: true,
      ownership: created.ownership,
      claimToken: created.claimToken,
    };
  } catch (error) {
    if (isUniqueViolationError(error)) {
      const resumed = await getExistingItinerary(confirmationId);
      if (resumed) {
        const ownershipResult = await createOrResumeOwnership({
          itineraryId: resumed.id,
          ownerUserId: options.ownerUserId ?? null,
          ownerSessionId: options.ownerSessionId ?? null,
          source: "confirmation_flow",
          now: options.now,
        });
        try {
          await sendItineraryLifecycleNotifications(resumed);
        } catch {
          // Duplicate conflict recovery should not block itinerary access.
        }
        return {
          itinerary: resumed,
          created: false,
          ownership: ownershipResult.ownership,
          claimToken: ownershipResult.claimToken,
        };
      }
    }

    throw error;
  }
};
