import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import { buildBookingConfirmationSummary } from "~/lib/confirmation/buildBookingConfirmationSummary";
import type { BookingConfirmation } from "~/types/confirmation";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

export const fromConfirmationState = (input: {
  confirmation: BookingConfirmation | null;
  bookingStatus?: string | null;
  tripHref?: string | null;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  const confirmation = input.confirmation;
  if (!confirmation) {
    if (
      input.bookingStatus === "partial" ||
      input.bookingStatus === "requires_manual_review" ||
      input.bookingStatus === "succeeded"
    ) {
      return buildRecoveryState({
        stage: "confirmation",
        reasonCode: "CONFIRMATION_FAILED",
        metadata: {
          tripHref: input.tripHref || null,
          bookingStatus: input.bookingStatus || null,
          ...input.metadata,
        },
      });
    }

    return null;
  }

  const summary =
    confirmation.summaryJson || buildBookingConfirmationSummary(confirmation);
  const metadata: RecoveryMetadata = {
    tripId: confirmation.tripId,
    tripHref: input.tripHref || `/trips/${confirmation.tripId}`,
    confirmationRef: confirmation.publicRef,
    confirmationHref: `/confirmation/${confirmation.publicRef}`,
    bookingStatus: input.bookingStatus || null,
    failedCount: summary.failedItemCount,
    manualReviewCount: summary.requiresManualReviewCount,
    hasConfirmedItems: summary.confirmedItemCount > 0,
    ...input.metadata,
  };

  if (confirmation.status === "failed") {
    return buildRecoveryState({
      stage: "confirmation",
      reasonCode: "CONFIRMATION_FAILED",
      metadata,
    });
  }

  if (confirmation.status === "pending") {
    return buildRecoveryState({
      stage: "confirmation",
      reasonCode: "CONFIRMATION_PENDING",
      metadata,
    });
  }

  if (confirmation.status === "partial") {
    return buildRecoveryState({
      stage: "confirmation",
      reasonCode: "BOOKING_PARTIAL",
      metadata,
    });
  }

  if (confirmation.status === "requires_manual_review") {
    return buildRecoveryState({
      stage: "confirmation",
      reasonCode: "BOOKING_REQUIRES_MANUAL_REVIEW",
      metadata,
    });
  }

  const notificationStatus = String(metadata.notificationStatus || "")
    .trim()
    .toLowerCase();
  if (notificationStatus === "failed" || notificationStatus === "skipped") {
    return buildRecoveryState({
      stage: "confirmation",
      reasonCode: "NOTIFICATION_FAILED",
      metadata,
    });
  }

  return null;
};
