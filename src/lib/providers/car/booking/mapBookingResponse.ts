import { summarizeResolvedInventory } from "~/lib/providers/booking/shared";
import type {
  CreateProviderBookingInput,
  CreateProviderBookingResult,
} from "~/types/booking-adapter";
import type { ResolvedInventoryRecord } from "~/types/inventory";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const mapCarBookingResponse = (input: {
  bookingInput: CreateProviderBookingInput;
  requestSnapshot: Record<string, unknown> | null;
  response: Record<string, unknown>;
  latestResolvedInventory: ResolvedInventoryRecord | null;
}): CreateProviderBookingResult => {
  const payload = isRecord(input.response) ? input.response : {};
  const providerStatus = toNullableText(payload.status);
  const status =
    providerStatus === "confirmed"
      ? "succeeded"
      : providerStatus?.includes("review")
        ? "requires_manual_review"
        : providerStatus?.includes("pending")
          ? "pending"
          : "failed";
  const message =
    toNullableText(payload.message) ||
    (status === "requires_manual_review"
      ? "Car booking needs manual review before it can be treated as final."
      : status === "succeeded"
        ? "Car booking confirmed with the provider."
        : "Car booking could not be confirmed.");

  return {
    status,
    provider: input.bookingInput.provider,
    vertical: input.bookingInput.vertical,
    providerBookingReference: toNullableText(payload.reservationId),
    providerConfirmationCode: toNullableText(payload.confirmationCode),
    providerStatus,
    message,
    requestSnapshot: input.requestSnapshot,
    responseSnapshot: {
      ...payload,
      providerStatus,
    },
    errorCode:
      status === "failed"
        ? "UNKNOWN_PROVIDER_ERROR"
        : status === "requires_manual_review"
          ? "VALIDATION_ERROR"
          : null,
    errorMessage:
      status === "failed" || status === "requires_manual_review" ? message : null,
    requiresManualReview: status === "requires_manual_review",
    retryable: false,
    latestResolvedInventory: summarizeResolvedInventory(
      input.latestResolvedInventory,
    ),
  };
};
