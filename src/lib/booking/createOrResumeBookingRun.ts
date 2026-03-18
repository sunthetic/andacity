import { createBookingRun } from "~/lib/booking/createBookingRun";
import { getActiveBookingRunForCheckout } from "~/lib/booking/getActiveBookingRunForCheckout";
import { getBookingRunByExecutionKey } from "~/lib/booking/getBookingRun";
import { getCheckoutSession } from "~/lib/checkout/getCheckoutSession";
import {
  getLatestCheckoutPaymentSessionRow,
  mapCheckoutPaymentSessionRow,
} from "~/lib/payments/getCheckoutPaymentSession";

export const createOrResumeBookingRun = async (
  checkoutSessionId: string,
  executionKey: string,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const existing = await getBookingRunByExecutionKey(executionKey);
  if (existing) {
    return existing;
  }

  const active = await getActiveBookingRunForCheckout(checkoutSessionId);
  if (active) {
    return active;
  }

  const checkoutSession = await getCheckoutSession(checkoutSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });
  if (!checkoutSession) {
    throw new Error("Checkout session could not be found while creating booking.");
  }

  const latestPaymentRow = await getLatestCheckoutPaymentSessionRow(checkoutSessionId, {
    includeTerminal: true,
  });
  const paymentSession =
    latestPaymentRow ? mapCheckoutPaymentSessionRow(latestPaymentRow) : null;

  if (!paymentSession) {
    throw new Error("Payment session could not be found while creating booking.");
  }

  return createBookingRun({
    checkoutSession,
    paymentSession,
    executionKey,
    now: options.now,
  });
};
