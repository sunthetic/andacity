import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type { CheckoutItemSnapshot, CheckoutSession } from "~/types/checkout";
import type { CheckoutPaymentSession } from "~/types/payment";
import type { PriceQuote } from "~/types/pricing";

export const BOOKING_SESSION_STATUSES = [
  "active",
  "expired",
  "invalid",
  "consumed",
] as const;
export type BookingSessionStatus = (typeof BOOKING_SESSION_STATUSES)[number];

export const BOOKING_SESSION_SOURCES = ["inventory", "trip_item"] as const;
export type BookingSessionSource = (typeof BOOKING_SESSION_SOURCES)[number];

export type BookingSession = {
  sessionId: string;
  inventoryId: string;
  vertical: BookableVertical;
  provider: string;
  status: BookingSessionStatus;
  source: BookingSessionSource;
  tripItemId: number | null;
  entity: BookableEntity;
  price: PriceQuote;
  providerMetadata: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
};

export const BOOKING_EXECUTION_STATUSES = [
  "idle",
  "pending",
  "processing",
  "partial",
  "succeeded",
  "failed",
  "requires_manual_review",
] as const;
export type BookingExecutionStatus =
  (typeof BOOKING_EXECUTION_STATUSES)[number];

export const BOOKING_RUN_STATUSES = [
  "pending",
  "processing",
  "partial",
  "succeeded",
  "failed",
  "canceled",
] as const;
export type BookingRunStatus = (typeof BOOKING_RUN_STATUSES)[number];

export const BOOKING_ITEM_EXECUTION_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "requires_manual_review",
  "skipped",
] as const;
export type BookingItemExecutionStatus =
  (typeof BOOKING_ITEM_EXECUTION_STATUSES)[number];

export const BOOKING_ELIGIBILITY_CODES = [
  "BOOKING_ELIGIBLE",
  "CHECKOUT_NOT_FOUND",
  "CHECKOUT_EXPIRED",
  "CHECKOUT_NOT_READY",
  "CHECKOUT_TRAVELERS_INCOMPLETE",
  "PAYMENT_NOT_FOUND",
  "PAYMENT_NOT_AUTHORIZED",
  "BOOKING_ALREADY_COMPLETED",
  "BOOKING_ALREADY_IN_PROGRESS",
] as const;
export type BookingEligibilityCode =
  (typeof BOOKING_ELIGIBILITY_CODES)[number];

export const BOOKING_ERROR_CODES = [
  "INVENTORY_UNAVAILABLE",
  "PRICE_MISMATCH",
  "VALIDATION_ERROR",
  "TRAVELER_DATA_INVALID",
  "PAYMENT_DECLINED",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "UNSUPPORTED_PROVIDER",
  "READ_UNAVAILABLE",
  "UNKNOWN_BOOKING_ERROR",
] as const;
export type BookingErrorCode = (typeof BOOKING_ERROR_CODES)[number];

export type BookingExecutionSummaryItem = {
  checkoutItemKey: string;
  tripItemId: number | null;
  title: string;
  vertical: BookableVertical;
  provider: string | null;
  status: BookingItemExecutionStatus;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  providerStatus: string | null;
  message: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requiresManualReview: boolean;
  isPendingConfirmation: boolean;
};

export type BookingExecutionSummary = {
  overallStatus: BookingExecutionStatus;
  runStatus: BookingRunStatus;
  totalItemCount: number;
  pendingCount: number;
  processingCount: number;
  succeededCount: number;
  failedCount: number;
  manualReviewCount: number;
  skippedCount: number;
  completedCount: number;
  pendingProviderConfirmationCount: number;
  message: string;
  items: BookingExecutionSummaryItem[];
};

export type BookingItemExecution = {
  id: string;
  bookingRunId: string;
  checkoutItemKey: string;
  tripItemId: number | null;
  title: string;
  vertical: BookableVertical;
  provider: string | null;
  status: BookingItemExecutionStatus;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  requestSnapshotJson: Record<string, unknown> | null;
  responseSnapshotJson: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRun = {
  id: string;
  checkoutSessionId: string;
  paymentSessionId: string;
  status: BookingRunStatus;
  executionKey: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  summary: BookingExecutionSummary | null;
  itemExecutions: BookingItemExecution[];
};

export type CreateBookingRunInput = {
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  executionKey: string;
  now?: Date | string | null;
};

export type BookingEligibilitySuccessResult = {
  ok: true;
  code: "BOOKING_ELIGIBLE";
  message: string;
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  executionKey: string;
  activeBookingRun: BookingRun | null;
  completedBookingRun: BookingRun | null;
};

export type BookingEligibilityFailureResult = {
  ok: false;
  code: Exclude<BookingEligibilityCode, "BOOKING_ELIGIBLE">;
  message: string;
  checkoutSession: CheckoutSession | null;
  paymentSession: CheckoutPaymentSession | null;
  executionKey: string | null;
  activeBookingRun: BookingRun | null;
  completedBookingRun: BookingRun | null;
};

export type BookingEligibilityResult =
  | BookingEligibilitySuccessResult
  | BookingEligibilityFailureResult;

export type CheckoutBookingSummary = {
  checkoutSessionId: string;
  bookingRunId: string | null;
  latestBookingRunId: string | null;
  status: BookingExecutionStatus;
  statusLabel: string;
  statusDescription: string;
  canExecute: boolean;
  canRefresh: boolean;
  isProcessing: boolean;
  hasCompletedBooking: boolean;
  eligibilityCode: BookingEligibilityCode;
  eligibilityMessage: string;
  updatedAt: string | null;
  run: BookingRun | null;
};

export type BookingCreateItemSnapshot = {
  checkoutItem: CheckoutItemSnapshot;
  checkoutItemKey: string;
  provider: string | null;
  requestSnapshotJson: Record<string, unknown>;
};
