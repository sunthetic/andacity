import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutBookingSummary } from "../../types/booking.ts";
import type { BookingConfirmation } from "../../types/confirmation.ts";
import type {
  CheckoutRevalidationSummary,
  CheckoutSessionSummary,
} from "../../types/checkout.ts";
import type { CheckoutPaymentSummary } from "../../types/payment.ts";
import type { TravelerValidationSummary } from "../../types/travelers.ts";

const checkoutModule: typeof import("./fromCheckoutState.ts") = await import(
  new URL("./fromCheckoutState.ts", import.meta.url).href
);
const revalidationModule: typeof import("./fromRevalidationState.ts") =
  await import(new URL("./fromRevalidationState.ts", import.meta.url).href);
const paymentModule: typeof import("./fromPaymentState.ts") = await import(
  new URL("./fromPaymentState.ts", import.meta.url).href
);
const bookingModule: typeof import("./fromBookingState.ts") = await import(
  new URL("./fromBookingState.ts", import.meta.url).href
);
const confirmationModule: typeof import("./fromConfirmationState.ts") =
  await import(new URL("./fromConfirmationState.ts", import.meta.url).href);
const itineraryModule: typeof import("./fromItineraryState.ts") = await import(
  new URL("./fromItineraryState.ts", import.meta.url).href
);
const retryModule: typeof import("./canRetryTransactionAction.ts") =
  await import(new URL("./canRetryTransactionAction.ts", import.meta.url).href);
const retryableModule: typeof import("./isRecoveryRetryable.ts") = await import(
  new URL("./isRecoveryRetryable.ts", import.meta.url).href
);

const { fromCheckoutState } = checkoutModule;
const { fromRevalidationState } = revalidationModule;
const { fromPaymentState } = paymentModule;
const { fromBookingState } = bookingModule;
const { fromConfirmationState } = confirmationModule;
const { fromItineraryState } = itineraryModule;
const { canRetryTransactionAction } = retryModule;
const { isRecoveryRetryable } = retryableModule;

const buildCheckoutSummary = (
  overrides: Partial<CheckoutSessionSummary> = {},
): CheckoutSessionSummary => {
  return {
    id: "cko_test",
    shortId: "cko_test",
    tripId: 42,
    tripReference: "TRIP-000042",
    tripHref: "/trips/42",
    status: "ready",
    statusLabel: "Ready",
    statusDescription: "Checkout is ready.",
    itemCount: 2,
    currencyCode: "USD",
    totalAmountCents: 42000,
    totalLabel: "$420",
    updatedAt: "2026-03-18T10:00:00.000Z",
    updatedLabel: "Mar 18, 2026, 10:00 AM",
    expiresAt: "2026-03-18T10:30:00.000Z",
    expiresLabel: "Mar 18, 2026, 10:30 AM",
    entryMode: "resumed",
    revalidationStatus: "passed",
    readinessState: "ready",
    lastRevalidatedAt: "2026-03-18T10:00:00.000Z",
    lastRevalidatedLabel: "Last checked just now",
    canReturnToTrip: true,
    readinessLabel: "Ready for payment",
    canProceed: true,
    blockingIssueCount: 0,
    travelerValidationStatus: "complete",
    travelerValidationSummary: null,
    hasCompleteTravelerDetails: true,
    bookingStatus: "idle",
    activeBookingRunId: null,
    hasCompletedBooking: false,
    hasConfirmation: false,
    confirmationStatus: null,
    confirmationPublicRef: null,
    ...overrides,
  };
};

const incompleteTravelerSummary: TravelerValidationSummary = {
  status: "incomplete",
  checkedAt: "2026-03-18T10:00:00.000Z",
  hasBlockingIssues: true,
  issueCount: 1,
  missingTravelerCount: 1,
  invalidTravelerCount: 0,
  assignmentMismatchCount: 0,
  issues: [
    {
      id: "issue:1",
      code: "MISSING_REQUIRED_FIELD",
      message: "firstName is required",
      severity: "error",
      checkoutItemKey: null,
      travelerProfileId: "trv_1",
      assignmentId: null,
      groupId: "group:1",
      role: "primary_contact",
      field: "firstName",
    },
  ],
};

const buildRevalidationSummary = (
  overrides: Partial<CheckoutRevalidationSummary> = {},
): CheckoutRevalidationSummary => {
  return {
    status: "failed",
    checkedAt: "2026-03-18T10:01:00.000Z",
    itemResults: [],
    allItemsPassed: false,
    blockingIssueCount: 1,
    priceChangeCount: 0,
    unavailableCount: 0,
    changedCount: 1,
    failedCount: 0,
    currentTotals: null,
    ...overrides,
  };
};

