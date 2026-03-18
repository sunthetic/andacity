import {
  buildFailureResult,
  normalizeProviderBookingError,
} from "~/lib/providers/booking/shared";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";

export const mapFlightBookingError = (
  bookingInput: CreateProviderBookingInput,
  error: unknown,
  requestSnapshot: Record<string, unknown> | null = null,
  responseSnapshot: Record<string, unknown> | null = null,
) => {
  const normalized = normalizeProviderBookingError(
    error,
    "Flight booking failed at the provider boundary.",
  );

  return buildFailureResult({
    provider: bookingInput.provider,
    vertical: bookingInput.vertical,
    providerStatus: "flight_booking_failed",
    message: normalized.errorMessage,
    errorCode: normalized.errorCode,
    errorMessage: normalized.errorMessage,
    requestSnapshot,
    responseSnapshot,
    retryable: normalized.retryable,
  });
};
