import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import type {
  CheckoutRevalidationSummary,
  CheckoutSessionSummary,
} from "~/types/checkout";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

export const fromRevalidationState = (input: {
  summary: CheckoutSessionSummary;
  revalidationSummary?: CheckoutRevalidationSummary | null;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  if (input.summary.status === "expired") {
    return buildRecoveryState({
      stage: "revalidation",
      reasonCode: "CHECKOUT_EXPIRED",
      metadata: {
        checkoutSessionId: input.summary.id,
        checkoutStatus: input.summary.status,
        tripId: input.summary.tripId,
        tripHref: input.summary.tripHref,
        ...input.metadata,
      },
    });
  }

  const revalidationSummary = input.revalidationSummary;
  if (!revalidationSummary) return null;
  if (input.summary.readinessState === "ready") return null;

  const metadata: RecoveryMetadata = {
    checkoutSessionId: input.summary.id,
    checkoutStatus: input.summary.status,
    tripId: input.summary.tripId,
    tripHref: input.summary.tripHref,
    blockingIssueCount: revalidationSummary.blockingIssueCount,
    priceChangeCount: revalidationSummary.priceChangeCount,
    unavailableCount: revalidationSummary.unavailableCount,
    failedCount: revalidationSummary.failedCount,
    ...input.metadata,
  };

  if (revalidationSummary.priceChangeCount > 0) {
    return buildRecoveryState({
      stage: "revalidation",
      reasonCode: "PRICE_CHANGED",
      metadata,
    });
  }

  if (revalidationSummary.unavailableCount > 0) {
    return buildRecoveryState({
      stage: "revalidation",
      reasonCode: "INVENTORY_UNAVAILABLE",
      metadata,
    });
  }

  if (
    revalidationSummary.failedCount > 0 ||
    revalidationSummary.blockingIssueCount > 0 ||
    input.summary.revalidationStatus === "failed"
  ) {
    return buildRecoveryState({
      stage: "revalidation",
      reasonCode: "REVALIDATION_FAILED",
      metadata,
    });
  }

  return null;
};
