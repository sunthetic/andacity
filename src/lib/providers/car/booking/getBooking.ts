import { getProviderCapabilities } from "~/lib/providers/getProviderCapabilities";
import { buildStableConfirmationCode } from "~/lib/providers/booking/shared";
import type { GetProviderBookingInput } from "~/types/booking-adapter";

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const getCarBooking = async (input: GetProviderBookingInput) => {
  const capabilities = getProviderCapabilities(input.provider);
  if (!capabilities.supportsBookingRead) {
    return {
      status: "failed" as const,
      provider: input.provider,
      vertical: input.vertical,
      providerBookingReference: input.providerBookingReference || null,
      providerConfirmationCode: null,
      providerStatus: "read_unavailable",
      message: "This car provider does not support booking retrieval.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage: "This car provider does not support booking retrieval.",
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
      message: "Car booking retrieval requires a provider reservation reference.",
      requestSnapshot: input.requestSnapshot || null,
      responseSnapshot: input.responseSnapshot || null,
      errorCode: "READ_UNAVAILABLE" as const,
      errorMessage:
        "Car booking retrieval requires a provider reservation reference.",
      requiresManualReview: false,
      retryable: false,
      latestResolvedInventory: null,
      supported: true,
    };
  }

  const requiresManualReview =
    input.responseSnapshot?.status === "requires_counter_review";

  return {
    status: requiresManualReview
      ? ("requires_manual_review" as const)
      : ("succeeded" as const),
    provider: input.provider,
    vertical: input.vertical,
    providerBookingReference,
    providerConfirmationCode: requiresManualReview
      ? null
      : toNullableText(input.responseSnapshot?.confirmationCode) ||
        buildStableConfirmationCode("C", providerBookingReference),
    providerStatus: requiresManualReview
      ? "requires_counter_review"
      : "confirmed",
    message: requiresManualReview
      ? "Car booking still needs manual review for counter-side requirements."
      : "Car booking remains confirmed.",
    requestSnapshot: input.requestSnapshot || null,
    responseSnapshot: {
      ...(input.responseSnapshot || {}),
      reservationId: providerBookingReference,
      status: requiresManualReview ? "requires_counter_review" : "confirmed",
    },
    errorCode: requiresManualReview ? ("VALIDATION_ERROR" as const) : null,
    errorMessage: requiresManualReview
      ? "Car booking still needs manual review for counter-side requirements."
      : null,
    requiresManualReview,
    retryable: false,
    latestResolvedInventory: null,
    supported: true,
  };
};
