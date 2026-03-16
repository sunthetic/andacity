import assert from "node:assert/strict";
import test from "node:test";

import type { ProviderAdapter } from "~/lib/providers/providerAdapter";
import type { CanonicalLocation } from "~/types/location";

const cacheModule: typeof import("~/lib/search/search-cache.ts") = await import(
  new URL("../../lib/search/search-cache.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./loadCanonicalCarSearchPage.ts") = await import(
  new URL("./loadCanonicalCarSearchPage.ts", import.meta.url).href
);
const searchApiModule: typeof import("./searchResultsApi.ts") = await import(
  new URL("./searchResultsApi.ts", import.meta.url).href
);
const searchServiceModule: typeof import("./searchService.ts") = await import(
  new URL("./searchService.ts", import.meta.url).href
);

const { clearSearchCache } = cacheModule;
const { toCarSearchEntity } = searchEntityModule;
const { loadCanonicalCarSearchPage } = helperModule;
const { loadSearchResultsApiResponse } = searchApiModule;
const { executeSearchRequest } = searchServiceModule;

test.beforeEach(() => {
  clearSearchCache();
});

const buildAirportLocation = (airportCode = "LAX"): CanonicalLocation => ({
  locationId: `airport:${airportCode}`,
  searchSlug: airportCode.toLowerCase(),
  kind: "airport",
  cityId: 1,
  airportId: 1,
  regionId: 1,
  citySlug: "los-angeles-ca-us",
  cityName: "Los Angeles",
  airportName: "Los Angeles International Airport",
  airportCode,
  primaryAirportCode: airportCode,
  stateOrProvinceName: "California",
  stateOrProvinceCode: "CA",
  countryName: "United States",
  countryCode: "US",
  displayName: `Los Angeles International Airport (${airportCode})`,
});

const buildCarEntity = () => {
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
    payload: {
      ...base.payload,
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
    },
    metadata: {
      ...base.metadata,
      vehicleClass: "suv",
      transmission: "Automatic",
      seats: 5,
      pickupArea: "LAX Terminal B",
      dropoffArea: "LAX Terminal B",
      luggageCapacity: "3 large + 1 small",
    },
  };
};

const withSearchApi = (provider: ProviderAdapter) => ({
  loadSearchResultsApiResponse: (input: string | URL) =>
    loadSearchResultsApiResponse(input, {
      executeSearchRequest: (request) =>
        executeSearchRequest(request, {
          getProvider: () => provider,
          resolveLocationBySearchSlug: async (searchSlug) =>
            searchSlug.toUpperCase() === "LAX" ? buildAirportLocation("LAX") : null,
        }),
    }),
});

test("loads canonical car pages through the shared /api/search response path", async () => {
  const provider: ProviderAdapter = {
    provider: "car-test-provider",
    vertical: "car",
    async search(params) {
      assert.equal(params.vertical, "car");
      assert.equal(params.pickupLocation, "LAX");
      assert.equal(params.dropoffLocation, "LAX");
      assert.equal(params.pickupDate, "2026-05-10");
      assert.equal(params.dropoffDate, "2026-05-15");
      return [buildCarEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalCarSearchPage("/cars/search/LAX/2026-05-10/2026-05-15", {
    ...withSearchApi(provider),
  });

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected a successful canonical car page response");
  }

  assert.equal(response.request.airport, "LAX");
  assert.equal(response.request.pickupDate, "2026-05-10");
  assert.equal(response.request.dropoffDate, "2026-05-15");
  assert.equal(response.metadata.cacheHit, false);
  assert.equal(response.ui.summary.searchTitle, "LAX airport car rentals");
  assert.equal(response.ui.summary.rentalLengthLabel, "5 days");
  assert.equal(response.ui.cards.length, 1);
  assert.equal(response.ui.cards[0]?.ctaLabel, "View rental");
});

test("returns an empty renderer-ready UI model when no canonical car results are found", async () => {
  const provider: ProviderAdapter = {
    provider: "car-test-provider",
    vertical: "car",
    async search() {
      return [];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalCarSearchPage("/cars/search/LAX/2026-05-10/2026-05-15", {
    ...withSearchApi(provider),
  });

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected an empty but successful canonical car page response");
  }

  assert.equal(response.ui.summary.resultCountLabel, "0 results");
  assert.equal(response.ui.cards.length, 0);
});

test("marks cached canonical car responses in the renderer-facing summary", async () => {
  let searchCalls = 0;
  const provider: ProviderAdapter = {
    provider: "car-test-provider",
    vertical: "car",
    async search() {
      searchCalls += 1;
      return [buildCarEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const first = await loadCanonicalCarSearchPage("/cars/search/LAX/2026-05-10/2026-05-15", {
    ...withSearchApi(provider),
  });
  const second = await loadCanonicalCarSearchPage("/cars/search/LAX/2026-05-10/2026-05-15", {
    ...withSearchApi(provider),
  });

  assert.equal(searchCalls, 1);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  if ("error" in first || "error" in second) {
    assert.fail("expected cached canonical car page responses to succeed");
  }

  assert.equal(second.metadata.cacheHit, true);
  assert.equal(second.ui.summary.statusLabel, "Cached results");
});

test("returns structured validation failures for invalid canonical car routes", async () => {
  const response = await loadCanonicalCarSearchPage(
    "/cars/search/LAX-airport/2026-05-10/2026-05-15",
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: "INVALID_LOCATION_CODE",
      field: "airport",
      message: "airport must be a 3-letter airport code.",
    },
    request: undefined,
  });
});
