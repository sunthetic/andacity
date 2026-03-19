export const RECOVERY_STAGES = [
  "checkout",
  "revalidation",
  "payment",
  "booking",
  "confirmation",
  "itinerary",
] as const;

export type RecoveryStage = (typeof RECOVERY_STAGES)[number];

export const RECOVERY_SEVERITIES = [
  "info",
  "warning",
  "error",
  "critical",
] as const;

export type RecoverySeverity = (typeof RECOVERY_SEVERITIES)[number];

export const RECOVERY_REASON_CODES = [
  "TRIP_EMPTY",
  "TRIP_NOT_FOUND",
  "TRIP_INVALID",
  "CHECKOUT_EXPIRED",
  "CHECKOUT_NOT_FOUND",
  "CHECKOUT_NOT_READY",
  "CHECKOUT_TRAVELERS_INCOMPLETE",
  "CHECKOUT_TRAVELERS_INVALID",
  "TRAVELER_ASSIGNMENT_MISMATCH",
  "CHECKOUT_CREATE_FAILED",
  "CHECKOUT_RESUME_FAILED",
  "REVALIDATION_FAILED",
  "PRICE_CHANGED",
  "INVENTORY_UNAVAILABLE",
  "PAYMENT_PROVIDER_UNAVAILABLE",
  "PAYMENT_FAILED",
  "PAYMENT_REQUIRES_ACTION",
  "PAYMENT_SESSION_STALE",
  "BOOKING_PARTIAL",
  "BOOKING_FAILED",
  "BOOKING_REQUIRES_MANUAL_REVIEW",
  "CONFIRMATION_PENDING",
  "CONFIRMATION_FAILED",
  "ITINERARY_CREATE_FAILED",
  "UNKNOWN_TRANSACTION_ERROR",
] as const;

export type RecoveryReasonCode = (typeof RECOVERY_REASON_CODES)[number];

export const RECOVERY_ACTION_TYPES = [
  "retry",
  "revalidate",
  "complete_travelers",
  "return_to_trip",
  "resume_checkout",
  "resume_payment",
  "resume_booking",
  "view_confirmation",
  "view_itinerary",
  "start_new_search",
  "manual_review",
  "contact_support",
] as const;

export type RecoveryActionType = (typeof RECOVERY_ACTION_TYPES)[number];

export type RecoveryAction = {
  type: RecoveryActionType;
  label: string;
  description: string | null;
  href: string | null;
  intent: string | null;
  emphasis: "primary" | "secondary";
  disabled?: boolean;
};

export type RecoveryMetadata = {
  checkoutSessionId?: string | null;
  checkoutStatus?: string | null;
  checkoutReady?: boolean | null;
  tripId?: number | null;
  tripHref?: string | null;
  confirmationRef?: string | null;
  confirmationHref?: string | null;
  itineraryRef?: string | null;
  itineraryHref?: string | null;
  paymentStatus?: string | null;
  bookingStatus?: string | null;
  hasConfirmedItems?: boolean | null;
  priceChangeCount?: number | null;
  unavailableCount?: number | null;
  failedCount?: number | null;
  manualReviewCount?: number | null;
  blockingIssueCount?: number | null;
  travelerValidationStatus?: string | null;
  travelerIssueCount?: number | null;
  rawCode?: string | null;
  rawMessage?: string | null;
  [key: string]: unknown;
};

export type RecoveryState = {
  stage: RecoveryStage;
  severity: RecoverySeverity;
  reasonCode: RecoveryReasonCode;
  title: string;
  message: string;
  actions: RecoveryAction[];
  isRetryable: boolean;
  isTerminal: boolean;
  metadata: RecoveryMetadata;
};

export type RecoverySummary = {
  stage: RecoveryStage;
  state: RecoveryState | null;
  primaryAction: RecoveryAction | null;
  secondaryActions: RecoveryAction[];
};
