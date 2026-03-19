import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import type { CheckoutPaymentSummary } from "~/types/payment";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

export const fromPaymentState = (input: {
  paymentSummary: CheckoutPaymentSummary;
  checkoutSessionId?: string | null;
  tripHref?: string | null;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  const summary = input.paymentSummary;
  const metadata: RecoveryMetadata = {
    checkoutSessionId: input.checkoutSessionId || summary.checkoutSessionId,
    checkoutReady: summary.checkoutReady,
    tripHref: input.tripHref || null,
    paymentStatus: summary.status,
    ...input.metadata,
  };

  if (!summary.checkoutReady) {
    const blockedReason = String(summary.blockedReason || "").toLowerCase();
    return buildRecoveryState({
      stage: "payment",
      reasonCode:
        blockedReason.includes("expired")
          ? "CHECKOUT_EXPIRED"
          : blockedReason.includes("traveler") &&
              blockedReason.includes("invalid")
            ? "CHECKOUT_TRAVELERS_INVALID"
            : blockedReason.includes("traveler") &&
                (blockedReason.includes("assignment") ||
                  blockedReason.includes("passenger"))
              ? "TRAVELER_ASSIGNMENT_MISMATCH"
              : blockedReason.includes("traveler")
                ? "CHECKOUT_TRAVELERS_INCOMPLETE"
          : "CHECKOUT_NOT_READY",
      metadata,
    });
  }

  if (summary.fingerprintMatchesCheckout === false) {
    return buildRecoveryState({
      stage: "payment",
      reasonCode: "PAYMENT_SESSION_STALE",
      metadata,
    });
  }

  if (
    summary.status === "failed" ||
    summary.status === "canceled" ||
    summary.status === "expired"
  ) {
    return buildRecoveryState({
      stage: "payment",
      reasonCode: "PAYMENT_FAILED",
      metadata,
    });
  }

  if (
    summary.status === "requires_action" ||
    summary.status === "draft" ||
    summary.status === "pending"
  ) {
    return buildRecoveryState({
      stage: "payment",
      reasonCode: "PAYMENT_REQUIRES_ACTION",
      metadata,
    });
  }

  return null;
};
