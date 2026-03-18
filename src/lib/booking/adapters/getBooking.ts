import { getBookingAdapter } from "~/lib/booking/adapters/index";
import type { GetBookingAdapterInput } from "~/types/booking-adapter";

export const getBooking = async (input: GetBookingAdapterInput) => {
  const adapter = getBookingAdapter(input.provider);

  if (!adapter) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: input.providerBookingReference || null,
      providerConfirmationCode: null,
      providerStatus: "unsupported_provider",
      message: `Booking provider "${input.provider}" is not supported.`,
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "UNSUPPORTED_PROVIDER" as const,
      errorMessage: `Booking provider "${input.provider}" is not supported.`,
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
      supported: false,
    };
  }

  if (!adapter.getBooking) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: input.providerBookingReference || null,
      providerConfirmationCode: null,
      providerStatus: "read_unavailable",
      message: `Booking provider "${input.provider}" does not support booking reads.`,
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage: `Booking provider "${input.provider}" does not support booking reads.`,
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
      supported: false,
    };
  }

  return adapter.getBooking(input);
};
