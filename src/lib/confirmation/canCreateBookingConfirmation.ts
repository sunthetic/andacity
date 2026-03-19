import type { BookingRun } from "~/types/booking";
import { getBookingConfirmationForBookingRun } from "~/lib/confirmation/getBookingConfirmationForBookingRun";

export type CreateBookingConfirmationEligibilityResult =
  | {
      ok: true;
      code: "BOOKING_RUN_CONFIRMABLE";
      message: string;
    }
  | {
      ok: false;
      code:
        | "BOOKING_RUN_NOT_FOUND"
        | "BOOKING_RUN_NOT_CONFIRMABLE"
        | "CONFIRMATION_ALREADY_EXISTS";
      message: string;
    };

const isBookingRunConfirmable = (bookingRun: BookingRun) => {
  return (
    bookingRun.status === "succeeded" ||
    bookingRun.status === "partial" ||
    bookingRun.summary?.overallStatus === "succeeded" ||
    bookingRun.summary?.overallStatus === "partial" ||
    bookingRun.summary?.overallStatus === "requires_manual_review"
  );
};

export const canCreateBookingConfirmation = async (input: {
  bookingRun: BookingRun | null;
  allowExisting?: boolean;
}): Promise<CreateBookingConfirmationEligibilityResult> => {
  if (!input.bookingRun) {
    return {
      ok: false,
      code: "BOOKING_RUN_NOT_FOUND",
      message: "Booking run could not be found.",
    };
  }

  if (!isBookingRunConfirmable(input.bookingRun)) {
    return {
      ok: false,
      code: "BOOKING_RUN_NOT_CONFIRMABLE",
      message:
        "Booking run has not reached a confirmation-ready state yet.",
    };
  }

  const existing = await getBookingConfirmationForBookingRun(input.bookingRun.id);
  if (existing && !input.allowExisting) {
    return {
      ok: false,
      code: "CONFIRMATION_ALREADY_EXISTS",
      message: "A booking confirmation already exists for this booking run.",
    };
  }

  return {
    ok: true,
    code: "BOOKING_RUN_CONFIRMABLE",
    message: existing
      ? "Booking confirmation can be resumed for this booking run."
      : "Booking confirmation can be created for this booking run.",
  };
};
