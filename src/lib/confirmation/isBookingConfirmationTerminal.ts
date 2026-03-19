import type { BookingConfirmationStatus } from "~/types/confirmation";

export const isBookingConfirmationTerminal = (
  status: BookingConfirmationStatus,
) => {
  return status !== "pending";
};
