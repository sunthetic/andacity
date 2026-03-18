import assert from "node:assert/strict";
import test from "node:test";

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
    expiresAt: "2026-03-16T09:45:00.000Z",
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
  assert.equal(summary.readinessLabel, "Snapshot ready for confirmation checks");
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
