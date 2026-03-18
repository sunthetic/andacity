import { getBookingEligibility } from "~/lib/booking/getBookingEligibility";

export const canCheckoutExecuteBooking = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
) => {
  const result = await getBookingEligibility(checkoutSessionId, options);
  return result.ok;
};
