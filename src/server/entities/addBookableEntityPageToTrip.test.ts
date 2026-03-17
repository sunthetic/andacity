import assert from "node:assert/strict";
import test from "node:test";

import type { BookableEntity } from "~/types/bookable-entity";
import type {
  BookableEntityPageLoadResult,
  ParsedBookableEntityRoute,
} from "~/types/bookable-entity-route";
import type { TripDetails } from "~/types/trips/trip";

const routingModule: typeof import("~/lib/entities/routing.ts") = await import(
  new URL("../../lib/entities/routing.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") =
  await import(new URL("../../lib/search/search-entity.ts", import.meta.url).href);
const helperModule: typeof import("./addBookableEntityPageToTrip.ts") =
  await import(new URL("./addBookableEntityPageToTrip.ts", import.meta.url).href);

const { buildHotelEntityHref, parseBookableEntityRouteForVertical } = routingModule;
const { toBookableEntity, toHotelSearchEntity } = searchEntityModule;
const {
  AddBookableEntityToTripError,
  addBookableEntityPageToTrip,
} = helperModule;

const NOW = "2026-03-16T18:30:00.000Z";

const buildHotelEntity = (): BookableEntity =>
  toBookableEntity(
    toHotelSearchEntity(
      {
        inventoryId: 555,
        slug: "ace-hotel",
        name: "Ace Hotel",
        neighborhood: "Downtown",
        stars: 4,
        rating: 8.7,
        reviewCount: 412,
        priceFrom: 249,
        currency: "USD",
        image: "/img/hotel.jpg",
      },
      {
        checkInDate: "2026-04-01",
        checkOutDate: "2026-04-05",
        occupancy: 2,
        roomType: "king-room",
        providerName: "hotel-test-provider",
        providerOfferId: "ace-flex-king",
        ratePlanId: "flex-king",
        ratePlan: "Flexible",
        boardType: "breakfast",
        cancellationPolicy: "free-cancel",
        priceAmountCents: 99600,
        snapshotTimestamp: NOW,
      },
    ),
  );

const buildResolvedPage = (
  entity: BookableEntity,
): Extract<BookableEntityPageLoadResult, { kind: "resolved" }> => ({
  kind: "resolved",
  vertical: "hotel",
  status: 200,
  route: parseBookableEntityRouteForVertical(
    "hotel",
    buildHotelEntityHref(entity),
  ) as ParsedBookableEntityRoute,
  entity,
  resolution: {
    checkedAt: NOW,
    isAvailable: true,
  },
});

const buildTrip = (overrides: Partial<TripDetails> = {}): TripDetails => ({
  id: 7,
  name: "Trip for Ace Hotel",
  status: "draft",
  itemCount: 0,
  startDate: null,
  endDate: null,
  estimatedTotalCents: 0,
  currencyCode: "USD",
  hasMixedCurrencies: false,
  updatedAt: NOW,
  bookingSessionId: null,
  notes: null,
  metadata: {},
  editing: {
    autoRebalance: false,
    lockedItemCount: 0,
  },
  citiesInvolved: [],
  pricing: {
    currencyCode: "USD",
    snapshotTotalCents: 0,
    currentTotalCents: 0,
    priceDeltaCents: 0,
    hasMixedCurrencies: false,
    hasPartialPricing: false,
    driftCounts: {
      increased: 0,
      decreased: 0,
      unchanged: 0,
      unavailable: 0,
    },
    verticals: [],
  },
  revalidation: {
    status: "all_valid",
    checkedAt: null,
    expiresAt: null,
    itemStatusCounts: {
      valid: 0,
      price_changed: 0,
      unavailable: 0,
      error: 0,
    },
    summary: "All trip items still match the latest live inventory checks.",
  },
  intelligence: {
    status: "valid_itinerary",
    checkedAt: null,
    expiresAt: null,
    itemStatusCounts: {
      valid: 0,
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
    generatedAt: NOW,
    gaps: [],
    suggestions: [],
  },
  items: [],
  ...overrides,
});

test("creates a persisted trip when no explicit trip context is present", async () => {
  const entity = buildHotelEntity();
  const createdTrip = buildTrip({ id: 10, name: "Trip for Ace Hotel" });
  const updatedTrip = buildTrip({ id: 10, itemCount: 1 });
  let capturedCreateName: string | undefined;
  let capturedTripId: number | null = null;

  const result = await addBookableEntityPageToTrip(
    {
      vertical: "hotel",
      route: buildHotelEntityHref(entity),
    },
    {
      dependencies: {
        loadPageFn: async () => buildResolvedPage(entity),
        createTripAssemblyFn: async (input) => {
          capturedCreateName = input?.name;
          return createdTrip;
        },
        addBookableEntityToTripFn: async (input) => {
          capturedTripId = input.tripId;
          return updatedTrip;
        },
      },
    },
  );

  assert.equal(result.trip.id, 10);
  assert.equal(result.tripResolution, "created_trip");
  assert.equal(result.duplicatePolicy, "allow");
  assert.equal(capturedCreateName, "Trip for Ace Hotel");
  assert.equal(capturedTripId, 10);
});

test("reuses the requested persisted trip when trip context is provided", async () => {
  const entity = buildHotelEntity();
  const requestedTrip = buildTrip({ id: 42, name: "Spring planning trip" });
  const updatedTrip = buildTrip({ id: 42, itemCount: 1 });
  let capturedTripId: number | null = null;

  const result = await addBookableEntityPageToTrip(
    {
      vertical: "hotel",
      route: buildHotelEntityHref(entity),
      preferredTripId: 42,
    },
    {
      dependencies: {
        loadPageFn: async () => buildResolvedPage(entity),
        getTripDetailsFn: async (tripId) =>
          tripId === 42 ? requestedTrip : null,
        createTripAssemblyFn: async () => {
          throw new Error("should not create a new trip when trip context exists");
        },
        addBookableEntityToTripFn: async (input) => {
          capturedTripId = input.tripId;
          return updatedTrip;
        },
      },
    },
  );

  assert.equal(result.trip.id, 42);
  assert.equal(result.tripResolution, "requested_trip");
  assert.equal(capturedTripId, 42);
});

test("surfaces add-time unavailability before the trip mutation runs", async () => {
  const entity = buildHotelEntity();

  await assert.rejects(
    () =>
      addBookableEntityPageToTrip(
        {
          vertical: "hotel",
          route: buildHotelEntityHref(entity),
        },
        {
          dependencies: {
            loadPageFn: async () => ({
              ...buildResolvedPage(entity),
              kind: "unavailable",
              status: 409,
              reason: "inventory_unavailable",
            }),
          },
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof AddBookableEntityToTripError);
      assert.equal(error.code, "entity_unavailable");
      return true;
    },
  );
});

test("fails clearly when explicit trip context points to a missing trip", async () => {
  const entity = buildHotelEntity();

  await assert.rejects(
    () =>
      addBookableEntityPageToTrip(
        {
          vertical: "hotel",
          route: buildHotelEntityHref(entity),
          preferredTripId: 999,
        },
        {
          dependencies: {
            loadPageFn: async () => buildResolvedPage(entity),
            getTripDetailsFn: async () => null,
          },
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof AddBookableEntityToTripError);
      assert.equal(error.code, "trip_not_found");
      return true;
    },
  );
});
