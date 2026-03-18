import { getBookingAdapter } from "~/lib/booking/adapters/index";
import type { CreateBookingAdapterInput } from "~/types/booking-adapter";

export const createBooking = async (input: CreateBookingAdapterInput) => {
  const adapter = getBookingAdapter(input.provider);

  if (!adapter) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: null,
      providerConfirmationCode: null,
      providerStatus: "unsupported_provider",
      message: `Booking provider "${input.provider}" is not supported.`,
      requestSnapshot: null,
      responseSnapshot: {
        provider: input.provider,
        providerStatus: "unsupported_provider",
      },
      errorCode: "UNSUPPORTED_PROVIDER" as const,
      errorMessage: `Booking provider "${input.provider}" is not supported.`,
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
    };
  }

  return adapter.createBooking(input);
};
