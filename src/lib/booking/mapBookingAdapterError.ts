import type { BookingErrorCode } from "~/types/booking";
import { BOOKING_ERROR_CODES } from "~/types/booking";

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
  if (BOOKING_ERROR_CODES.includes(token as BookingErrorCode)) {
    return {
      errorCode: token as BookingErrorCode,
      errorMessage:
        (source?.message && String(source.message).trim()) ||
        "Booking could not be completed.",
    };
  }

  const message =
    (source?.message && String(source.message).trim()) ||
    (error instanceof Error && error.message.trim()) ||
    "Booking could not be completed.";

  if (token.includes("UNSUPPORTED")) {
    return {
      errorCode: "UNSUPPORTED_PROVIDER",
      errorMessage: message,
    };
  }

  if (token.includes("READ") || token.includes("RETRIEV")) {
    return {
      errorCode: "READ_UNAVAILABLE",
      errorMessage: message,
    };
  }

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

  if (
    token.includes("TRAVELER") ||
    token.includes("PASSENGER") ||
    token.includes("VALIDATION")
  ) {
    return {
      errorCode: "VALIDATION_ERROR",
      errorMessage: message,
    };
  }

  if (token.includes("PAYMENT") || token.includes("DECLIN")) {
    return {
      errorCode: "PAYMENT_DECLINED",
      errorMessage: message,
    };
  }

  if (token.includes("TIMEOUT")) {
    return {
      errorCode: "TIMEOUT",
      errorMessage: message,
    };
  }

  if (token.includes("PROVIDER") || token.includes("CONFIG")) {
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
