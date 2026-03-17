import assert from "node:assert/strict";
import test from "node:test";

const inventoryIdModule: typeof import("../inventory/inventory-id.ts") = await import(
  new URL("../inventory/inventory-id.ts", import.meta.url).href
);
const routingModule: typeof import("./routing.ts") = await import(
  new URL("./routing.ts", import.meta.url).href
);

const {
  buildCarInventoryId,
  buildFlightInventoryId,
  buildHotelInventoryId,
} = inventoryIdModule;
const {
  BookableEntityRouteError,
  buildCarEntityHref,
  buildFlightEntityHref,
  buildHotelEntityHref,
  isBookableEntityPath,
  parseBookableEntityRoute,
  parseBookableEntityRouteForVertical,
} = routingModule;

test("builds deterministic canonical entity routes for every vertical", () => {
  const flightInventoryId = buildFlightInventoryId({
    airlineCode: "DL",
    flightNumber: "123",
    departDate: "2026-04-01",
    originCode: "JFK",
    destinationCode: "LAX",
  });
  const hotelInventoryId = buildHotelInventoryId({
    provider: "hotel-test-provider",
    hotelId: 555,
    checkInDate: "2026-04-01",
    checkOutDate: "2026-04-05",
    roomType: "king-suite",
    occupancy: 2,
    ratePlanId: "flex-king",
    providerOfferId: "ace-flex-king",
    boardType: "breakfast-included",
    cancellationPolicy: "free-cancellation",
  });
  const carInventoryId = buildCarInventoryId({
    providerLocationId: "lax-airport",
    pickupDateTime: "2026-04-01T10:00",
    dropoffDateTime: "2026-04-05T10:00",
    vehicleClass: "suv",
  });

  assert.equal(
    buildFlightEntityHref(flightInventoryId),
    "/flights/itinerary/DL/123/2026-04-01/JFK/LAX",
  );
  assert.equal(
    buildHotelEntityHref(hotelInventoryId),
    "/hotels/stay/hotel-test-provider/v1.555.2026-04-01.2026-04-05.king-suite.2.flex-king.breakfast-included.free-cancellation.ace-flex-king",
  );
  assert.equal(
    buildCarEntityHref(carInventoryId),
    "/cars/rental/lax-airport/2026-04-01T10-00/2026-04-05T10-00/suv",
  );
});

test("parses canonical entity routes back into canonical inventory ids", () => {
  const legacyHotelInventoryId = buildHotelInventoryId({
    hotelId: 777,
    checkInDate: "2026-06-10",
    checkOutDate: "2026-06-12",
    roomType: "standard",
    occupancy: 2,
  });
  const flightPath = "/flights/itinerary/UA/987/2026-06-10/DEN/SFO";
  const hotelPath = buildHotelEntityHref(legacyHotelInventoryId);
  const carPath =
    "/cars/rental/phx-airport/2026-06-10T09-30/2026-06-14T09-30/midsize-suv";

  assert.equal(
    parseBookableEntityRoute(flightPath).inventoryId,
    "flight:UA:987:2026-06-10:DEN:SFO"
  );
  assert.equal(parseBookableEntityRoute(hotelPath).inventoryId, legacyHotelInventoryId);
  assert.equal(
    parseBookableEntityRoute(carPath).inventoryId,
    "car:phx-airport:2026-06-10T09-30:2026-06-14T09-30:midsize-suv",
  );
  assert.equal(
    parseBookableEntityRouteForVertical("hotel", hotelPath).inventoryId,
    legacyHotelInventoryId
  );
  assert.equal(isBookableEntityPath(hotelPath), true);
  assert.equal(isBookableEntityPath("/hotels/ace-hotel"), false);
});

test("rejects malformed or non-canonical entity routes", () => {
  assert.throws(
    () => parseBookableEntityRouteForVertical("flight", "/flights/itinerary/DL/123"),
    (error: unknown) => {
      assert.ok(error instanceof BookableEntityRouteError);
      assert.equal(error.code, "MALFORMED_ROUTE");
      return true;
    },
  );

  assert.throws(
    () => parseBookableEntityRoute("/cars/rental/lax-airport/invalid-date/2026-04-05T10-00/suv"),
    (error: unknown) => {
      assert.ok(error instanceof BookableEntityRouteError);
      assert.equal(error.code, "INVALID_INVENTORY_ID");
      return true;
    },
  );
});
