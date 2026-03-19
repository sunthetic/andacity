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
    return buildRecoveryState({
      stage: "payment",
      reasonCode:
        summary.blockedReason &&
        summary.blockedReason.toLowerCase().includes("expired")
          ? "CHECKOUT_EXPIRED"
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
