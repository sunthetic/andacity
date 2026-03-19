import assert from "node:assert/strict";
import test from "node:test";

import type { BookingConfirmation } from "../../types/confirmation.ts";
import type { CheckoutSession } from "../../types/checkout.ts";

const summaryModule: typeof import("./getCheckoutSessionSummary.ts") =
  await import(new URL("./getCheckoutSessionSummary.ts", import.meta.url).href);

const { getCheckoutSessionSummary } = summaryModule;

const buildSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => {
  return {
    id: "cko_1234567890abcdef",
    tripId: 42,
    status: "draft",
    revalidationStatus: "idle",
    revalidationSummary: null,
    lastRevalidatedAt: null,
    currencyCode: "USD",
    items: [
      {
        tripItemId: 1,
        itemType: "hotel",
        vertical: "hotel",
        entityId: 555,
        bookableEntityId: 555,
        inventory: {
          inventoryId: "hotel:test",
          providerInventoryId: 555,
          hotelAvailabilitySnapshotId: 100,
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
        snapshotTimestamp: "2026-03-15T18:00:00.000Z",
        pricing: {
          currencyCode: "USD",
          baseAmountCents: 20000,
          taxesAmountCents: 3000,
          feesAmountCents: 2000,
          totalAmountCents: 25000,
        },
      },
    ],
    totals: {
      currencyCode: "USD",
      baseAmountCents: 20000,
      taxesAmountCents: 3000,
      feesAmountCents: 2000,
      totalAmountCents: 25000,
    },
    createdAt: "2026-03-16T09:00:00.000Z",
    updatedAt: "2026-03-16T09:15:00.000Z",
    expiresAt: "2030-03-16T09:45:00.000Z",
    completedAt: null,
    abandonedAt: null,
    ...overrides,
  };
};

test("maps checkout session summaries with entry-mode transition details", () => {
  const summary = getCheckoutSessionSummary(buildSession(), {
    entryMode: "resumed",
  });

  assert.equal(summary.tripReference, "TRIP-000042");
  assert.equal(summary.tripHref, "/trips/42");
  assert.equal(summary.entryMode, "resumed");
  assert.equal(summary.canReturnToTrip, true);
  assert.equal(summary.revalidationStatus, "idle");
  assert.equal(summary.readinessState, "blocked");
  assert.equal(summary.readinessLabel, "Awaiting checkout verification");
  assert.equal(summary.totalLabel, "$250");
});

test("derives expiration messaging for expired snapshots", () => {
  const summary = getCheckoutSessionSummary(
    buildSession({
      status: "expired",
    }),
  );

  assert.equal(summary.readinessLabel, "Expired snapshot");
  assert.match(summary.statusDescription, /expired/i);
  assert.equal(summary.canProceed, false);
});

test("marks a passed revalidation session as payment-ready", () => {
  const summary = getCheckoutSessionSummary(
    buildSession({
      status: "ready",
      revalidationStatus: "passed",
      lastRevalidatedAt: "2026-03-16T09:16:00.000Z",
      revalidationSummary: {
        status: "passed",
        checkedAt: "2026-03-16T09:16:00.000Z",
        itemResults: [],
        allItemsPassed: true,
        blockingIssueCount: 0,
        priceChangeCount: 0,
        unavailableCount: 0,
        changedCount: 0,
        failedCount: 0,
        currentTotals: null,
      },
    }),
  );

  assert.equal(summary.readinessState, "ready");
  assert.equal(summary.canProceed, true);
  assert.match(summary.lastRevalidatedLabel || "", /Last checked/i);
});

test("links checkout summaries to confirmation state when a confirmation exists", () => {
  const confirmation: BookingConfirmation = {
    id: "cnf_123",
    publicRef: "CNF-ABCDE-12345",
    tripId: 42,
    checkoutSessionId: "cko_1234567890abcdef",
    paymentSessionId: "pay_123",
    bookingRunId: "brn_123",
    status: "partial",
    currency: "USD",
    totalsJson: {
      totalAmountCents: 25000,
    },
    summaryJson: null,
    confirmedAt: "2026-03-16T09:16:00.000Z",
    createdAt: "2026-03-16T09:16:00.000Z",
    updatedAt: "2026-03-16T09:16:00.000Z",
    items: [],
  };

  const summary = getCheckoutSessionSummary(buildSession(), {
    confirmation,
  });

  assert.equal(summary.hasConfirmation, true);
  assert.equal(summary.confirmationStatus, "partial");
  assert.equal(summary.confirmationPublicRef, "CNF-ABCDE-12345");
});
