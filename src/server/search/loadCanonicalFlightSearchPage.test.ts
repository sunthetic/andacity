import assert from "node:assert/strict";
import test from "node:test";

import type { ProviderAdapter } from "~/lib/providers/providerAdapter";

const cacheModule: typeof import("~/lib/search/search-cache.ts") = await import(
  new URL("../../lib/search/search-cache.ts", import.meta.url).href
);
const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./loadCanonicalFlightSearchPage.ts") = await import(
  new URL("./loadCanonicalFlightSearchPage.ts", import.meta.url).href
);
const searchApiModule: typeof import("./searchResultsApi.ts") = await import(
  new URL("./searchResultsApi.ts", import.meta.url).href
);
const searchServiceModule: typeof import("./searchService.ts") = await import(
  new URL("./searchService.ts", import.meta.url).href
);

const { clearSearchCache } = cacheModule;
const { toFlightSearchEntity } = searchEntityModule;
const { loadCanonicalFlightSearchPage } = helperModule;
const { loadSearchResultsApiResponse } = searchApiModule;
const { executeSearchRequest } = searchServiceModule;

test.beforeEach(() => {
  clearSearchCache();
});

const buildFlightEntity = (serviceDate = "2026-05-10") => {
  const base = toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: "Delta",
      airlineCode: "DL",
      flightNumber: "432",
      serviceDate,
      origin: "Orlando (ORL)",
      destination: "Los Angeles (LAX)",
      originCode: "ORL",
      destinationCode: "LAX",
      stops: 0,
      duration: "5h 28m",
      cabinClass: "economy",
      fareCode: "Y",
      price: 318,
      currency: "usd",
    },
    {
      departDate: serviceDate,
      priceAmountCents: 31800,
      snapshotTimestamp: "2026-03-14T12:00:00.000Z",
    },
  );

  return {
    ...base,
    payload: {
      ...base.payload,
      departureAt: `${serviceDate}T14:00:00.000Z`,
      arrivalAt: `${serviceDate}T19:28:00.000Z`,
      itineraryType: "one-way" as const,
      segments: [
        {
          segmentOrder: 0,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "432",
          originCode: "ORL",
          destinationCode: "LAX",
          departureAt: `${serviceDate}T14:00:00.000Z`,
          arrivalAt: `${serviceDate}T19:28:00.000Z`,
          durationMinutes: 328,
        },
      ],
      providerMetadata: {
        providerName: "flight-test-provider",
        itineraryType: "one-way" as const,
        requestedServiceDate: serviceDate,
        serviceDate,
      },
    },
    metadata: {
      ...base.metadata,
      carrier: "Delta",
      flightNumber: "432",
      stops: 0,
      durationMinutes: 328,
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

test("loads one-way canonical flight pages through the shared /api/search response path", async () => {
  const provider: ProviderAdapter = {
    provider: "flight-test-provider",
    vertical: "flight",
    async search(params) {
      assert.equal(params.vertical, "flight");
      assert.equal(params.origin, "ORL");
      assert.equal(params.destination, "LAX");
      assert.equal(params.departDate, "2026-05-10");
      assert.equal(params.returnDate, undefined);
      return [buildFlightEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalFlightSearchPage("/flights/search/ORL-LAX/2026-05-10", {
    ...withSearchApi(provider),
  });

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected a successful canonical flight page response");
  }

  assert.equal(response.request.origin, "ORL");
  assert.equal(response.request.destination, "LAX");
  assert.equal(response.request.returnDate, undefined);
  assert.equal(response.metadata.cacheHit, false);
  assert.equal(response.ui.summary.routeTitle, "ORL -> LAX");
  assert.equal(response.ui.summary.resultCountLabel, "1 result");
  assert.equal(response.ui.cards.length, 1);
  assert.equal(response.ui.cards[0]?.ctaLabel, "View flight");
});

test("loads round-trip canonical flight pages and preserves the return date in the summary", async () => {
  const provider: ProviderAdapter = {
    provider: "flight-test-provider",
    vertical: "flight",
    async search(params) {
      assert.equal(params.returnDate, "2026-05-15");
      return [buildFlightEntity(params.departDate || "2026-05-10")];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const response = await loadCanonicalFlightSearchPage(
    "/flights/search/ORL-LAX/2026-05-10/return/2026-05-15",
    {
      ...withSearchApi(provider),
    },
  );

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected a successful round-trip canonical flight page response");
  }

  assert.equal(response.request.returnDate, "2026-05-15");
  assert.equal(response.ui.summary.tripTypeLabel, "Round-trip");
  assert.equal(response.ui.summary.returnDateLabel, "May 15, 2026");
});

test("returns an empty renderer-ready UI model when no canonical flight results are found", async () => {
  const provider: ProviderAdapter = {
    provider: "flight-test-provider",
    vertical: "flight",
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

  const response = await loadCanonicalFlightSearchPage("/flights/search/ORL-LAX/2026-05-10", {
    ...withSearchApi(provider),
  });

  assert.equal(response.status, 200);
  if ("error" in response) {
    assert.fail("expected an empty but successful canonical flight page response");
  }

  assert.equal(response.ui.summary.resultCountLabel, "0 results");
  assert.equal(response.ui.cards.length, 0);
});

test("marks cached canonical flight responses in the renderer-facing summary", async () => {
  let searchCalls = 0;
  const provider: ProviderAdapter = {
    provider: "flight-test-provider",
    vertical: "flight",
    async search() {
      searchCalls += 1;
      return [buildFlightEntity()];
    },
    async resolveInventory() {
      return null;
    },
    async fetchPrice() {
      return null;
    },
  };

  const first = await loadCanonicalFlightSearchPage("/flights/search/ORL-LAX/2026-05-10", {
    ...withSearchApi(provider),
  });
  const second = await loadCanonicalFlightSearchPage("/flights/search/ORL-LAX/2026-05-10", {
    ...withSearchApi(provider),
  });

  assert.equal(searchCalls, 1);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  if ("error" in first || "error" in second) {
    assert.fail("expected cached canonical flight page responses to succeed");
  }

  assert.equal(second.metadata.cacheHit, true);
  assert.equal(second.ui.summary.statusLabel, "Cached results");
});

test("returns structured validation failures for invalid canonical flight routes", async () => {
  const response = await loadCanonicalFlightSearchPage("/flights/search/ORLL-LAX/2026-05-10");

  assert.equal(response.status, 400);
  assert.deepEqual(response, {
    status: 400,
    error: {
      code: "INVALID_LOCATION_CODE",
      field: "origin",
      message: "origin must be a 3-letter airport code.",
    },
    request: undefined,
  });
});

test("returns a safe execution error when the canonical flight search cannot load results", async () => {
  const provider: ProviderAdapter = {
    provider: "flight-test-provider",
    vertical: "flight",
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

  const response = await loadCanonicalFlightSearchPage("/flights/search/ORL-LAX/2026-05-10", {
    ...withSearchApi(provider),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(response.error, {
    code: "SEARCH_EXECUTION_FAILED",
    message: "Search execution failed. Please try again.",
  });
  assert.deepEqual(response.request, {
    type: "flight",
    origin: "ORL",
    destination: "LAX",
    departDate: "2026-05-10",
  });
});
