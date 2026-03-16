import assert from "node:assert/strict";
import test from "node:test";

import type { ProviderAdapter } from "~/lib/providers/providerAdapter";

const cacheModule: typeof import("~/lib/search/search-cache.ts") = await import(
  new URL("../../lib/search/search-cache.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./loadCanonicalHotelSearchPage.ts") = await import(
  new URL("./loadCanonicalHotelSearchPage.ts", import.meta.url).href
);
const searchApiModule: typeof import("./searchResultsApi.ts") = await import(
  new URL("./searchResultsApi.ts", import.meta.url).href
);
const searchServiceModule: typeof import("./searchService.ts") = await import(
  new URL("./searchService.ts", import.meta.url).href
);

const { clearSearchCache } = cacheModule;
const { toHotelSearchEntity } = searchEntityModule;
const { loadCanonicalHotelSearchPage } = helperModule;
const { loadSearchResultsApiResponse } = searchApiModule;
const { executeSearchRequest } = searchServiceModule;

test.beforeEach(() => {
  clearSearchCache();
});

const buildHotelEntity = () => {
  const base = toHotelSearchEntity(
    {
      inventoryId: 555,
      slug: "ace-hotel-las-vegas",
      name: "Ace Hotel Las Vegas",
      neighborhood: "The Strip",
      stars: 4,
      rating: 8.9,
      reviewCount: 512,
      priceFrom: 1145,
      currency: "usd",
      image: "/img/hotel.jpg",
    },
    {
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-15",
      occupancy: 2,
      roomType: "king-suite",
      provider: "Ace Hotels",
      providerName: "hotel-test-provider",
      providerOfferId: "ace-flex-king",
      ratePlanId: "flex-king",
      ratePlan: "Flexible King",
      boardType: "breakfast-included",
      cancellationPolicy: "free-cancellation",
      priceAmountCents: 114500,
      snapshotTimestamp: "2026-03-15T12:00:00.000Z",
      imageUrl: "/img/hotel.jpg",
      href: "/hotels/ace-hotel-las-vegas",
    },
  );

  return {
    ...base,
    payload: {
      ...base.payload,
      policy: {
        refundable: true,
        freeCancellation: true,
        payLater: true,
        cancellationLabel: "Free cancellation",
      },
      priceSummary: {
        nightlyBaseCents: 22900,
        totalBaseCents: 109900,
        taxesCents: 3800,
        mandatoryFeesCents: 1800,
        totalPriceCents: 114500,
        nights: 5,
      },
      inclusions: ["Breakfast included", "Late checkout", "Pool access"],
      providerMetadata: {
        providerName: "hotel-test-provider",
        providerHotelId: "ace-555",
        providerOfferId: "ace-flex-king",
        ratePlanId: "flex-king",
        boardType: "breakfast-included",
        cancellationPolicy: "free-cancellation",
        checkInDate: "2026-05-10",
        checkOutDate: "2026-05-15",
        occupancy: 2,
      },
    },
    metadata: {
      ...base.metadata,
      cityName: "Las Vegas",
      ratePlan: "Flexible King",
      boardType: "breakfast-included",
      cancellationPolicy: "free-cancellation",
    },
  };
};

const withSearchApi = (provider: ProviderAdapter) => ({
  loadSearchResultsApiResponse: (input: string | URL) =>
    loadSearchResultsApiResponse(input, {
      executeSearchRequest: (request) =>
        executeSearchRequest(request, {
          getProvider: () => provider,
          resolveLocationBySearchSlug: async () => null,
        }),
    }),
});

test("loads canonical hotel pages through the shared /api/search response path", async () => {
  const provider: ProviderAdapter = {
    provider: "hotel-test-provider",
    async search(params) {
      assert.equal(params.vertical, "hotel");
      assert.equal(params.destination, "las-vegas-nv-us");
      assert.equal(params.checkInDate, "2026-05-10");
      assert.equal(params.checkOutDate, "2026-05-15");
      return [buildHotelEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalHotelSearchPage(
    "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected a successful canonical hotel page response");
  }

  assert.equal(response.request.city, "las-vegas-nv-us");
  assert.equal(response.request.checkIn, "2026-05-10");
  assert.equal(response.request.checkOut, "2026-05-15");
  assert.equal(response.metadata.cacheHit, false);
  assert.equal(response.ui.summary.cityLabel, "Las Vegas, NV, US");
  assert.equal(response.ui.summary.stayLengthLabel, "5 nights");
  assert.equal(response.ui.cards.length, 1);
  assert.equal(response.ui.cards[0]?.ctaLabel, "View details");
});

test("returns an empty renderer-ready UI model when no canonical hotel results are found", async () => {
  const provider: ProviderAdapter = {
    provider: "hotel-test-provider",
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

  const response = await loadCanonicalHotelSearchPage(
    "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected an empty but successful canonical hotel page response");
  }

  assert.equal(response.ui.summary.resultCountLabel, "0 results");
  assert.equal(response.ui.cards.length, 0);
});

test("marks cached canonical hotel responses in the renderer-facing summary", async () => {
  let searchCalls = 0;
  const provider: ProviderAdapter = {
    provider: "hotel-test-provider",
    async search() {
      searchCalls += 1;
      return [buildHotelEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const first = await loadCanonicalHotelSearchPage(
    "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );
  const second = await loadCanonicalHotelSearchPage(
    "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );

  assert.equal(searchCalls, 1);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  if ("error" in first || "error" in second) {
    assert.fail("expected cached canonical hotel page responses to succeed");
  }

  assert.equal(second.metadata.cacheHit, true);
  assert.equal(second.ui.summary.statusLabel, "Cached results");
});

test("returns structured validation failures for invalid canonical hotel routes", async () => {
  const response = await loadCanonicalHotelSearchPage(
    "/hotels/search/las_vegas/2026-05-10/2026-05-15",
  );

  assert.equal(response.status, 400);
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: "INVALID_CITY_SLUG",
      field: "city",
      message: "city must be a lowercase kebab-case city slug.",
    },
    request: undefined,
  });
});

test("returns a safe execution error when the canonical hotel search cannot load results", async () => {
  const provider: ProviderAdapter = {
    provider: "hotel-test-provider",
    async search() {
      throw new Error("provider failed");
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalHotelSearchPage(
    "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );

  assert.equal(response.status, 500);
  assert.deepEqual(response.error, {
    code: "SEARCH_EXECUTION_FAILED",
    message: "Search execution failed. Please try again.",
  });
  assert.deepEqual(response.request, {
    type: "hotel",
    city: "las-vegas-nv-us",
    checkIn: "2026-05-10",
    checkOut: "2026-05-15",
  });
});
