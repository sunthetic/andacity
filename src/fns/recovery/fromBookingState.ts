import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

export const fromBookingState = (input: {
  bookingSummary: CheckoutBookingSummary;
  checkoutSessionId?: string | null;
  tripHref?: string | null;
  confirmationRef?: string | null;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  const summary = input.bookingSummary;
  const metadata: RecoveryMetadata = {
    checkoutSessionId: input.checkoutSessionId || summary.checkoutSessionId,
    bookingStatus: summary.status,
    tripHref: input.tripHref || null,
    confirmationRef: input.confirmationRef || null,
    failedCount: summary.run?.summary?.failedCount || 0,
    manualReviewCount: summary.run?.summary?.manualReviewCount || 0,
    ...input.metadata,
  };

  if (summary.status === "partial") {
    return buildRecoveryState({
      stage: "booking",
      reasonCode: "BOOKING_PARTIAL",
      metadata,
    });
  }

  if (summary.status === "requires_manual_review") {
    return buildRecoveryState({
      stage: "booking",
      reasonCode: "BOOKING_REQUIRES_MANUAL_REVIEW",
      metadata,
    });
  }

  if (summary.status === "failed") {
    return buildRecoveryState({
      stage: "booking",
      reasonCode: "BOOKING_FAILED",
      metadata,
    });
  }

  if (!summary.canExecute && summary.eligibilityCode === "CHECKOUT_EXPIRED") {
    return buildRecoveryState({
      stage: "booking",
      reasonCode: "CHECKOUT_EXPIRED",
      metadata,
    });
  }

  if (
    !summary.canExecute &&
    (summary.eligibilityCode === "CHECKOUT_NOT_READY" ||
      summary.eligibilityCode === "CHECKOUT_TRAVELERS_INCOMPLETE" ||
      summary.eligibilityCode === "PAYMENT_NOT_AUTHORIZED" ||
      summary.eligibilityCode === "PAYMENT_NOT_FOUND")
  ) {
    return buildRecoveryState({
      stage: "booking",
      reasonCode:
        summary.eligibilityCode === "CHECKOUT_TRAVELERS_INCOMPLETE"
          ? "CHECKOUT_TRAVELERS_INCOMPLETE"
          : "CHECKOUT_NOT_READY",
      metadata,
    });
  }

  return null;
};
