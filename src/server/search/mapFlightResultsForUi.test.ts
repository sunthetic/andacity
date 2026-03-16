import assert from "node:assert/strict";
import test from "node:test";

import type { FlightSearchEntity } from "~/types/search-entity";

const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./mapFlightResultsForUi.ts") = await import(
  new URL("./mapFlightResultsForUi.ts", import.meta.url).href
);
const routingModule: typeof import("~/lib/entities/routing.ts") = await import(
  new URL("../../lib/entities/routing.ts", import.meta.url).href
);

const { toFlightSearchEntity } = searchEntityModule;
const { mapFlightResultsForUi } = helperModule;
const { buildFlightEntityHref } = routingModule;

const buildFlightEntity = (
  overrides: Omit<Partial<FlightSearchEntity>, "payload" | "metadata"> & {
    payload?: Partial<FlightSearchEntity["payload"]>;
    metadata?: Partial<FlightSearchEntity["metadata"]>;
  } = {},
) => {
  const base = toFlightSearchEntity(
    {
      itineraryId: 732,
      airline: "Delta",
      airlineCode: "DL",
      flightNumber: "432",
      serviceDate: "2026-05-10",
      origin: "Orlando (ORL)",
      destination: "Los Angeles (LAX)",
      originCode: "ORL",
      destinationCode: "LAX",
      stops: 0,
      duration: "5h 28m",
      cabinClass: "economy",
      fareCode: "Y",
      price: 318,
      currency: "USD",
    },
    {
      departDate: "2026-05-10",
      priceAmountCents: 31800,
      snapshotTimestamp: "2026-03-14T12:00:00.000Z",
    },
  );

  return {
    ...base,
    ...overrides,
    payload: {
      ...base.payload,
      departureAt: "2026-05-10T14:00:00.000Z",
      arrivalAt: "2026-05-10T19:28:00.000Z",
      itineraryType: "one-way",
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
          departureAt: "2026-05-10T14:00:00.000Z",
          arrivalAt: "2026-05-10T19:28:00.000Z",
          durationMinutes: 328,
        },
      ],
      providerMetadata: {
        providerName: "flight-test-provider",
        itineraryType: "one-way",
        requestedServiceDate: "2026-05-10",
        serviceDate: "2026-05-10",
      },
      ...overrides.payload,
    },
    metadata: {
      ...base.metadata,
      carrier: "Delta",
      flightNumber: "432",
      stops: 0,
      durationMinutes: 328,
      ...overrides.metadata,
    },
  } satisfies FlightSearchEntity;
};

test("maps one-way canonical flight results into summary and card models", () => {
  const ui = mapFlightResultsForUi({
    request: {
      type: "flight",
      origin: "ORL",
      destination: "LAX",
      departDate: "2026-05-10",
    },
    results: [buildFlightEntity()],
    metadata: {
      vertical: "flight",
      totalResults: 1,
      providersQueried: ["flight-test-provider"],
      cacheHit: false,
      searchTimeMs: 9,
    },
  });

  assert.equal(ui.summary.routeTitle, "ORL -> LAX");
  assert.equal(ui.summary.tripTypeLabel, "One-way");
  assert.equal(ui.summary.resultCountLabel, "1 result");
  assert.equal(ui.summary.statusLabel, "Fresh provider results");
  assert.ok(ui.summary.metadataBadges.includes("Source: flight-test-provider"));

  assert.equal(ui.cards.length, 1);
  const detailHref = buildFlightEntityHref(buildFlightEntity());
  assert.deepEqual(ui.cards[0], {
    id: ui.cards[0]?.id,
    airlineLabel: "Delta",
    providerLabel: "flight-test-provider",
    flightNumberLabel: "DL 432",
    routeLabel: "ORL -> LAX",
    originCode: "ORL",
    destinationCode: "LAX",
    departAtLabel: "May 10, 2026, 2:00 PM UTC",
    arriveAtLabel: "May 10, 2026, 7:28 PM UTC",
    durationLabel: "5h 28m",
    stopCount: 0,
    stopSummary: "Nonstop",
    cabinLabel: "Economy · Y fare",
    itinerarySummary: null,
    price: {
      amount: 318,
      currency: "USD",
      display: "$318",
    },
    ctaLabel: "View flight",
    ctaHref: detailHref,
    ctaDisabled: false,
  });
});

