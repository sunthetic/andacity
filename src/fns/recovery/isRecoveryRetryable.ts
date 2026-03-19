import type { RecoveryReasonCode, RecoveryState } from "~/types/recovery";

const NON_RETRYABLE_REASONS = new Set<RecoveryReasonCode>([
  "TRIP_EMPTY",
  "TRIP_NOT_FOUND",
  "TRIP_INVALID",
  "CHECKOUT_EXPIRED",
  "CHECKOUT_NOT_READY",
  "INVENTORY_UNAVAILABLE",
  "BOOKING_REQUIRES_MANUAL_REVIEW",
]);

export const isRecoveryRetryable = (
  input: RecoveryReasonCode | Pick<RecoveryState, "reasonCode">,
) => {
  const reasonCode = typeof input === "string" ? input : input.reasonCode;

  return !NON_RETRYABLE_REASONS.has(reasonCode);
};
