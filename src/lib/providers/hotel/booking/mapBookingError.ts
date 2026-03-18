import {
  buildFailureResult,
  normalizeProviderBookingError,
} from "~/lib/providers/booking/shared";
import type { CreateProviderBookingInput } from "~/types/booking-adapter";

export const mapHotelBookingError = (
  bookingInput: CreateProviderBookingInput,
  error: unknown,
  requestSnapshot: Record<string, unknown> | null = null,
  responseSnapshot: Record<string, unknown> | null = null,
) => {
  const normalized = normalizeProviderBookingError(
    error,
    "Hotel booking failed at the provider boundary.",
  );

  return buildFailureResult({
    provider: bookingInput.provider,
    vertical: bookingInput.vertical,
    providerStatus: "hotel_booking_failed",
    message: normalized.errorMessage,
    errorCode: normalized.errorCode,
    errorMessage: normalized.errorMessage,
    requestSnapshot,
    responseSnapshot,
    retryable: normalized.retryable,
  });
};
