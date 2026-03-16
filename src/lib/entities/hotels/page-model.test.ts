import assert from "node:assert/strict";
import test from "node:test";

const routingModule: typeof import("~/lib/entities/routing.ts") = await import(
  new URL("../routing.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") =
  await import(new URL("../../search/search-entity.ts", import.meta.url).href);
const pageModelModule: typeof import("./page-model.ts") = await import(
  new URL("./page-model.ts", import.meta.url).href
);

const { buildHotelEntityHref, parseBookableEntityRouteForVertical } = routingModule;
const { toBookableEntity, toHotelSearchEntity } = searchEntityModule;
const { mapHotelEntityPageForUi } = pageModelModule;

const buildHotelEntity = () =>
  toBookableEntity(
    toHotelSearchEntity(
      {
        inventoryId: 555,
        slug: "ace-hotel",
        name: "Ace Hotel",
        neighborhood: "Downtown",
        stars: 4,
        rating: 8.8,
        reviewCount: 321,
        priceFrom: 756,
        currency: "USD",
        image: "/img/hotel.jpg",
      },
      {
        checkInDate: "2026-04-01",
        checkOutDate: "2026-04-05",
        occupancy: 2,
        roomType: "deluxe-king-suite",
        providerName: "hotel-default",
        providerOfferId: "ace-flex-king",
        ratePlanId: "flexible-pay-later-breakfast-included",
        ratePlan: "Flexible rate · Pay later · Breakfast included",
        boardType: "breakfast-included",
        cancellationPolicy: "free-cancellation",
        policy: {
          refundable: true,
          freeCancellation: true,
          payLater: true,
          cancellationLabel: "Free cancellation before check-in.",
        },
        priceSummary: {
          nightlyBaseCents: 18900,
          totalBaseCents: 75600,
          taxesCents: 0,
          mandatoryFeesCents: 0,
          totalPriceCents: 75600,
          nights: 4,
        },
        propertySummary: {
          brandName: "Ace Hotels",
          propertyType: "boutique-hotel",
          cityName: "New York",
          neighborhood: "Downtown",
          addressLine: "123 Broadway, New York, NY",
          stars: 4,
          rating: 8.8,
          reviewCount: 321,
          checkInTime: "3:00 PM",
          checkOutTime: "11:00 AM",
          summary: "A design-forward stay in lower Manhattan.",
          amenities: ["Pool", "Wi-Fi"],
          notes: ["Pay at property", "No resort fees"],
        },
        roomSummary: {
          roomName: "Deluxe King Suite",
          beds: "1 king bed",
          sizeSqft: 420,
          sleeps: 3,
          features: ["Late checkout"],
          badges: ["Breakfast included"],
        },
        inclusions: ["Breakfast included", "Late checkout"],
        priceAmountCents: 75600,
        snapshotTimestamp: "2026-03-16T12:00:00.000Z",
        imageUrl: "/img/hotel.jpg",
        provider: "Ace Hotels",
      },
    ),
  );

test("maps a resolved canonical hotel entity into a provider-agnostic detail model", () => {
  const entity = buildHotelEntity();
  const route = parseBookableEntityRouteForVertical("hotel", buildHotelEntityHref(entity));

  const model = mapHotelEntityPageForUi({
    kind: "resolved",
    vertical: "hotel",
    status: 200,
    route,
    entity,
    resolution: {
      checkedAt: "2026-03-16T12:30:00.000Z",
      isAvailable: true,
    },
  });

  assert.equal(model.kind, "resolved");
  assert.equal(model.summary?.locationLabel, "Downtown, New York");
  assert.equal(model.summary?.stayLengthLabel, "4 nights");
  assert.equal(model.offerSummary?.bedConfigurationLabel, "1 king bed");
  assert.deepEqual(model.offerSummary?.includedFeatures, [
    "Breakfast included",
    "Late checkout",
  ]);
  assert.ok(model.amenities?.items.includes("Pool"));
  assert.equal(model.policies?.checkInLabel, "Check-in from 3:00 PM");
  assert.ok(model.policies?.notes.includes("No resort fees"));
  assert.equal(model.priceSummary?.totalPriceLabel, "$756 total");
  assert.equal(model.status?.availability.match, "exact");
  assert.equal(model.cta?.label, "Add to Trip");
});

test("maps hotel revalidation drift into a warning state while preserving the live resolved entity view", () => {
  const entity = buildHotelEntity();
  const route = parseBookableEntityRouteForVertical("hotel", buildHotelEntityHref(entity));
  const requestedInventoryId = entity.inventoryId;
  const resolvedInventoryId = requestedInventoryId.replace(
    ":ace-flex-king",
    ":ace-flex-queen",
  );

  const model = mapHotelEntityPageForUi({
    kind: "revalidation_required",
    vertical: "hotel",
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
  assert.equal(model.summary?.locationLabel, "Downtown, New York");
  assert.equal(model.status?.resolvedInventoryId, resolvedInventoryId);
  assert.equal(model.status?.availability.match, "partial");
  assert.equal(model.unavailableState?.badge, "Revalidation needed");
  assert.ok(
    model.unavailableState?.detailItems.some(
      (item) => item.label === "Resolved inventory ID" && item.value === resolvedInventoryId,
    ),
  );
});

test("maps invalid canonical hotel routes into a dedicated error model", () => {
  const model = mapHotelEntityPageForUi({
    kind: "invalid_route",
    vertical: "hotel",
    status: 400,
    pathname: "/hotels/stay/ace-hotel/2026-04-01",
    error: {
      code: "MALFORMED_ROUTE",
      message: "Canonical hotel entity routes must include a valid canonical inventory path.",
      field: "route",
      value: "/hotels/stay/ace-hotel/2026-04-01",
    },
  });

  assert.equal(model.kind, "invalid_route");
  assert.equal(model.summary, null);
  assert.equal(model.offerSummary, null);
  assert.equal(model.errorState?.badge, "Invalid route");
  assert.equal(model.errorState?.primaryAction.label, "Back to hotel search");
});
