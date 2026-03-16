import assert from "node:assert/strict";
import test from "node:test";

const inventoryIdModule: typeof import("~/lib/inventory/inventory-id.ts") = await import(
  new URL("../../lib/inventory/inventory-id.ts", import.meta.url).href
);
const routingModule: typeof import("~/lib/entities/routing.ts") = await import(
  new URL("../../lib/entities/routing.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./loadBookableEntityPage.ts") = await import(
  new URL("./loadBookableEntityPage.ts", import.meta.url).href
);

const { buildFlightInventoryId, buildHotelInventoryId } = inventoryIdModule;
const { buildFlightEntityHref, buildHotelEntityHref } = routingModule;
const { toBookableEntity, toFlightSearchEntity, toHotelSearchEntity } = searchEntityModule;
const { loadBookableEntityPage } = helperModule;

const buildFlightEntity = () =>
  toBookableEntity(
    toFlightSearchEntity(
      {
        itineraryId: 321,
        airline: "Delta",
        airlineCode: "DL",
        flightNumber: "123",
        serviceDate: "2026-04-01",
        origin: "New York (JFK)",
        destination: "Los Angeles (LAX)",
        originCode: "JFK",
        destinationCode: "LAX",
        stops: 0,
        duration: "6h 5m",
        cabinClass: "economy",
        fareCode: "Y",
        price: 399,
        currency: "USD",
      },
      {
        departDate: "2026-04-01",
        priceAmountCents: 39900,
        snapshotTimestamp: "2026-03-16T12:00:00.000Z",
      },
    ),
  );

const buildHotelEntity = (input: {
  roomType: string;
  providerOfferId: string;
}) =>
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
        roomType: input.roomType,
        providerName: "hotel-test-provider",
        providerOfferId: input.providerOfferId,
        ratePlanId: "flex-king",
        boardType: "breakfast-included",
        cancellationPolicy: "free-cancellation",
        priceAmountCents: 99600,
        snapshotTimestamp: "2026-03-16T12:00:00.000Z",
      },
    ),
  );

test("returns a resolved loader contract when inventory resolves exactly", async () => {
  const entity = buildFlightEntity();
  const result = await loadBookableEntityPage(
    {
      vertical: "flight",
      route: buildFlightEntityHref(entity),
    },
    {
      resolveRecord: async () => ({
        entity,
        checkedAt: "2026-03-16T12:30:00.000Z",
        isAvailable: true,
      }),
    },
  );

  assert.equal(result.kind, "resolved");
  if (result.kind !== "resolved") {
    assert.fail("expected a resolved entity page result");
  }

  assert.equal(result.status, 200);
  assert.equal(result.route.inventoryId, entity.inventoryId);
  assert.equal(result.entity.inventoryId, entity.inventoryId);
});

test("returns invalid_route without hitting inventory resolution for malformed URLs", async () => {
  let resolveCalls = 0;

  const result = await loadBookableEntityPage(
    {
      vertical: "flight",
      route: "/flights/itinerary/DL/123",
    },
    {
      resolveRecord: async () => {
        resolveCalls += 1;
        return null;
      },
    },
  );

  assert.equal(result.kind, "invalid_route");
  assert.equal(result.status, 400);
  assert.equal(resolveCalls, 0);
});

test("returns not_found when the canonical route parses but live inventory does not resolve", async () => {
  const inventoryId = buildFlightInventoryId({
    airlineCode: "DL",
    flightNumber: "123",
    departDate: "2026-04-01",
    originCode: "JFK",
    destinationCode: "LAX",
  });
  const result = await loadBookableEntityPage(
    {
      vertical: "flight",
      route: buildFlightEntityHref(inventoryId),
    },
    {
      resolveRecord: async () => null,
    },
  );

  assert.equal(result.kind, "not_found");
  if (result.kind !== "not_found") {
    assert.fail("expected a not_found entity page result");
  }

  assert.equal(result.status, 404);
  assert.equal(result.requestedInventoryId, inventoryId);
});

test("returns unavailable when the exact canonical entity resolves but inventory is not bookable", async () => {
  const entity = buildFlightEntity();
  const result = await loadBookableEntityPage(
    {
      vertical: "flight",
      route: buildFlightEntityHref(entity),
    },
    {
      resolveRecord: async () => ({
        entity,
        checkedAt: "2026-03-16T12:30:00.000Z",
        isAvailable: false,
      }),
    },
  );

  assert.equal(result.kind, "unavailable");
  if (result.kind !== "unavailable") {
    assert.fail("expected an unavailable entity page result");
  }

  assert.equal(result.status, 409);
  assert.equal(result.entity.inventoryId, entity.inventoryId);
});

test("returns revalidation_required when live inventory drifts to a different canonical entity", async () => {
  const requestedEntity = buildHotelEntity({
    roomType: "king-suite",
    providerOfferId: "ace-flex-king",
  });
  const replacementEntity = buildHotelEntity({
    roomType: "double-queen",
    providerOfferId: "ace-flex-queen",
  });

  const result = await loadBookableEntityPage(
    {
      vertical: "hotel",
      route: buildHotelEntityHref(requestedEntity),
    },
    {
      resolveRecord: async () => ({
        entity: replacementEntity,
        checkedAt: "2026-03-16T12:30:00.000Z",
        isAvailable: true,
      }),
    },
  );

  assert.equal(result.kind, "revalidation_required");
  if (result.kind !== "revalidation_required") {
    assert.fail("expected a revalidation_required entity page result");
  }

  assert.equal(result.status, 409);
  assert.equal(result.requestedInventoryId, requestedEntity.inventoryId);
  assert.equal(result.resolvedInventoryId, replacementEntity.inventoryId);
});
