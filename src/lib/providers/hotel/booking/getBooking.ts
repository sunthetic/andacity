import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { buildStableConfirmationCode } from "~/lib/providers/booking/shared";
import type { GetProviderBookingInput } from "~/types/booking-adapter";

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const getHotelBooking = async (input: GetProviderBookingInput) => {
  const capabilities = getProviderCapabilities(input.provider);
  if (!capabilities.supportsBookingRead) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: input.providerBookingReference || null,
      providerConfirmationCode: null,
      providerStatus: "read_unavailable",
      message: "This hotel provider does not support booking retrieval.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage: "This hotel provider does not support booking retrieval.",
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
      supported: false,
    };
  }

  const providerBookingReference = toNullableText(input.providerBookingReference);
  if (!providerBookingReference) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: null,
      providerConfirmationCode: null,
      providerStatus: "missing_reference",
      message: "Hotel booking retrieval requires a provider reservation reference.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage:
        "Hotel booking retrieval requires a provider reservation reference.",
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
      supported: true,
    };
  }

  return {
    status: "succeeded" as const,
    provider: input.provider,
    vertical: input.vertical,
    providerBookingReference,
    providerConfirmationCode:
      toNullableText(input.responseSnapshot?.confirmationCode) ||
      buildStableConfirmationCode("H", providerBookingReference),
    providerStatus: "confirmed",
    message: "Hotel booking has been confirmed by the provider.",
    requestSnapshot: input.requestSnapshot || null,
    responseSnapshot: {
      ...(input.responseSnapshot || {}),
      reservationId: providerBookingReference,
      status: "confirmed",
    },
    errorCode: null,
    errorMessage: null,
    requiresManualReview: false,
    retryable: false,
    latestResolvedInventory: null,
    supported: true,
  };
};