const buildPaymentSummary = (
  overrides: Partial<CheckoutPaymentSummary> = {},
): CheckoutPaymentSummary => {
  return {
    checkoutSessionId: "cko_test",
    checkoutReady: true,
    blockedReason: null,
    paymentSessionId: "pay_test",
    provider: "stripe",
    status: "authorized",
    statusLabel: "Authorized",
    statusDescription: "Payment is authorized.",
    paymentIntentStatus: "requires_capture",
    currency: "USD",
    amountSnapshot: null,
    amountLabel: "$420",
    revalidationFingerprint: "fp_test",
    fingerprintMatchesCheckout: true,
    clientSecret: "secret_test",
    canInitialize: false,
    canResume: false,
    canCancel: false,
    canRefresh: true,
    updatedAt: "2026-03-18T10:02:00.000Z",
    updatedLabel: "Mar 18, 2026, 10:02 AM",
    ...overrides,
  };
};

const buildBookingSummary = (
  overrides: Partial<CheckoutBookingSummary> = {},
): CheckoutBookingSummary => {
  return {
    checkoutSessionId: "cko_test",
    bookingRunId: null,
    latestBookingRunId: null,
    status: "idle",
    statusLabel: "Idle",
    statusDescription: "Booking has not started.",
    canExecute: false,
    canRefresh: false,
    isProcessing: false,
    hasCompletedBooking: false,
    eligibilityCode: "CHECKOUT_NOT_READY",
    eligibilityMessage: "Booking cannot start yet.",
    updatedAt: null,
    run: null,
    ...overrides,
  };
};

const buildConfirmation = (
  overrides: Partial<BookingConfirmation> = {},
): BookingConfirmation => {
  return {
    id: "cnf_test",
    publicRef: "CNF-ABCDE-12345",
    tripId: 42,
    checkoutSessionId: "cko_test",
    paymentSessionId: "pay_test",
    bookingRunId: "brn_test",
    status: "confirmed",
    currency: "USD",
    totalsJson: {
      totalAmountCents: 42000,
    },
    summaryJson: {
      confirmationId: "cnf_test",
      publicRef: "CNF-ABCDE-12345",
      status: "confirmed",
      statusLabel: "Confirmed",
      statusDescription: "Everything is confirmed.",
      totalItemCount: 2,
      confirmedItemCount: 2,
      pendingItemCount: 0,
      failedItemCount: 0,
      requiresManualReviewCount: 0,
      unresolvedItemCount: 0,
      confirmedItemTitles: ["Item A", "Item B"],
      unresolvedItemTitles: [],
      currency: "USD",
      totalAmountCents: 42000,
      confirmedAt: "2026-03-18T10:05:00.000Z",
      hasItinerary: false,
      itineraryRef: null,
      itineraryStatus: null,
    },
    confirmedAt: "2026-03-18T10:05:00.000Z",
    createdAt: "2026-03-18T10:05:00.000Z",
    updatedAt: "2026-03-18T10:05:00.000Z",
    items: [
      {
        id: "item_1",
        confirmationId: "cnf_test",
        bookingItemExecutionId: "bix_1",
        checkoutItemKey: "flight:1",
        vertical: "flight",
        status: "confirmed",
        title: "Flight",
        subtitle: null,
        startAt: "2026-04-01T14:00:00.000Z",
        endAt: "2026-04-01T17:00:00.000Z",
        locationSummary: "DEN to AUS",
        provider: "duffel",
        providerBookingReference: "BOOK-1",
        providerConfirmationCode: "CONF-1",
        detailsJson: null,
        createdAt: "2026-03-18T10:05:00.000Z",
        updatedAt: "2026-03-18T10:05:00.000Z",
      },
    ],
    ...overrides,
  };
};

