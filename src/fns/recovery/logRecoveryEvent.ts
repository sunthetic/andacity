import type { RecoveryState } from "~/types/recovery";

export const logRecoveryEvent = (
  recoveryState: RecoveryState,
  input: {
    event: "action_result" | "page_load" | "service_error";
    ids?: Record<string, string | number | null | undefined>;
  },
) => {
  const logger =
    recoveryState.severity === "error" || recoveryState.severity === "critical"
      ? console.warn
      : console.info;

  logger("[recovery-event]", {
    event: input.event,
    stage: recoveryState.stage,
    severity: recoveryState.severity,
    reasonCode: recoveryState.reasonCode,
    isRetryable: recoveryState.isRetryable,
    isTerminal: recoveryState.isTerminal,
    ids: input.ids || {},
    metadata: {
      checkoutSessionId: recoveryState.metadata.checkoutSessionId || null,
      tripId: recoveryState.metadata.tripId || null,
      confirmationRef: recoveryState.metadata.confirmationRef || null,
      itineraryRef: recoveryState.metadata.itineraryRef || null,
      paymentStatus: recoveryState.metadata.paymentStatus || null,
      bookingStatus: recoveryState.metadata.bookingStatus || null,
    },
  });
};