test("maps round-trip cached flight results without changing server ordering", () => {
  const first = buildFlightEntity({
    inventoryId: "flight:first",
    payload: {
      departureAt: "2026-05-10T12:00:00.000Z",
      arrivalAt: "2026-05-10T20:00:00.000Z",
      segments: [
        {
          segmentOrder: 0,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "432",
          originCode: "ORL",
          destinationCode: "DEN",
          departureAt: "2026-05-10T12:00:00.000Z",
          arrivalAt: "2026-05-10T15:00:00.000Z",
          durationMinutes: 180,
        },
        {
          segmentOrder: 1,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "433",
          originCode: "DEN",
          destinationCode: "PHX",
          departureAt: "2026-05-10T16:00:00.000Z",
          arrivalAt: "2026-05-10T17:30:00.000Z",
          durationMinutes: 90,
        },
        {
          segmentOrder: 2,
          marketingCarrier: "Delta",
          marketingCarrierCode: "DL",
          operatingCarrier: "Delta",
          operatingCarrierCode: "DL",
          flightNumber: "434",
          originCode: "PHX",
          destinationCode: "LAX",
          departureAt: "2026-05-10T18:20:00.000Z",
          arrivalAt: "2026-05-10T20:00:00.000Z",
          durationMinutes: 100,
        },
      ],
      providerMetadata: {
        providerName: "flight-test-provider",
        itineraryType: "round-trip",
        requestedServiceDate: "2026-05-10",
        serviceDate: "2026-05-10",
      },
    },
    metadata: {
      stops: 2,
      durationMinutes: 370,
    },
  });

  const second = buildFlightEntity({
    inventoryId: "flight:second",
    metadata: {
      flightNumber: "999",
    },
    payload: {
      flightNumber: "999",
    },
  });

  const ui = mapFlightResultsForUi({
    request: {
      type: "flight",
      origin: "ORL",
      destination: "LAX",
      departDate: "2026-05-10",
      returnDate: "2026-05-15",
    },
    results: [first, second],
    metadata: {
      vertical: "flight",
      totalResults: 2,
      providersQueried: [],
      cacheHit: true,
      searchTimeMs: 3,
    },
  });

  assert.equal(ui.summary.tripTypeLabel, "Round-trip");
  assert.equal(ui.summary.returnDateLabel, "May 15, 2026");
  assert.equal(ui.summary.statusLabel, "Cached results");
  assert.equal(ui.cards[0]?.id, "flight:first");
  assert.equal(ui.cards[1]?.id, "flight:second");
  assert.equal(ui.cards[0]?.stopSummary, "2 stops via DEN, PHX");
  assert.equal(ui.cards[0]?.itinerarySummary, "ORL -> DEN -> PHX -> LAX");
});

test("maps partial normalized flight entities without crashing", () => {
  const partial = buildFlightEntity({
    provider: null,
    title: "Fallback flight",
    price: {
      amountCents: null,
      currency: null,
      displayText: null,
    },
    payload: {
      departureAt: null,
      arrivalAt: null,
      cabinClass: null,
      fareCode: null,
      segments: null,
      providerMetadata: null,
    },
    metadata: {
      carrier: null,
      stops: null,
      durationMinutes: null,
    },
  });

  const ui = mapFlightResultsForUi({
    request: {
      type: "flight",
      origin: "ORL",
      destination: "LAX",
      departDate: "2026-05-10",
    },
    results: [partial],
    metadata: {
      vertical: "flight",
      totalResults: 1,
      providersQueried: ["flight-test-provider"],
      cacheHit: false,
      searchTimeMs: 12,
    },
  });

  assert.equal(ui.cards[0]?.airlineLabel, "Fallback flight");
  assert.equal(ui.cards[0]?.providerLabel, null);
  assert.equal(ui.cards[0]?.departAtLabel, "May 10, 2026 · Time unavailable");
  assert.equal(ui.cards[0]?.arriveAtLabel, "Time unavailable");
  assert.equal(ui.cards[0]?.durationLabel, "Duration unavailable");
  assert.equal(ui.cards[0]?.price.display, "Price unavailable");
  assert.equal(ui.cards[0]?.cabinLabel, null);
});
