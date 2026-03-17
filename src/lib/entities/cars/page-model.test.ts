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

const { buildCarEntityHref, parseBookableEntityRouteForVertical } = routingModule;
const { toBookableEntity, toCarSearchEntity } = searchEntityModule;
const { mapCarEntityPageForUi } = pageModelModule;

const buildCarEntity = () =>
  toBookableEntity(
    toCarSearchEntity(
      {
        inventoryId: 777,
        locationId: "phx-airport",
        slug: "hertz-phx",
        name: "Hertz",
        pickupArea: "Phoenix Sky Harbor",
        vehicleName: "Toyota RAV4",
        category: "SUV",
        transmission: "Automatic",
        seats: 5,
        priceFrom: 67,
        currency: "USD",
        image: "/img/car.jpg",
      },
      {
        providerLocationId: "phx-airport",
        pickupDateTime: "2026-04-01T10:00",
        dropoffDateTime: "2026-04-05T10:00",
        vehicleClass: "suv",
        priceAmountCents: 6700,
        snapshotTimestamp: "2026-03-16T12:00:00.000Z",
        imageUrl: "/img/car.jpg",
      },
    ),
  );

const buildResolvedEntity = () => {
  const entity = buildCarEntity();

  return {
    ...entity,
    payload: {
      ...entity.payload,
      pickupLocationName: "Phoenix Sky Harbor",
      dropoffLocationName: "Phoenix Sky Harbor",
      pickupLocationType: "airport",
      dropoffLocationType: "airport",
      pickupAddressLine: "3400 E Sky Harbor Blvd",
      dropoffAddressLine: "3400 E Sky Harbor Blvd",
      transmissionType: "Automatic",
      seatingCapacity: 5,
      luggageCapacity: "3 large + 1 small",
      doors: 4,
      airConditioning: true,
      fuelPolicy: "Full-to-full",
      mileagePolicy: "Unlimited mileage",
      ratePlanCode: "suv-flex",
      ratePlan: "Free cancellation · Pay at counter",
      policy: {
        freeCancellation: true,
        payAtCounter: true,
        securityDepositRequired: false,
        airConditioning: true,
        minDriverAge: 25,
        cancellationLabel: "Free cancellation before pickup.",
        paymentLabel: "Pay at counter",
        feesLabel: "Local surcharges excluded.",
        depositLabel: "No security deposit required.",
      },
      priceSummary: {
        dailyBaseCents: 6700,
        totalBaseCents: 26800,
        taxesCents: 1200,
        mandatoryFeesCents: 800,
        totalPriceCents: 28800,
        days: 4,
      },
      inclusions: ["Unlimited mileage", "Roadside assistance"],
      badges: ["Free cancellation", "Popular"],
      features: ["Unlimited mileage", "Air conditioning"],
      providerMetadata: {
        providerName: "car-default",
        rentalCompany: "Hertz",
        providerLocationId: "phx-airport",
        providerOfferId: "suv-flex",
        inventorySlug: "hertz-phx",
        pickupLocationName: "Phoenix Sky Harbor",
        dropoffLocationName: "Phoenix Sky Harbor",
        pickupLocationType: "airport",
        dropoffLocationType: "airport",
        pickupAddressLine: "3400 E Sky Harbor Blvd",
        dropoffAddressLine: "3400 E Sky Harbor Blvd",
        driverAge: 30,
        ratePlanCode: "suv-flex",
        ratePlan: "Free cancellation · Pay at counter",
        fuelPolicy: "Full-to-full",
        mileagePolicy: "Unlimited mileage",
      },
    },
  };
};

test("maps a resolved canonical car entity into a provider-agnostic detail model", () => {
  const entity = buildResolvedEntity();
  const route = parseBookableEntityRouteForVertical("car", buildCarEntityHref(entity));

  const model = mapCarEntityPageForUi({
    kind: "resolved",
    vertical: "car",
    status: 200,
    route,
    entity,
    resolution: {
      checkedAt: "2026-03-16T12:30:00.000Z",
      isAvailable: true,
    },
  });

  assert.equal(model.kind, "resolved");
  assert.equal(model.summary?.vehicleName, "Toyota RAV4");
  assert.equal(model.summary?.pickupLocationLabel, "Phoenix Sky Harbor");
  assert.equal(model.summary?.rentalLengthLabel, "4 days");
  assert.equal(model.vehicleSpecs?.transmissionLabel, "Automatic");
  assert.equal(model.vehicleSpecs?.passengerCapacityLabel, "5 passengers");
  assert.equal(model.pickupDropoff?.pickupAddressLabel, "3400 E Sky Harbor Blvd");
  assert.equal(model.policies?.cancellationSummary, "Free cancellation");
  assert.ok(model.policies?.notes.includes("Roadside assistance"));
  assert.equal(model.priceSummary?.totalPriceLabel, "$288 total");
  assert.equal(model.priceSummary?.dailyPriceLabel, "$67 / day");
  assert.equal(model.status?.availability.match, "exact");
  assert.equal(model.cta?.label, "Add to Trip");
  assert.equal(model.cta?.disabled, false);
});

test("maps car revalidation drift into a warning state while preserving the live resolved entity view", () => {
  const entity = buildResolvedEntity();
  const route = parseBookableEntityRouteForVertical("car", buildCarEntityHref(entity));
  const requestedInventoryId = entity.inventoryId;
  const resolvedInventoryId = requestedInventoryId.replace(":suv", ":luxury-suv");

  const model = mapCarEntityPageForUi({
    kind: "revalidation_required",
    vertical: "car",
    status: 409,
    route,
    entity: {
      ...entity,
      inventoryId: resolvedInventoryId,
      bookingContext: {
        ...entity.bookingContext,
        vehicleClass: "luxury-suv",
      },
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
  assert.equal(model.status?.resolvedInventoryId, resolvedInventoryId);
  assert.equal(model.status?.availability.match, "partial");
  assert.equal(model.unavailableState?.badge, "Revalidation needed");
  assert.ok(
    model.unavailableState?.detailItems.some(
      (item) => item.label === "Resolved inventory ID" && item.value === resolvedInventoryId,
    ),
  );
});

test("maps invalid canonical car routes into a dedicated error model", () => {
  const model = mapCarEntityPageForUi({
    kind: "invalid_route",
    vertical: "car",
    status: 400,
    pathname: "/cars/rental/phx-airport/2026-04-01T10-00",
    error: {
      code: "MALFORMED_ROUTE",
      message: "Canonical car entity routes must include a valid canonical inventory path.",
      field: "route",
      value: "/cars/rental/phx-airport/2026-04-01T10-00",
    },
  });

  assert.equal(model.kind, "invalid_route");
  assert.equal(model.summary, null);
  assert.equal(model.vehicleSpecs, null);
  assert.equal(model.errorState?.badge, "Invalid route");
  assert.equal(model.errorState?.primaryAction.label, "Back to car search");
});
