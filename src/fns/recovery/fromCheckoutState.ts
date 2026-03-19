import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import type {
  CheckoutEntryErrorCode,
  CheckoutSessionSummary,
} from "~/types/checkout";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

const mapEntryErrorToReasonCode = (code: CheckoutEntryErrorCode) => {
  switch (code) {
    case "TRIP_EMPTY":
      return "TRIP_EMPTY";
    case "TRIP_NOT_FOUND":
      return "TRIP_NOT_FOUND";
    case "TRIP_INVALID":
      return "TRIP_INVALID";
    case "CHECKOUT_RESUME_FAILED":
      return "CHECKOUT_RESUME_FAILED";
    case "CHECKOUT_CREATE_FAILED":
    default:
      return "CHECKOUT_CREATE_FAILED";
  }
};

export const fromCheckoutState = (input: {
  summary?: CheckoutSessionSummary | null;
  entryErrorCode?: CheckoutEntryErrorCode | null;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  if (input.entryErrorCode) {
    return buildRecoveryState({
      stage: "checkout",
      reasonCode: mapEntryErrorToReasonCode(input.entryErrorCode),
      metadata: input.metadata,
    });
  }

  const summary = input.summary;
  if (!summary) return null;

  const metadata: RecoveryMetadata = {
    checkoutSessionId: summary.id,
    checkoutStatus: summary.status,
    tripId: summary.tripId,
    tripHref: summary.tripHref,
    blockingIssueCount: summary.blockingIssueCount,
    ...input.metadata,
  };

  if (summary.status === "expired") {
    return buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_EXPIRED",
      metadata,
    });
  }

  if (summary.status === "blocked" || summary.readinessState === "blocked") {
    return buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_NOT_READY",
      metadata,
    });
  }

  return null;
};
