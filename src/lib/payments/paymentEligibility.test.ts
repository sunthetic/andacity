import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutSession } from "../../types/checkout.ts";

const eligibilityModule: typeof import("./canCheckoutCreatePaymentIntent.ts") =
  await import(
    new URL("./canCheckoutCreatePaymentIntent.ts", import.meta.url).href
  );

const { canCheckoutCreatePaymentIntent } = eligibilityModule;

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
