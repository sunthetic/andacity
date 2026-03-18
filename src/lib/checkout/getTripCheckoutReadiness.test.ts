import assert from "node:assert/strict";
import test from "node:test";

import type { TripDetails, TripItem } from "../../types/trips/trip.ts";

const readinessModule: typeof import("./getTripCheckoutReadiness.ts") =
  await import(new URL("./getTripCheckoutReadiness.ts", import.meta.url).href);

const { getTripCheckoutReadiness } = readinessModule;

const buildTripItem = (overrides: Partial<TripItem> = {}): TripItem => {
  return {
    id: 1,
    tripId: 42,
    itemType: "hotel",
    inventoryId: "hotel:test",
    bookingSessionId: null,
    position: 0,
    locked: false,
    title: "Ace Palm Hotel",
    subtitle: null,
    startDate: "2026-04-10",
    endDate: "2026-04-14",
    snapshotPriceCents: 88000,
    snapshotCurrencyCode: "USD",
    snapshotTimestamp: "2026-03-15T18:00:00.000Z",
    currentPriceCents: 88000,
    currentCurrencyCode: "USD",
    priceDriftStatus: "unchanged",
    priceDriftCents: 0,
    availabilityConfidence: {
      state: "available_fresh",
      match: "exact",
      label: "Available",
      supportText: null,
      detailLabel: "Availability confirmed.",
      checkedAt: "2026-03-16T09:00:00.000Z",
      relativeLabel: "just now",
      stale: false,
      degraded: false,
    },
    freshness: {
      checkedAt: "2026-03-16T09:00:00.000Z",
      ageMs: 0,
      state: "just_checked",
      label: "Just checked",
      checkedLabel: "Checked just now",
      relativeLabel: "just now",
      detailLabel: "Checked moments ago.",
      stale: false,
      profile: "availability_revalidation",
    },
    availabilityStatus: "valid",
    availabilityCheckedAt: "2026-03-16T09:00:00.000Z",
    availabilityExpiresAt: "2026-03-16T15:00:00.000Z",
    revalidation: {
      itemId: 1,
      inventoryId: "hotel:test",
      checkedAt: "2026-03-16T09:00:00.000Z",
      status: "valid",
      message: "Still valid.",
      currentPriceCents: 88000,
      currentCurrencyCode: "USD",
      snapshotPriceCents: 88000,
      snapshotCurrencyCode: "USD",
      priceDeltaCents: 0,
      isAvailable: true,
      issues: [],
    },
    bookableEntity: null,
    imageUrl: null,
    meta: [],
    issues: [],
    startCityName: "Phoenix",
    endCityName: "Phoenix",
    liveCarLocationType: null,
    liveCarLocationName: null,
    hotelId: 555,
    flightItineraryId: null,
    carInventoryId: null,
    liveFlightServiceDate: null,
    liveFlightDepartureAt: null,
    liveFlightArrivalAt: null,
    liveFlightItineraryType: null,
    inventorySnapshot: null,
    metadata: {},
    createdAt: "2026-03-15T18:00:00.000Z",
    updatedAt: "2026-03-16T08:00:00.000Z",
    ...overrides,
  };
};

const buildTripDetails = (items: TripItem[]): TripDetails => {
  return {
    id: 42,
    name: "Phoenix getaway",
    status: "planning",
    itemCount: items.length,
    startDate: "2026-04-10",
    endDate: "2026-04-14",
    estimatedTotalCents: items.reduce((sum, item) => sum + item.snapshotPriceCents, 0),
    currencyCode: "USD",
    hasMixedCurrencies: false,
    updatedAt: "2026-03-16T12:00:00.000Z",
    bookingSessionId: null,
    notes: null,
    metadata: {},
    editing: {
      autoRebalance: true,
      lockedItemCount: 0,
    },
    citiesInvolved: ["Phoenix"],
    pricing: {
      currencyCode: "USD",
      snapshotTotalCents: items.reduce((sum, item) => sum + item.snapshotPriceCents, 0),
      currentTotalCents: items.reduce((sum, item) => sum + item.snapshotPriceCents, 0),
      priceDeltaCents: 0,
      hasMixedCurrencies: false,
      hasPartialPricing: false,
      driftCounts: {
        increased: 0,
        decreased: 0,
        unchanged: items.length,
        unavailable: 0,
      },
      verticals: [],
    },
    revalidation: {
      status: "all_valid",
      checkedAt: "2026-03-16T09:00:00.000Z",
      expiresAt: "2026-03-16T15:00:00.000Z",
      itemStatusCounts: {
        valid: items.length,
        price_changed: 0,
        unavailable: 0,
        error: 0,
      },
      summary: "All good.",
    },
    intelligence: {
      status: "valid_itinerary",
      checkedAt: "2026-03-16T09:00:00.000Z",
      expiresAt: "2026-03-16T15:00:00.000Z",
      itemStatusCounts: {
        valid: items.length,
        unavailable: 0,
        stale: 0,
        price_only_changed: 0,
      },
      issueCounts: {
        warning: 0,
        blocking: 0,
      },
      issues: [],
    },
    bundling: {
      generatedAt: "2026-03-16T09:00:00.000Z",
      gaps: [],
      suggestions: [],
    },
    items,
  };
};

test("returns a ready checkout state for structurally valid trips", () => {
  const readiness = getTripCheckoutReadiness(
    buildTripDetails([buildTripItem()]),
  );

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.itemCount, 1);
  assert.equal(readiness.currency, "USD");
  assert.equal(readiness.estimatedTotal, 88000);
  assert.equal(readiness.readinessLabel, "Ready for checkout");
  assert.deepEqual(readiness.issues, []);
});

test("blocks empty trips from checkout", () => {
  const readiness = getTripCheckoutReadiness(buildTripDetails([]));

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.itemCount, 0);
  assert.equal(readiness.readinessLabel, "Add at least one item to continue to checkout");
  assert.deepEqual(readiness.issues.map((issue) => issue.code), ["no_items"]);
});

test("reports structural item issues that block checkout entry", () => {
  const readiness = getTripCheckoutReadiness(
    buildTripDetails([
      buildTripItem({
        inventoryId: "",
        snapshotPriceCents: Number.NaN,
        snapshotCurrencyCode: "",
        hotelId: null,
        bookableEntity: {
          vertical: "flight",
        } as TripItem["bookableEntity"],
      }),
    ]),
  );

  assert.equal(readiness.isReady, false);
  assert.deepEqual(
    readiness.issues.map((issue) => issue.code).sort(),
    [
      "missing_inventory_reference",
      "missing_pricing_snapshot",
      "unsupported_item_shape",
    ],
  );
});