test("maps checkout expiration into return-to-trip recovery", () => {
  const recovery = fromCheckoutState({
    summary: buildCheckoutSummary({
      status: "expired",
      readinessState: "blocked",
    }),
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "CHECKOUT_EXPIRED");
  assert.equal(recovery.actions[0]?.type, "return_to_trip");
});

test("maps incomplete traveler details into traveler-specific recovery", () => {
  const recovery = fromCheckoutState({
    summary: buildCheckoutSummary({
      status: "ready",
      readinessState: "ready",
      canProceed: false,
      travelerValidationStatus: "incomplete",
      travelerValidationSummary: incompleteTravelerSummary,
      hasCompleteTravelerDetails: false,
    }),
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "CHECKOUT_TRAVELERS_INCOMPLETE");
  assert.equal(recovery.actions[0]?.type, "complete_travelers");
});

test("maps price drift into revalidation recovery guidance", () => {
  const recovery = fromRevalidationState({
    summary: buildCheckoutSummary({
      status: "blocked",
      readinessState: "blocked",
      revalidationStatus: "failed",
    }),
    revalidationSummary: buildRevalidationSummary({
      priceChangeCount: 1,
      blockingIssueCount: 1,
    }),
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "PRICE_CHANGED");
  assert.equal(recovery.actions[0]?.type, "revalidate");
});

test("maps failed payment sessions into resume-payment recovery", () => {
  const recovery = fromPaymentState({
    paymentSummary: buildPaymentSummary({
      status: "failed",
      statusLabel: "Failed",
      statusDescription: "Payment failed.",
    }),
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "PAYMENT_FAILED");
  assert.equal(recovery.actions[0]?.type, "resume_payment");
});

test("maps partial booking into view-confirmation and manual-review actions", () => {
  const recovery = fromBookingState({
    bookingSummary: buildBookingSummary({
      status: "partial",
      statusLabel: "Partial",
      statusDescription: "Some items booked successfully.",
      run: {
        id: "brn_test",
        checkoutSessionId: "cko_test",
        paymentSessionId: "pay_test",
        status: "partial",
        executionKey: "exec_test",
        startedAt: "2026-03-18T10:03:00.000Z",
        completedAt: "2026-03-18T10:04:00.000Z",
        createdAt: "2026-03-18T10:03:00.000Z",
        updatedAt: "2026-03-18T10:04:00.000Z",
        summary: {
          overallStatus: "partial",
          runStatus: "partial",
          totalItemCount: 2,
          pendingCount: 0,
          processingCount: 0,
          succeededCount: 1,
          failedCount: 1,
          manualReviewCount: 0,
          skippedCount: 0,
          completedCount: 2,
          pendingProviderConfirmationCount: 0,
          message: "Partial booking",
          items: [],
        },
        itemExecutions: [],
      },
    }),
    confirmationRef: "CNF-ABCDE-12345",
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "BOOKING_PARTIAL");
  assert.equal(recovery.actions[0]?.type, "view_confirmation");
  assert.equal(recovery.actions[1]?.type, "manual_review");
});

test("maps failed confirmation state into retry guidance", () => {
  const recovery = fromConfirmationState({
    confirmation: buildConfirmation({
      status: "failed",
      summaryJson: {
        confirmationId: "cnf_test",
        publicRef: "CNF-ABCDE-12345",
        status: "failed",
        statusLabel: "Failed",
        statusDescription: "Confirmation failed.",
        totalItemCount: 1,
        confirmedItemCount: 0,
        pendingItemCount: 0,
        failedItemCount: 1,
        requiresManualReviewCount: 0,
        unresolvedItemCount: 1,
        confirmedItemTitles: [],
        unresolvedItemTitles: ["Flight"],
        currency: "USD",
        totalAmountCents: 42000,
        confirmedAt: null,
        hasItinerary: false,
        itineraryRef: null,
        itineraryStatus: null,
      },
    }),
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "CONFIRMATION_FAILED");
  assert.equal(recovery.actions[0]?.type, "retry");
});

test("maps itinerary creation failures into retry-itinerary guidance", () => {
  const recovery = fromItineraryState({
    hasItinerary: false,
    confirmationRef: "CNF-ABCDE-12345",
    canCreate: true,
    failed: true,
  });

  assert.ok(recovery);
  assert.equal(recovery.reasonCode, "ITINERARY_CREATE_FAILED");
  assert.equal(recovery.actions[0]?.type, "retry");
});

test("distinguishes retryable and non-retryable recovery decisions", () => {
  assert.equal(isRecoveryRetryable("PAYMENT_FAILED"), true);
  assert.equal(isRecoveryRetryable("CHECKOUT_EXPIRED"), false);
  assert.equal(
    canRetryTransactionAction({
      actionType: "resume_payment",
      stage: "payment",
      metadata: {
        checkoutStatus: "expired",
      },
    }),
    false,
  );
  assert.equal(
    canRetryTransactionAction({
      actionType: "resume_booking",
      stage: "booking",
      metadata: {
        checkoutStatus: "ready",
        paymentStatus: "authorized",
      },
    }),
    true,
  );
});
