import type { BookingErrorCode } from "~/types/booking";

const hasCode = (value: unknown): value is { code?: string; message?: string } =>
  Boolean(value) && typeof value === "object";

const normalizeToken = (value: unknown) =>
  String(value || "")
    .trim()
    .toUpperCase();

export const mapBookingAdapterError = (
  error: unknown,
): {
  errorCode: BookingErrorCode;
  errorMessage: string;
} => {
  const source = hasCode(error) ? error : null;
  const token = normalizeToken(source?.code);
  const message =
    (source?.message && String(source.message).trim()) ||
    (error instanceof Error && error.message.trim()) ||
    "Booking could not be completed.";

  if (token.includes("INVENTORY") || token.includes("UNAVAILABLE")) {
    return {
      errorCode: "INVENTORY_UNAVAILABLE",
      errorMessage: message,
    };
  }

  if (token.includes("PRICE") || token.includes("FARE")) {
    return {
      errorCode: "PRICE_MISMATCH",
      errorMessage: message,
    };
  }

  if (token.includes("TRAVELER") || token.includes("PASSENGER")) {
    return {
      errorCode: "TRAVELER_DATA_INVALID",
      errorMessage: message,
    };
  }

  if (token.includes("PROVIDER") || token.includes("TIMEOUT")) {
    return {
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: message,
    };
  }

  return {
    errorCode: "UNKNOWN_BOOKING_ERROR",
    errorMessage: message,
  };
};
