import { getBookingRun } from "~/lib/booking/getBookingRun";
import { canCreateBookingConfirmation } from "~/lib/confirmation/canCreateBookingConfirmation";
import { createBookingConfirmation } from "~/lib/confirmation/createBookingConfirmation";
import { getBookingConfirmationForBookingRun } from "~/lib/confirmation/getBookingConfirmationForBookingRun";
import { isUniqueViolationError } from "~/lib/confirmation/shared";
import { getCheckoutSession } from "~/lib/checkout/getCheckoutSession";
import { getCheckoutPaymentSession } from "~/lib/payments/getCheckoutPaymentSession";
import { sendConfirmationLifecycleNotifications } from "~/fns/notifications/sendConfirmationLifecycleNotifications";

export const createOrResumeBookingConfirmation = async (
  bookingRunId: string,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const existing = await getBookingConfirmationForBookingRun(bookingRunId);
  if (existing) {
    try {
      await sendConfirmationLifecycleNotifications(existing);
    } catch {
      // Notifications are downstream side-effects and must never block confirmation retrieval.
    }

    return {
      confirmation: existing,
      created: false,
    };
  }

  const bookingRun = await getBookingRun(bookingRunId);
  const eligibility = await canCreateBookingConfirmation({
    bookingRun,
    allowExisting: true,
  });
  if (!eligibility.ok || !bookingRun) {
    throw new Error(eligibility.message);
  }

  const checkoutSession = await getCheckoutSession(bookingRun.checkoutSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });
  if (!checkoutSession) {
    throw new Error(
      "Checkout session could not be found while creating confirmation.",
    );
  }

  const paymentSession = await getCheckoutPaymentSession(bookingRun.paymentSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });
  if (!paymentSession) {
    throw new Error(
      "Payment session could not be found while creating confirmation.",
    );
  }

  try {
    const confirmation = await createBookingConfirmation({
      bookingRun,
      checkoutSession,
      paymentSession,
      now: options.now,
    });
    try {
      await sendConfirmationLifecycleNotifications(confirmation);
    } catch {
      // Notification delivery failures should not block confirmation persistence.
    }

    return {
      confirmation,
      created: true,
    };
  } catch (error) {
    if (isUniqueViolationError(error)) {
      const resumed = await getBookingConfirmationForBookingRun(bookingRunId);
      if (resumed) {
        try {
          await sendConfirmationLifecycleNotifications(resumed);
        } catch {
          // Duplicate reconciliation should stay non-blocking for notification retries.
        }

        return {
          confirmation: resumed,
          created: false,
        };
      }
    }

    throw error;
  }
};
