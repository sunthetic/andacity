import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutSession } from "../../types/checkout.ts";

const fingerprintModule: typeof import("./getCheckoutPaymentFingerprint.ts") =
  await import(new URL("./getCheckoutPaymentFingerprint.ts", import.meta.url).href);
const amountModule: typeof import("./mapCheckoutToPaymentAmountSnapshot.ts") =
  await import(
    new URL("./mapCheckoutToPaymentAmountSnapshot.ts", import.meta.url).href
  );

const { getCheckoutPaymentFingerprint } = fingerprintModule;
const { mapCheckoutToPaymentAmountSnapshot } = amountModule;

const buildSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  id: "cko_payment_test",
  tripId: 42,
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
      baseAmountCents: 92000,
      taxesAmountCents: 8000,
      feesAmountCents: 5000,
      totalAmountCents: 105000,
    },
  },
  lastRevalidatedAt: "2026-03-17T12:00:00.000Z",
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
        providerMetadata: {},
      },
      title: "Ace Palm Hotel",
      subtitle: null,
      imageUrl: null,
      meta: [],
      startDate: "2026-04-10",
      endDate: "2026-04-14",
      snapshotTimestamp: "2026-03-17T11:55:00.000Z",
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
  createdAt: "2026-03-17T11:50:00.000Z",
  updatedAt: "2026-03-17T12:00:00.000Z",
  expiresAt: "2030-03-17T12:30:00.000Z",
  completedAt: null,
  abandonedAt: null,
  ...overrides,
});

test("builds a payable amount snapshot from passed revalidation totals", () => {
  const snapshot = mapCheckoutToPaymentAmountSnapshot(buildSession());

  assert.ok(snapshot);
  assert.equal(snapshot?.source, "revalidated_totals");
  assert.equal(snapshot?.currency, "USD");
  assert.equal(snapshot?.totalAmountCents, 105000);
  assert.equal(snapshot?.itemCount, 1);
});

test("changes the fingerprint when the payable total changes", () => {
  const baseSession = buildSession();
  const baseSnapshot = mapCheckoutToPaymentAmountSnapshot(baseSession);
  const changedSnapshot = mapCheckoutToPaymentAmountSnapshot(
    buildSession({
      revalidationSummary: {
        ...baseSession.revalidationSummary!,
        currentTotals: {
          ...baseSession.revalidationSummary!.currentTotals!,
          totalAmountCents: 108500,
        },
      },
    }),
  );

  assert.ok(baseSnapshot);
  assert.ok(changedSnapshot);
  assert.notEqual(
    getCheckoutPaymentFingerprint(baseSession, baseSnapshot!),
    getCheckoutPaymentFingerprint(baseSession, changedSnapshot!),
  );
});
