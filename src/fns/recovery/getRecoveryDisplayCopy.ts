import type {
  RecoveryMetadata,
  RecoveryReasonCode,
  RecoverySeverity,
  RecoveryStage,
} from "~/types/recovery";

const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const buildRevalidationMessage = (metadata: RecoveryMetadata) => {
  const priceChangeCount = Number(metadata.priceChangeCount || 0);
  const unavailableCount = Number(metadata.unavailableCount || 0);
  const failedCount = Number(metadata.failedCount || 0);
  const parts = [
    priceChangeCount > 0
      ? pluralize(priceChangeCount, "price changed item")
      : null,
    unavailableCount > 0
      ? pluralize(unavailableCount, "unavailable item")
      : null,
    failedCount > 0
      ? pluralize(failedCount, "item failed to revalidate")
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  if (!parts.length) {
    return "One or more items changed before checkout could continue.";
  }

  return `${parts.join(", ")}. Review the latest trip state before continuing checkout.`;
};

export const getRecoveryDisplayCopy = (input: {
  stage: RecoveryStage;
  reasonCode: RecoveryReasonCode;
  metadata?: RecoveryMetadata;
}): {
  severity: RecoverySeverity;
  title: string;
  message: string;
  isTerminal: boolean;
} => {
  const metadata = input.metadata || {};

  switch (input.reasonCode) {
    case "TRIP_EMPTY":
      return {
        severity: "warning",
        title: "Your trip is still empty",
        message:
          "Add at least one saved flight, stay, or car before starting checkout.",
        isTerminal: false,
      };
    case "TRIP_NOT_FOUND":
      return {
        severity: "error",
        title: "Trip not found",
        message:
          "We could not find the trip that checkout was trying to use. Return to your saved trips and reopen the latest record.",
        isTerminal: false,
      };
    case "TRIP_INVALID":
      return {
        severity: "error",
        title: "Trip details need attention",
        message:
          "This trip cannot enter checkout yet. Review the saved trip and resolve any missing inventory or pricing details first.",
        isTerminal: false,
      };
    case "CHECKOUT_EXPIRED":
      return {
        severity: "warning",
        title: "Checkout expired",
        message:
          "This checkout snapshot is no longer valid. Return to your trip to create a fresh, server-backed checkout session.",
        isTerminal: true,
      };
    case "CHECKOUT_NOT_FOUND":
      return {
        severity: "error",
        title: "Checkout unavailable",
        message:
          "We could not load this checkout session from persisted state.",
        isTerminal: true,
      };
    case "CHECKOUT_NOT_READY":
      return {
        severity: "warning",
        title: "Checkout is not ready",
        message:
          "Checkout must pass the latest pricing and availability checks before payment or booking can continue.",
        isTerminal: false,
      };
    case "CHECKOUT_TRAVELERS_INCOMPLETE":
      return {
        severity: "warning",
        title: "Traveler details are still incomplete",
        message:
          "Complete and assign the required traveler details before payment or booking can continue.",
        isTerminal: false,
      };
    case "CHECKOUT_TRAVELERS_INVALID":
      return {
        severity: "error",
        title: "Traveler details need correction",
        message:
          "One or more traveler fields are invalid. Fix traveler details to continue safely.",
        isTerminal: false,
      };
    case "TRAVELER_ASSIGNMENT_MISMATCH":
      return {
        severity: "warning",
        title: "Traveler assignments need attention",
        message:
          "Traveler assignments do not match checkout item requirements yet.",
        isTerminal: false,
      };
    case "CHECKOUT_CREATE_FAILED":
      return {
        severity: "error",
        title: "Checkout could not be started",
        message:
          "We could not create a fresh checkout snapshot from this trip right now.",
        isTerminal: false,
      };
    case "CHECKOUT_RESUME_FAILED":
      return {
        severity: "error",
        title: "Checkout could not be resumed",
        message:
          "We found a prior checkout path but could not safely resume it. Return to your trip and start again.",
        isTerminal: false,
      };
    case "REVALIDATION_FAILED":
      return {
        severity: "warning",
        title: "Revalidation needs attention",
        message: buildRevalidationMessage(metadata),
        isTerminal: false,
      };
    case "PRICE_CHANGED":
      return {
        severity: "warning",
        title: "Pricing changed before checkout continued",
        message:
          "Review the latest trip totals and rerun checkout verification before moving on to payment.",
        isTerminal: false,
      };
    case "INVENTORY_UNAVAILABLE":
      return {
        severity: "error",
        title: "An item is no longer available",
        message:
          "At least one saved item can no longer be booked from this checkout snapshot. Return to your trip to review alternatives.",
        isTerminal: false,
      };
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return {
        severity: "error",
        title: "Payment is temporarily unavailable",
        message:
          "The payment provider could not initialize or refresh this session safely. Try again shortly from the same checkout.",
        isTerminal: false,
      };
    case "PAYMENT_FAILED":
      return {
        severity: "error",
        title: "Payment did not complete",
        message:
          "Your payment session was not authorized. Retry payment from the current checkout totals or return to your trip if the snapshot has changed.",
        isTerminal: false,
      };
    case "PAYMENT_REQUIRES_ACTION":
      return {
        severity: "info",
        title: "Payment still needs action",
        message:
          "Finish entering payment details or complete any required authentication before booking can continue.",
        isTerminal: false,
      };
    case "PAYMENT_SESSION_STALE":
      return {
        severity: "warning",
        title: "Payment session is out of date",
        message:
          "This payment session belongs to older checkout totals and should be recreated from the latest revalidated snapshot.",
        isTerminal: false,
      };
    case "BOOKING_PARTIAL":
      return {
        severity: "warning",
        title: "Booking only completed in part",
        message:
          "Some items were booked successfully while others still need follow-up. Confirmed records remain available.",
        isTerminal: false,
      };
    case "BOOKING_FAILED":
      return {
        severity: "error",
        title: "Booking did not finish",
        message:
          "The current booking run did not complete for every item. Review what succeeded before retrying or returning to the trip.",
        isTerminal: false,
      };
    case "BOOKING_REQUIRES_MANUAL_REVIEW":
      return {
        severity: "warning",
        title: "Booking needs manual review",
        message:
          "At least one item needs manual follow-up. Confirmed details stay available while the remaining items are reviewed.",
        isTerminal: false,
      };
    case "CONFIRMATION_PENDING":
      return {
        severity: "info",
        title: "Confirmation is still settling",
        message:
          "Some booking results are still being persisted. Reloading or refreshing will keep showing the latest saved state.",
        isTerminal: false,
      };
    case "CONFIRMATION_FAILED":
      return {
        severity: "error",
        title: "Confirmation could not be completed",
        message:
          "We could not create or refresh the durable confirmation record for this booking state right now.",
        isTerminal: false,
      };
    case "ITINERARY_CREATE_FAILED":
      return {
        severity: "warning",
        title: "Itinerary creation needs another attempt",
        message:
          "Your confirmation is still saved, but the durable itinerary record could not be created yet. Retry itinerary creation without rerunning booking.",
        isTerminal: false,
      };
    case "NOTIFICATION_FAILED":
      return {
        severity: "info",
        title: "Notification delivery needs another attempt",
        message:
          "The booking record is saved, but outbound delivery failed or was skipped. You can resend the notification from this page.",
        isTerminal: false,
      };
    case "UNKNOWN_TRANSACTION_ERROR":
    default:
      return {
        severity: "error",
        title: "Something went wrong in this booking flow",
        message:
          metadata.rawMessage && String(metadata.rawMessage).trim()
            ? String(metadata.rawMessage).trim()
            : "We could not complete the requested step safely. Retry from the latest persisted state.",
        isTerminal: false,
      };
  }
};
