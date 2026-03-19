import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutSession } from "../../types/checkout.ts";
import type { TravelerValidationSummary } from "../../types/travelers.ts";

const eligibilityModule: typeof import("./canCheckoutCreatePaymentIntent.ts") =
  await import(
    new URL("./canCheckoutCreatePaymentIntent.ts", import.meta.url).href
  );

const { canCheckoutCreatePaymentIntent } = eligibilityModule;

const completeTravelerSummary: TravelerValidationSummary = {
  status: "complete",
  checkedAt: "2026-03-17T12:00:00.000Z",
  hasBlockingIssues: false,
  issueCount: 0,
  missingTravelerCount: 0,
  invalidTravelerCount: 0,
  assignmentMismatchCount: 0,
  issues: [],
};

const buildSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  id: "cko_payment_gate",
  tripId: 11,
  status: "ready",
  revalidationStatus: "passed",
  revalidationSummary: {
    status: "passed",
    checkedAt: "2026-03-17T12:00:00.000Z",
    itemResults: [],
    allItemsPassed: true,
    blockingIssueCount: 0,
    priceChangeCount: 0,
    unavailableCount: 0,
    changedCount: 0,
    failedCount: 0,
    currentTotals: {
      currencyCode: "USD",
      baseAmountCents: 50000,
      taxesAmountCents: 5000,
      feesAmountCents: 2500,
      totalAmountCents: 57500,
    },
  },
  lastRevalidatedAt: "2026-03-17T12:00:00.000Z",
  currencyCode: "USD",
  items: [],
  totals: {
    currencyCode: "USD",
    baseAmountCents: 50000,
    taxesAmountCents: 5000,
    feesAmountCents: 2500,
    totalAmountCents: 57500,
  },
  createdAt: "2026-03-17T11:50:00.000Z",
  updatedAt: "2026-03-17T12:00:00.000Z",
  expiresAt: "2030-03-17T12:30:00.000Z",
  completedAt: null,
  abandonedAt: null,
  travelerValidationStatus: "complete",
  travelerValidationSummary: completeTravelerSummary,
  hasCompleteTravelerDetails: true,
  ...overrides,
});

test("allows payment intent creation only for ready, unexpired checkouts", () => {
  const result = canCheckoutCreatePaymentIntent(buildSession(), {
    now: "2026-03-17T12:05:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.amountSnapshot.totalAmountCents : null, 57500);
});

test("blocks payment creation when revalidation has not passed", () => {
  const result = canCheckoutCreatePaymentIntent(
    buildSession({
      status: "blocked",
      revalidationStatus: "failed",
      revalidationSummary: {
        ...buildSession().revalidationSummary!,
        status: "failed",
        allItemsPassed: false,
        blockingIssueCount: 1,
        failedCount: 1,
      },
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.code, "CHECKOUT_NOT_READY");
});

test("blocks payment creation when traveler details are incomplete", () => {
  const result = canCheckoutCreatePaymentIntent(
    buildSession({
      travelerValidationStatus: "incomplete",
      travelerValidationSummary: {
        ...completeTravelerSummary,
        status: "incomplete",
        hasBlockingIssues: true,
        issueCount: 2,
        missingTravelerCount: 2,
      },
      hasCompleteTravelerDetails: false,
    }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.code, "CHECKOUT_NOT_READY");
  assert.match(result.ok ? "" : result.message, /traveler/i);
});
