import type {
  RecoveryActionType,
  RecoveryMetadata,
  RecoveryStage,
} from "~/types/recovery";

export const canRetryTransactionAction = (input: {
  actionType: RecoveryActionType;
  stage: RecoveryStage;
  metadata?: RecoveryMetadata;
}) => {
  const metadata = input.metadata || {};
  const checkoutStatus = String(metadata.checkoutStatus || "").trim();
  const paymentStatus = String(metadata.paymentStatus || "").trim();
  const bookingStatus = String(metadata.bookingStatus || "").trim();

  if (input.actionType === "retry" || input.actionType === "revalidate") {
    if (checkoutStatus === "expired" || checkoutStatus === "completed") {
      return false;
    }
  }

  if (input.actionType === "complete_travelers") {
    if (!metadata.checkoutSessionId) {
      return false;
    }
    if (checkoutStatus === "expired" || checkoutStatus === "completed") {
      return false;
    }
  }

  if (input.actionType === "resume_payment") {
    if (checkoutStatus === "expired" || metadata.checkoutReady === false) {
      return false;
    }
  }

  if (input.actionType === "resume_booking") {
    if (
      checkoutStatus === "expired" ||
      (paymentStatus &&
        paymentStatus !== "authorized" &&
        paymentStatus !== "succeeded")
    ) {
      return false;
    }
  }

  if (input.stage === "confirmation" && input.actionType === "retry") {
    if (
      bookingStatus &&
      bookingStatus !== "succeeded" &&
      bookingStatus !== "partial" &&
      bookingStatus !== "requires_manual_review"
    ) {
      return false;
    }
  }

  if (input.stage === "itinerary" && input.actionType === "retry") {
    if (!metadata.confirmationRef && !metadata.hasConfirmedItems) {
      return false;
    }
  }

  return true;
};
