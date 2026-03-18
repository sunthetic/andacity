import type {
  BookingAdapter,
  CreateBookingAdapterInput,
  CreateBookingAdapterResult,
} from "~/types/booking-adapter";

const buildStubBookingResult = (
  input: CreateBookingAdapterInput,
): CreateBookingAdapterResult => {
  const provider = input.provider;
  const providerBookingReference = `${provider}-booking-${input.bookingItemExecution.checkoutItemKey}`;
  const providerConfirmationCode = input.idempotencyKey.slice(-8).toUpperCase();

  return {
    status: "succeeded",
    provider,
    vertical: input.checkoutItem.vertical,
    providerBookingReference,
    providerConfirmationCode,
    message: "Booking recorded successfully.",
    requestSnapshot: {
      checkoutItemKey: input.bookingItemExecution.checkoutItemKey,
      checkoutSessionId: input.checkoutSession.id,
      paymentSessionId: input.paymentSession.id,
      inventoryId: input.checkoutItem.inventory.inventoryId,
      idempotencyKey: input.idempotencyKey,
    },
    responseSnapshot: {
      provider,
      providerBookingReference,
      providerConfirmationCode,
      mode: "stub",
    },
    errorCode: null,
    errorMessage: null,
  };
};

const createStubBookingAdapter = (provider: string): BookingAdapter => ({
  provider,
  createBooking: async (input) => buildStubBookingResult(input),
});

export const BOOKING_ADAPTERS: Record<string, BookingAdapter> = {
  default: createStubBookingAdapter("default"),
};

export const getBookingAdapter = (provider: string | null | undefined) => {
  const normalizedProvider = String(provider || "")
    .trim()
    .toLowerCase();

  if (!normalizedProvider) {
    return BOOKING_ADAPTERS.default;
  }

  return (
    BOOKING_ADAPTERS[normalizedProvider] ||
    createStubBookingAdapter(normalizedProvider)
  );
};
