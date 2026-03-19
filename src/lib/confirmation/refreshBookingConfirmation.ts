import { getLatestBookingRunForCheckout } from "~/lib/booking/getBookingRun";
import { canCreateBookingConfirmation } from "~/lib/confirmation/canCreateBookingConfirmation";
import { createOrResumeBookingConfirmation } from "~/lib/confirmation/createOrResumeBookingConfirmation";
import { getBookingConfirmationForBookingRun } from "~/lib/confirmation/getBookingConfirmationForBookingRun";

export const refreshBookingConfirmation = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | null;
  } = {},
) => {
  const bookingRun = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });
  if (!bookingRun) return null;

  const existing = await getBookingConfirmationForBookingRun(bookingRun.id);
  if (existing) return existing;

  const eligibility = await canCreateBookingConfirmation({
    bookingRun,
    allowExisting: true,
  });
  if (!eligibility.ok) return null;

  const result = await createOrResumeBookingConfirmation(bookingRun.id, options);
  return result.confirmation;
};
