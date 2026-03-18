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

export const mapFlightBookingResponse = (input: {
  bookingInput: CreateProviderBookingInput;
  requestSnapshot: Record<string, unknown> | null;
  response: Record<string, unknown>;
  latestResolvedInventory: ResolvedInventoryRecord | null;
}): CreateProviderBookingResult => {
  const payload = isRecord(input.response) ? input.response : {};
  const providerStatus = toNullableText(payload.status);
  const status =
    providerStatus === "ticketed" || providerStatus === "confirmed"
      ? "succeeded"
      : providerStatus?.includes("pending")
        ? "pending"
        : providerStatus?.includes("review")
          ? "requires_manual_review"
          : "failed";
  const message =
    toNullableText(payload.message) ||
    (status === "succeeded"
      ? "Flight booking confirmed with the provider."
      : status === "pending"
        ? "Flight booking is awaiting provider confirmation."
        : "Flight booking could not be confirmed.");

  return {
    status,
    provider: input.bookingInput.provider,
    vertical: input.bookingInput.vertical,
    providerBookingReference: toNullableText(payload.bookingId),
    providerConfirmationCode: toNullableText(payload.recordLocator),
    providerStatus,
    message,
    requestSnapshot: input.requestSnapshot,
    responseSnapshot: {
      ...payload,
      providerStatus,
    },
    errorCode: status === "failed" ? "UNKNOWN_PROVIDER_ERROR" : null,
    errorMessage: status === "failed" ? message : null,
    requiresManualReview: status === "requires_manual_review",
    retryable: false,
    latestResolvedInventory: summarizeResolvedInventory(
      input.latestResolvedInventory,
    ),
  };
};
