import { getLatestBookingRunForCheckout } from "~/lib/booking/getBookingRun";
import { isBookingRunTerminal } from "~/lib/booking/isBookingRunTerminal";

export const getActiveBookingRunForCheckout = async (
  checkoutSessionId: string,
) => {
  const run = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });

  if (!run || isBookingRunTerminal(run.status)) {
    return null;
  }

  return run;
};
