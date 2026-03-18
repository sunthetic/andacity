import assert from "node:assert/strict";
import test from "node:test";

import type {
  CheckoutItemRevalidationResult,
  CheckoutSession,
} from "../../types/checkout.ts";

const summaryModule: typeof import("./buildCheckoutRevalidationSummary.ts") =
  await import(
    new URL("./buildCheckoutRevalidationSummary.ts", import.meta.url).href
  );
const readinessModule: typeof import("./getCheckoutReadinessState.ts") =
  await import(
    new URL("./getCheckoutReadinessState.ts", import.meta.url).href
  );
const paymentModule: typeof import("./canCheckoutProceedToPayment.ts") =
  await import(
    new URL("./canCheckoutProceedToPayment.ts", import.meta.url).href
  );
const staleModule: typeof import("./shouldCheckoutSessionRevalidate.ts") =
  await import(
    new URL("./shouldCheckoutSessionRevalidate.ts", import.meta.url).href
  );

const { buildCheckoutRevalidationSummary } = summaryModule;
const { getCheckoutReadinessState } = readinessModule;
const { canCheckoutProceedToPayment } = paymentModule;
const { shouldCheckoutSessionRevalidate } = staleModule;

const buildItemResult = (
  overrides: Partial<CheckoutItemRevalidationResult> = {},
): CheckoutItemRevalidationResult => ({
  tripItemId: 1,
  itemType: "hotel",
  vertical: "hotel",
  title: "Ace Palm Hotel",
  subtitle: null,
  status: "passed",
  message: "Still valid.",
  previousPricing: {
    currencyCode: "USD",
    baseAmountCents: 80000,
    taxesAmountCents: 8000,
    feesAmountCents: 4000,
    totalAmountCents: 92000,
  },
  currentPricing: {
    currencyCode: "USD",
    baseAmountCents: 80000,
    taxesAmountCents: 8000,
    feesAmountCents: 4000,
    totalAmountCents: 92000,
  },
  previousInventory: {
    inventoryId:
      "hotel:expedia:hotel-123:offer-abc:rate-flex:breakfast:flex:deluxe:2:2026-04-10:2026-04-14",
    providerInventoryId: 555,
    hotelAvailabilitySnapshotId: 12,
    availability: null,
    bookableEntity: null,
    providerMetadata: {
      provider: "expedia",
    },
  },
  currentInventory: {
    inventoryId:
      "hotel:expedia:hotel-123:offer-abc:rate-flex:breakfast:flex:deluxe:2:2026-04-10:2026-04-14",
    providerInventoryId: 555,
    hotelAvailabilitySnapshotId: null,
    availability: null,
    bookableEntity: null,
    providerMetadata: {
      provider: "expedia",
    },
  },
  providerMetadata: {
    provider: "expedia",
  },
  ...overrides,
});

const buildSession = (
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession => ({
  id: "cko_gate_test",
  tripId: 42,
  status: "draft",
  revalidationStatus: "idle",
  revalidationSummary: null,
  lastRevalidatedAt: null,
  currencyCode: "USD",
  items: [],
  totals: {
    currencyCode: "USD",
    baseAmountCents: 80000,
    taxesAmountCents: 8000,
    feesAmountCents: 4000,
    totalAmountCents: 92000,
  },
  createdAt: "2026-03-16T09:00:00.000Z",
  updatedAt: "2026-03-16T09:00:00.000Z",
  expiresAt: "2030-03-16T09:30:00.000Z",
  completedAt: null,
  abandonedAt: null,
  ...overrides,
});

test("builds a failed revalidation summary with granular counts", () => {
  const summary = buildCheckoutRevalidationSummary({
    checkedAt: "2026-03-16T09:05:00.000Z",
    itemResults: [
      buildItemResult(),
      buildItemResult({
        tripItemId: 2,
        status: "price_changed",
        currentPricing: {
          currencyCode: "USD",
          baseAmountCents: 84000,
          taxesAmountCents: 9000,
          feesAmountCents: 5000,
          totalAmountCents: 98000,
        },
      }),
      buildItemResult({
        tripItemId: 3,
        status: "unavailable",
        currentPricing: null,
        currentInventory: null,
      }),
    ],
  });

  assert.equal(summary.status, "failed");
  assert.equal(summary.blockingIssueCount, 2);
  assert.equal(summary.priceChangeCount, 1);
  assert.equal(summary.unavailableCount, 1);
  assert.equal(summary.currentTotals?.totalAmountCents, 190000);
});

test("returns ready only when the session has a passed revalidation summary", () => {
  const summary = buildCheckoutRevalidationSummary({
    checkedAt: "2026-03-16T09:05:00.000Z",
    itemResults: [buildItemResult()],
  });
  const session = buildSession({
    status: "ready",
    revalidationStatus: "passed",
    revalidationSummary: summary,
    lastRevalidatedAt: "2026-03-16T09:05:00.000Z",
  });

  assert.equal(getCheckoutReadinessState(session), "ready");
  assert.equal(canCheckoutProceedToPayment(session), true);
});

test("requests a fresh revalidation when the stored result is stale or failed", () => {
  const passedSummary = buildCheckoutRevalidationSummary({
    checkedAt: "2026-03-16T09:05:00.000Z",
    itemResults: [buildItemResult()],
  });

  assert.equal(
    shouldCheckoutSessionRevalidate(
      buildSession({
        revalidationStatus: "failed",
        revalidationSummary: passedSummary,
        lastRevalidatedAt: "2026-03-16T09:05:00.000Z",
      }),
      { now: "2026-03-16T09:06:00.000Z" },
    ),
    true,
  );

  assert.equal(
    shouldCheckoutSessionRevalidate(
      buildSession({
        status: "ready",
        revalidationStatus: "passed",
        revalidationSummary: passedSummary,
        lastRevalidatedAt: "2026-03-16T09:05:00.000Z",
      }),
      { now: "2026-03-16T09:06:00.000Z" },
    ),
    false,
  );

  assert.equal(
    shouldCheckoutSessionRevalidate(
      buildSession({
        status: "ready",
        revalidationStatus: "passed",
        revalidationSummary: passedSummary,
        lastRevalidatedAt: "2026-03-16T09:05:00.000Z",
      }),
      { now: "2026-03-16T09:20:01.000Z", ttlMs: 5 * 60 * 1000 },
    ),
    true,
  );
});
