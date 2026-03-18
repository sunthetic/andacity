import type { CheckoutEntryErrorCode } from "~/types/checkout";

type CheckoutEntryErrorMessageOptions = {
  detail?: string | null;
  tripReference?: string | null;
  tripIdParam?: string | number | null;
};

export const getCheckoutEntryErrorMessage = (
  code: CheckoutEntryErrorCode,
  options: CheckoutEntryErrorMessageOptions = {},
) => {
  const tripReference = String(options.tripReference || "").trim();
  const tripIdParam = String(options.tripIdParam || "").trim();

  if (code === "TRIP_NOT_FOUND") {
    if (tripReference) {
      return `${tripReference} could not be loaded. Return to your trips and start checkout again.`;
    }

    if (tripIdParam) {
      return `Trip ${tripIdParam} could not be loaded. Return to your trips and start checkout again.`;
    }

    return "No active trip is available to move into checkout yet.";
  }

  if (code === "TRIP_EMPTY") {
    return "This trip needs at least one saved item before checkout can start.";
  }

  if (code === "TRIP_INVALID") {
    return (
      String(options.detail || "").trim() ||
      "This trip is missing one or more saved details required to start checkout."
    );
  }

  if (code === "CHECKOUT_RESUME_FAILED") {
    return (
      String(options.detail || "").trim() ||
      "We couldn't resume your current checkout session right now. Return to the trip and try again."
    );
  }

  return (
    String(options.detail || "").trim() ||
    "We couldn't start checkout from this trip right now. Return to the trip and try again."
  );
};
