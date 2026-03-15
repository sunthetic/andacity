import assert from "node:assert/strict";
import test from "node:test";

import type { HotelSearchEntity } from "~/types/search-entity";

const searchEntityModule: typeof import("~/lib/search/search-entity.ts") = await import(
  new URL("../../lib/search/search-entity.ts", import.meta.url).href
);
const helperModule: typeof import("./mapHotelResultsForUi.ts") = await import(
  new URL("./mapHotelResultsForUi.ts", import.meta.url).href
);

const { toHotelSearchEntity } = searchEntityModule;
const { mapHotelResultsForUi } = helperModule;

const buildHotelEntity = (
  overrides: Omit<Partial<HotelSearchEntity>, "payload" | "metadata"> & {
    payload?: Partial<HotelSearchEntity["payload"]>;
    metadata?: Partial<HotelSearchEntity["metadata"]>;
  } = {},
) => {
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
      currency: "USD",
      image: "/img/hotel.jpg",
    },
    {
      checkInDate: "2026-05-10",
      checkOutDate: "2026-05-15",
      occupancy: 2,
      roomType: "king-suite",
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
      provider: "Ace Hotels",
    },
  );

  return {
    ...base,
    ...overrides,
    payload: {
      ...base.payload,
      ratePlan: "Flexible King",
      boardType: "breakfast-included",
      cancellationPolicy: "free-cancellation",
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
      ...overrides.payload,
    },
    metadata: {
      ...base.metadata,
      roomType: "king-suite",
      stars: 4,
      rating: 8.9,
      reviewCount: 512,
      neighborhood: "The Strip",
      cityName: "Las Vegas",
      ratePlan: "Flexible King",
      boardType: "breakfast-included",
      cancellationPolicy: "free-cancellation",
      ...overrides.metadata,
    },
  } satisfies HotelSearchEntity;
};

test("maps canonical hotel results into summary and hotel card models", () => {
  const ui = mapHotelResultsForUi({
    request: {
      type: "hotel",
      city: "las-vegas-nv-us",
      checkIn: "2026-05-10",
      checkOut: "2026-05-15",
    },
    results: [buildHotelEntity()],
    metadata: {
      vertical: "hotel",
      totalResults: 1,
      providersQueried: ["hotel-test-provider"],
      cacheHit: false,
      searchTimeMs: 11,
    },
  });

  assert.equal(ui.summary.cityLabel, "Las Vegas, NV, US");
  assert.equal(ui.summary.checkInDateLabel, "May 10, 2026");
  assert.equal(ui.summary.checkOutDateLabel, "May 15, 2026");
  assert.equal(ui.summary.stayLengthLabel, "5 nights");
  assert.equal(ui.summary.resultCountLabel, "1 result");
  assert.ok(ui.summary.metadataBadges.includes("Source: hotel-test-provider"));

  assert.equal(ui.cards.length, 1);
  assert.deepEqual(ui.cards[0], {
    id: ui.cards[0]?.id,
    hotelName: "Ace Hotel Las Vegas",
    cityLabel: "Las Vegas",
    areaLabel: "The Strip",
    starRating: 4,
    guestScore: 8.9,
    reviewCount: 512,
    offerSummary: "King Suite · Flexible King · Breakfast Included",
    amenitiesSummary: ["Breakfast included", "Late checkout", "Pool access"],
    cancellationSummary: "Free cancellation",
    policySummary: "Pay later available · Refundable",
    price: {
      totalAmount: 1145,
      nightlyAmount: 229,
      currency: "USD",
      totalDisplay: "$1,145 total",
      nightlyDisplay: "$229 / night",
    },
    imageUrl: "/img/hotel.jpg",
    detailHref: "/hotels/ace-hotel-las-vegas",
    ctaLabel: "View details",
    ctaHref: "/hotels/ace-hotel-las-vegas",
    ctaDisabled: false,
  });
});

test("maps cached hotel results and preserves server ordering", () => {
  const first = buildHotelEntity({
    inventoryId: "hotel:first",
    metadata: {
      cityName: "Las Vegas",
    },
  });
  const second = buildHotelEntity({
    inventoryId: "hotel:second",
    title: "NoMad Las Vegas",
    metadata: {
      cityName: null,
      neighborhood: "Downtown",
    },
    payload: {
      inclusions: ["Parking included"],
    },
  });

  const ui = mapHotelResultsForUi({
    request: {
      type: "hotel",
      city: "las-vegas-nv-us",
      checkIn: "2026-05-10",
      checkOut: "2026-05-15",
    },
    results: [first, second],
    metadata: {
      vertical: "hotel",
      totalResults: 2,
      providersQueried: [],
      cacheHit: true,
      searchTimeMs: 4,
    },
  });

  assert.equal(ui.summary.statusLabel, "Cached results");
  assert.equal(ui.cards[0]?.id, "hotel:first");
  assert.equal(ui.cards[1]?.id, "hotel:second");
  assert.equal(ui.cards[1]?.cityLabel, "Las Vegas, NV, US");
});

test("maps partial normalized hotel entities without crashing", () => {
  const partial = buildHotelEntity({
    price: {
      amountCents: null,
      currency: null,
      displayText: null,
    },
    imageUrl: null,
    href: null,
    payload: {
      roomType: null,
      ratePlan: null,
      boardType: null,
      cancellationPolicy: null,
      policy: null,
      priceSummary: null,
      inclusions: null,
      providerMetadata: null,
      hotelSlug: null,
    },
    metadata: {
      roomType: null,
      stars: null,
      rating: null,
      reviewCount: null,
      neighborhood: null,
      cityName: null,
      ratePlan: null,
      boardType: null,
      cancellationPolicy: null,
    },
  });

  const ui = mapHotelResultsForUi({
    request: {
      type: "hotel",
      city: "las-vegas-nv-us",
      checkIn: "2026-05-10",
      checkOut: "2026-05-15",
    },
    results: [partial],
    metadata: {
      vertical: "hotel",
      totalResults: 1,
      providersQueried: ["hotel-test-provider"],
      cacheHit: false,
      searchTimeMs: 14,
    },
  });

  assert.equal(ui.cards[0]?.cityLabel, "Las Vegas, NV, US");
  assert.equal(ui.cards[0]?.offerSummary, null);
  assert.deepEqual(ui.cards[0]?.amenitiesSummary, []);
  assert.equal(ui.cards[0]?.cancellationSummary, null);
  assert.equal(ui.cards[0]?.policySummary, null);
  assert.equal(ui.cards[0]?.price.totalDisplay, "Price unavailable");
  assert.equal(ui.cards[0]?.ctaDisabled, true);
});
