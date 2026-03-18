import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { buildStableConfirmationCode } from "~/lib/providers/booking/shared";
import type { GetProviderBookingInput } from "~/types/booking-adapter";

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const getFlightBooking = async (input: GetProviderBookingInput) => {
  const capabilities = getProviderCapabilities(input.provider);
  if (!capabilities.supportsBookingRead) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: input.providerBookingReference || null,
      providerConfirmationCode: null,
      providerStatus: "read_unavailable",
      message: "This flight provider does not support booking retrieval.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage: "This flight provider does not support booking retrieval.",
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
      message: "Flight booking retrieval requires a provider booking reference.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage: "Flight booking retrieval requires a provider booking reference.",
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
      toNullableText(input.responseSnapshot?.recordLocator) ||
      buildStableConfirmationCode("F", providerBookingReference),
    providerStatus: "ticketed",
    message: "Flight booking remains confirmed.",
    requestSnapshot: input.requestSnapshot || null,
    responseSnapshot: {
      ...(input.responseSnapshot || {}),
      bookingId: providerBookingReference,
      status: "ticketed",
    },
    errorCode: null,
    errorMessage: null,
    requiresManualReview: false,
    retryable: false,
    latestResolvedInventory: null,
    supported: true,
  };
};
