import assert from "node:assert/strict";
import test from "node:test";

import type { CarSearchEntity } from "~/types/search-entity";

const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./mapCarResultsForUi.ts") = await import(
  new URL("./mapCarResultsForUi.ts", import.meta.url).href
);

const { toCarSearchEntity } = searchEntityModule;
const { mapCarResultsForUi } = helperModule;

const buildCarEntity = (
  overrides: Omit<Partial<CarSearchEntity>, "payload" | "metadata"> & {
    payload?: Partial<CarSearchEntity["payload"]>;
    metadata?: Partial<CarSearchEntity["metadata"]>;
  } = {},
) => {
  const base = toCarSearchEntity(
    {
      inventoryId: 777,
      locationId: "lax-airport",
      slug: "hertz-lax-standard",
      name: "Hertz",
      pickupArea: "LAX Terminal B",
      vehicleName: "Toyota RAV4",
      category: "SUV",
      transmission: "Automatic",
      seats: 5,
      priceFrom: 67,
      currency: "USD",
      image: "/img/car.jpg",
    },
    {
      providerLocationId: "lax-airport",
      pickupDateTime: "2026-05-10T10:00",
      dropoffDateTime: "2026-05-15T10:00",
      vehicleClass: "suv",
      priceAmountCents: 6700,
      snapshotTimestamp: "2026-03-15T12:00:00.000Z",
    },
  );

  return {
    ...base,
    ...overrides,
    payload: {
      ...base.payload,
      pickupLocationName: "LAX Terminal B",
      dropoffLocationName: "LAX Terminal B",
      transmissionType: "Automatic",
      seatingCapacity: 5,
      luggageCapacity: "3 large + 1 small",
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
        totalBaseCents: 33500,
        taxesCents: 8000,
        mandatoryFeesCents: 1200,
        totalPriceCents: 42700,
        days: 5,
      },
      providerMetadata: {
        providerName: "car-test-provider",
        rentalCompany: "Hertz",
        providerLocationId: "lax-airport",
        providerOfferId: "hertz-lax-suv",
        inventorySlug: "hertz-lax-standard",
        pickupLocationName: "LAX Terminal B",
        dropoffLocationName: "LAX Terminal B",
        pickupLocationType: "airport",
        dropoffLocationType: "airport",
        pickupAddressLine: "1 World Way",
        dropoffAddressLine: "1 World Way",
        driverAge: 30,
        ratePlanCode: "flex-suv",
        ratePlan: "Free cancellation · Pay at counter",
        fuelPolicy: "Full to full",
        mileagePolicy: "Unlimited mileage",
      },
      ...overrides.payload,
    },
    metadata: {
      ...base.metadata,
      vehicleClass: "suv",
      transmission: "Automatic",
      seats: 5,
      pickupArea: "LAX Terminal B",
      dropoffArea: "LAX Terminal B",
      luggageCapacity: "3 large + 1 small",
      ...overrides.metadata,
    },
  } satisfies CarSearchEntity;
};

test("maps canonical car results into summary and card models", () => {
  const ui = mapCarResultsForUi({
    request: {
      type: "car",
      airport: "LAX",
      pickupDate: "2026-05-10",
      dropoffDate: "2026-05-15",
    },
    results: [buildCarEntity()],
    metadata: {
      vertical: "car",
      totalResults: 1,
      providersQueried: ["car-test-provider"],
      cacheHit: false,
      searchTimeMs: 12,
    },
  });

  assert.equal(ui.summary.searchTitle, "LAX airport car rentals");
  assert.equal(ui.summary.pickupDateLabel, "May 10, 2026");
  assert.equal(ui.summary.dropoffDateLabel, "May 15, 2026");
  assert.equal(ui.summary.rentalLengthLabel, "5 days");
  assert.equal(ui.summary.resultCountLabel, "1 result");
  assert.ok(ui.summary.metadataBadges.includes("Source: car-test-provider"));

  assert.equal(ui.cards.length, 1);
  assert.deepEqual(ui.cards[0], {
    id: ui.cards[0]?.id,
    vehicleName: "Toyota RAV4",
    categoryLabel: "SUV",
    brandLabel: "Hertz",
    providerLabel: "car-test-provider",
    pickupCode: "LAX",
    dropoffCode: "LAX",
    pickupDateLabel: "May 10, 2026",
    dropoffDateLabel: "May 15, 2026",
    rentalLengthLabel: "5 days",
    transmissionLabel: "Automatic",
    passengerLabel: "5 passengers",
    baggageLabel: "3 large + 1 small",
    cancellationSummary: "Free cancellation",
    price: {
      totalAmount: 427,
      dailyAmount: 67,
      currency: "USD",
      totalDisplay: "$427 total",
      supportingDisplay: "$67 / day base rate",
    },
    ctaLabel: "Select car",
    ctaHref: null,
    ctaDisabled: true,
  });
});

test("maps cached car results and preserves server ordering", () => {
  const first = buildCarEntity({
    inventoryId: "car:first",
  });
  const second = buildCarEntity({
    inventoryId: "car:second",
    title: "Budget",
    payload: {
      providerMetadata: {
        ...buildCarEntity().payload.providerMetadata!,
        providerName: "car-test-provider",
        rentalCompany: "Budget",
      },
    },
  });

  const ui = mapCarResultsForUi({
    request: {
      type: "car",
      airport: "LAX",
      pickupDate: "2026-05-10",
      dropoffDate: "2026-05-15",
    },
    results: [first, second],
    metadata: {
      vertical: "car",
      totalResults: 2,
      providersQueried: [],
      cacheHit: true,
      searchTimeMs: 4,
    },
  });

  assert.equal(ui.summary.statusLabel, "Cached results");
  assert.equal(ui.cards[0]?.id, "car:first");
  assert.equal(ui.cards[1]?.id, "car:second");
});

test("maps partial normalized car entities without crashing", () => {
  const partial = buildCarEntity({
    title: "Budget",
    subtitle: null,
    provider: null,
    price: {
      amountCents: null,
      currency: null,
      displayText: null,
    },
    payload: {
      pickupLocationName: null,
      dropoffLocationName: null,
      transmissionType: null,
      seatingCapacity: null,
      luggageCapacity: null,
      policy: null,
      priceSummary: null,
      providerMetadata: null,
      vehicleClass: null,
    },
    metadata: {
      vehicleClass: null,
      transmission: null,
      seats: null,
      pickupArea: null,
      dropoffArea: null,
      luggageCapacity: null,
    },
  });

  const ui = mapCarResultsForUi({
    request: {
      type: "car",
      airport: "LAX",
      pickupDate: "2026-05-10",
      dropoffDate: "2026-05-15",
    },
    results: [partial],
    metadata: {
      vertical: "car",
      totalResults: 1,
      providersQueried: ["car-test-provider"],
      cacheHit: false,
      searchTimeMs: 9,
    },
  });

  assert.equal(ui.cards[0]?.vehicleName, "Budget");
  assert.equal(ui.cards[0]?.categoryLabel, "Category unavailable");
  assert.equal(ui.cards[0]?.transmissionLabel, "Transmission unavailable");
  assert.equal(ui.cards[0]?.passengerLabel, "Passenger capacity unavailable");
  assert.equal(ui.cards[0]?.baggageLabel, "Baggage capacity unavailable");
  assert.equal(ui.cards[0]?.cancellationSummary, "Cancellation terms unavailable");
  assert.equal(ui.cards[0]?.price.totalDisplay, "Price unavailable");
  assert.equal(ui.cards[0]?.ctaDisabled, true);
});
