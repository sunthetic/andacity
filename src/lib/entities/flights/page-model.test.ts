import assert from "node:assert/strict";
import test from "node:test";

const routingModule: typeof import("~/lib/entities/routing.ts") = await import(
  new URL("../routing.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../search/search-entity.ts", import.meta.url).href
);
const pageModelModule: typeof import("./page-model.ts") = await import(
  new URL("./page-model.ts", import.meta.url).href
);

const { buildFlightEntityHref, parseBookableEntityRouteForVertical } = routingModule;
const { toBookableEntity, toFlightSearchEntity } = searchEntityModule;
const { mapFlightEntityPageForUi } = pageModelModule;

const buildFlightEntity = () => {
  const baseEntity = toBookableEntity(
    toFlightSearchEntity(
      {
        itineraryId: 321,
        airline: "Delta",
        airlineCode: "DL",
        flightNumber: "123",
        serviceDate: "2026-04-01",
        origin: "JFK",
        destination: "LAX",
        originCode: "JFK",
        destinationCode: "LAX",
        stops: 1,
        duration: "8h 10m",
        cabinClass: "economy",
        fareCode: "standard",
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

  return {
    ...baseEntity,
    payload: {
      ...baseEntity.payload,
      departureAt: "2026-04-01T13:00:00.000Z",
      arrivalAt: "2026-04-01T21:10:00.000Z",
      itineraryType: "one-way" as const,
      policy: {
        refundable: false,
        changeable: true,
        checkedBagsIncluded: 1,
        seatsRemaining: 4,
      },
      providerMetadata: {
        providerName: "flight-test-provider",
        itineraryType: "one-way" as const,
        requestedServiceDate: "2026-04-01",
        serviceDate: "2026-04-01",
      },
      segments: [
        {
          segmentOrder: 0,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "123",
          originCode: "JFK",
          destinationCode: "ORD",
          departureAt: "2026-04-01T13:00:00.000Z",
          arrivalAt: "2026-04-01T15:10:00.000Z",
          durationMinutes: 130,
        },
        {
          segmentOrder: 1,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "456",
          originCode: "ORD",
          destinationCode: "LAX",
          departureAt: "2026-04-01T16:10:00.000Z",
          arrivalAt: "2026-04-01T21:10:00.000Z",
          durationMinutes: 300,
        },
      ],
    },
  };
};

test("maps a resolved canonical flight entity into a provider-agnostic detail model", () => {
  const entity = buildFlightEntity();
  const route = parseBookableEntityRouteForVertical("flight", buildFlightEntityHref(entity));

  const model = mapFlightEntityPageForUi({
    kind: "resolved",
    vertical: "flight",
    status: 200,
    route,
    entity,
    resolution: {
      checkedAt: "2026-03-16T12:30:00.000Z",
      isAvailable: true,
    },
  });

  assert.equal(model.kind, "resolved");
  assert.equal(model.summary?.airlineLabel, "Delta");
  assert.equal(model.summary?.routeLabel, "JFK -> LAX");
  assert.equal(model.summary?.stopSummary, "1 stop via ORD");
  assert.equal(model.segments.length, 2);
  assert.equal(model.segments[0]?.layoverAfterLabel, "Layover 1h in ORD");
  assert.equal(model.fareSummary?.cabinClassLabel, "Economy");
  assert.equal(model.fareSummary?.refundabilityLabel, "Nonrefundable");
  assert.equal(model.status?.requestedInventoryId, entity.inventoryId);
  assert.equal(model.status?.availability.match, "exact");
  assert.equal(model.cta?.label, "Add to Trip");
  assert.equal(model.cta?.disabled, false);
});

test("maps revalidation drift into a warning state while preserving the live resolved entity view", () => {
  const entity = buildFlightEntity();
  const route = parseBookableEntityRouteForVertical("flight", buildFlightEntityHref(entity));
  const requestedInventoryId = entity.inventoryId;
  const resolvedInventoryId = requestedInventoryId.replace(":123:", ":789:");

  const model = mapFlightEntityPageForUi({
    kind: "revalidation_required",
    vertical: "flight",
    status: 409,
    route,
    entity: {
      ...entity,
      inventoryId: resolvedInventoryId,
    },
    resolution: {
      checkedAt: "2026-03-16T12:30:00.000Z",
      isAvailable: true,
    },
    reason: "inventory_mismatch",
    requestedInventoryId,
    resolvedInventoryId,
  });

  assert.equal(model.kind, "revalidation_required");
  assert.equal(model.summary?.routeLabel, "JFK -> LAX");
  assert.equal(model.status?.resolvedInventoryId, resolvedInventoryId);
  assert.equal(model.status?.availability.match, "partial");
  assert.equal(model.unavailableState?.badge, "Revalidation needed");
  assert.ok(
    model.unavailableState?.detailItems.some(
      (item) => item.label === "Resolved inventory ID" && item.value === resolvedInventoryId,
    ),
  );
});

test("maps invalid canonical routes into a dedicated error model", () => {
  const model = mapFlightEntityPageForUi({
    kind: "invalid_route",
    vertical: "flight",
    status: 400,
    pathname: "/flights/itinerary/DL/123",
    error: {
      code: "MALFORMED_ROUTE",
      message: "Canonical flight entity routes must include a valid canonical inventory path.",
      field: "route",
      value: "/flights/itinerary/DL/123",
    },
  });

  assert.equal(model.kind, "invalid_route");
  assert.equal(model.summary, null);
  assert.equal(model.segments.length, 0);
  assert.equal(model.errorState?.badge, "Invalid route");
  assert.equal(model.errorState?.primaryAction.label, "Back to flight search");
});
