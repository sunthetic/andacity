import { getItineraryForConfirmation } from "~/lib/itinerary/getItineraryForConfirmation";
import type { BookingConfirmation } from "~/types/confirmation";

export type CreateItineraryEligibilityResult =
  | {
      ok: true;
      code: "ITINERARY_CREATABLE";
      message: string;
    }
  | {
      ok: false;
      code:
        | "CONFIRMATION_NOT_FOUND"
        | "CONFIRMATION_NOT_OWNABLE"
        | "ITINERARY_ALREADY_EXISTS";
      message: string;
    };

const hasConfirmedItems = (confirmation: BookingConfirmation) => {
  return confirmation.items.some((item) => item.status === "confirmed");
};

const isOwnable = (confirmation: BookingConfirmation) => {
  if (confirmation.status === "confirmed" || confirmation.status === "partial") {
    return hasConfirmedItems(confirmation);
  }

  if (confirmation.status === "requires_manual_review") {
    return hasConfirmedItems(confirmation);
  }

  return false;
};

export const canCreateItineraryFromConfirmation = async (input: {
  confirmation: BookingConfirmation | null;
  allowExisting?: boolean;
}): Promise<CreateItineraryEligibilityResult> => {
  if (!input.confirmation) {
    return {
      ok: false,
      code: "CONFIRMATION_NOT_FOUND",
      message: "Booking confirmation could not be found.",
    };
  }

  if (!isOwnable(input.confirmation)) {
    return {
      ok: false,
      code: "CONFIRMATION_NOT_OWNABLE",
      message:
        "This confirmation does not contain confirmed owned items yet.",
    };
  }

  const existing = await getItineraryForConfirmation(input.confirmation.id);
  if (existing && !input.allowExisting) {
    return {
      ok: false,
      code: "ITINERARY_ALREADY_EXISTS",
      message: "A durable itinerary already exists for this confirmation.",
    };
  }

  return {
    ok: true,
    code: "ITINERARY_CREATABLE",
    message: existing
      ? "Existing durable itinerary can be resumed for this confirmation."
      : "A durable itinerary can be created from this confirmation.",
  };
};

