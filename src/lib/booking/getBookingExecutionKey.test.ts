import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutSession } from "../../types/checkout.ts";
import type { CheckoutPaymentSession } from "../../types/payment.ts";

const keyModule: typeof import("./getBookingExecutionKey.ts") = await import(
  new URL("./getBookingExecutionKey.ts", import.meta.url).href
);

const { getBookingExecutionKey } = keyModule;

const buildCheckoutSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  id: "cko_booking_test",
  tripId: 42,
  status: "ready",
  revalidationStatus: "passed",
  revalidationSummary: {
    status: "passed",
    checkedAt: "2026-03-18T12:00:00.000Z",
    itemResults: [],
    allItemsPassed: true,
    blockingIssueCount: 0,
    priceChangeCount: 0,
    unavailableCount: 0,
    changedCount: 0,
    failedCount: 0,
    currentTotals: {
      currencyCode: "USD",
      baseAmountCents: 92000,
      taxesAmountCents: 8000,
      feesAmountCents: 5000,
      totalAmountCents: 105000,
    },
  },
  lastRevalidatedAt: "2026-03-18T12:00:00.000Z",
  currencyCode: "USD",
  items: [
    {
      tripItemId: 1,
      itemType: "hotel",
      vertical: "hotel",
      entityId: 100,
      bookableEntityId: 100,
      inventory: {
        inventoryId: "hotel:test:100",
        providerInventoryId: 100,
        hotelAvailabilitySnapshotId: 1,
        availability: null,
        bookableEntity: null,
        providerMetadata: {
          provider: "hotel",
        },
      },
      title: "Ace Palm Hotel",
      subtitle: null,
      imageUrl: null,
      meta: [],
      startDate: "2026-04-10",
      endDate: "2026-04-14",
      snapshotTimestamp: "2026-03-18T11:55:00.000Z",
      pricing: {
        currencyCode: "USD",
        baseAmountCents: 92000,
        taxesAmountCents: 8000,
        feesAmountCents: 5000,
        totalAmountCents: 105000,
      },
    },
  ],
  totals: {
    currencyCode: "USD",
    baseAmountCents: 92000,
    taxesAmountCents: 8000,
    feesAmountCents: 5000,
    totalAmountCents: 105000,
  },
  createdAt: "2026-03-18T11:50:00.000Z",
  updatedAt: "2026-03-18T12:00:00.000Z",
  expiresAt: "2030-03-18T12:30:00.000Z",
  completedAt: null,
  abandonedAt: null,
  ...overrides,
});

const buildPaymentSession = (
  overrides: Partial<CheckoutPaymentSession> = {},
): CheckoutPaymentSession => ({
  id: "pay_booking_test",
  checkoutSessionId: "cko_booking_test",
  provider: "stripe",
  status: "authorized",
  paymentIntentStatus: "requires_capture",
  currency: "USD",
  amountSnapshot: {
    source: "revalidated_totals",
    currency: "USD",
    baseAmountCents: 92000,
    taxesAmountCents: 8000,
    feesAmountCents: 5000,
    totalAmountCents: 105000,
    itemCount: 1,
    items: [
      {
        tripItemId: 1,
        inventoryId: "hotel:test:100",
        totalAmountCents: 105000,
        currency: "USD",
      },
    ],
  },
  revalidationFingerprint: "fingerprint_1",
  providerPaymentIntentId: "pi_test",
  providerClientSecret: "secret",
  providerMetadata: {
    paymentIntentStatus: "requires_capture",
  },
  createdAt: "2026-03-18T12:00:00.000Z",
  updatedAt: "2026-03-18T12:00:00.000Z",
  authorizedAt: "2026-03-18T12:00:00.000Z",
  succeededAt: null,
  failedAt: null,
  canceledAt: null,
  expiresAt: "2030-03-18T12:30:00.000Z",
  ...overrides,
});

test("keeps the execution key stable for the same transactional state", () => {
  const checkoutSession = buildCheckoutSession();
  const paymentSession = buildPaymentSession();

  assert.equal(
    getBookingExecutionKey(checkoutSession, paymentSession),
    getBookingExecutionKey(checkoutSession, paymentSession),
  );
});

test("changes the execution key when the payment fingerprint changes", () => {
  const checkoutSession = buildCheckoutSession();
  const baseKey = getBookingExecutionKey(checkoutSession, buildPaymentSession());
  const changedKey = getBookingExecutionKey(
    checkoutSession,
    buildPaymentSession({
      revalidationFingerprint: "fingerprint_2",
    }),
  );

  assert.notEqual(baseKey, changedKey);
});
