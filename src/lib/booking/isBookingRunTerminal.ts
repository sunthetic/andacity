import type { BookingRunStatus } from "~/types/booking";

export const isBookingRunTerminal = (status: BookingRunStatus) => {
  return (
    status === "partial" ||
    status === "succeeded" ||
    status === "failed" ||
    status === "canceled"
  );
};
