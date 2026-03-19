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
    travelerValidationStatus: summary.travelerValidationStatus || null,
    travelerIssueCount: summary.travelerValidationSummary?.issueCount || 0,
    ...input.metadata,
  };

  if (summary.status === "expired") {
    return buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_EXPIRED",
      metadata,
    });
  }

  if (
    summary.hasCompleteTravelerDetails === false ||
    summary.status === "blocked" ||
    summary.readinessState === "blocked"
  ) {
    const travelerIssues = summary.travelerValidationSummary?.issues || [];
    const hasTravelerAssignmentMismatch = travelerIssues.some(
      (issue) =>
        issue.code === "PASSENGER_COUNT_MISMATCH" ||
        issue.code === "TRAVELER_ASSIGNMENT_MISSING" ||
        issue.code === "MISSING_PRIMARY_GUEST" ||
        issue.code === "MISSING_PRIMARY_DRIVER",
    );
    const hasTravelerInvalid = travelerIssues.some(
      (issue) =>
        issue.code === "INVALID_DATE_OF_BIRTH" ||
        issue.code === "INVALID_EMAIL" ||
        issue.code === "INVALID_PHONE" ||
        issue.code === "DOCUMENT_EXPIRED" ||
        issue.code === "DRIVER_AGE_INVALID",
    );
    const hasTravelerIncomplete = travelerIssues.some(
      (issue) =>
        issue.code === "MISSING_REQUIRED_FIELD" ||
        issue.code === "DOCUMENT_REQUIRED",
    );

    return buildRecoveryState({
      stage: "checkout",
      reasonCode:
        summary.hasCompleteTravelerDetails === false && hasTravelerInvalid
          ? "CHECKOUT_TRAVELERS_INVALID"
          : summary.hasCompleteTravelerDetails === false &&
              hasTravelerAssignmentMismatch
            ? "TRAVELER_ASSIGNMENT_MISMATCH"
            : summary.hasCompleteTravelerDetails === false && hasTravelerIncomplete
              ? "CHECKOUT_TRAVELERS_INCOMPLETE"
              : "CHECKOUT_NOT_READY",
      metadata,
    });
  }

  return null;
};
