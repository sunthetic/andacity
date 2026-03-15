import assert from "node:assert/strict";
import test from "node:test";

const helperModule: typeof import("./hotelResultsRendererModel.ts") = await import(
  new URL("./hotelResultsRendererModel.ts", import.meta.url).href
);

const { resolveHotelResultsRendererModel } = helperModule;

const buildSuccessPage = (cardCount = 1) => ({
  status: 200 as const,
  request: {
    type: "hotel" as const,
    city: "las-vegas-nv-us",
    checkIn: "2026-05-10",
    checkOut: "2026-05-15",
  },
  metadata: {
    vertical: "hotel" as const,
    totalResults: cardCount,
    providersQueried: ["hotel-test-provider"],
    cacheHit: false,
    searchTimeMs: 11,
  },
  ui: {
    summary: {
      cityLabel: "Las Vegas, NV, US",
      checkInDateLabel: "May 10, 2026",
      checkOutDateLabel: "May 15, 2026",
      stayLengthNights: 5,
      stayLengthLabel: "5 nights",
      resultCount: cardCount,
      resultCountLabel: `${cardCount} result${cardCount === 1 ? "" : "s"}`,
      statusLabel: "Fresh provider results",
      metadataBadges: ["Fresh provider results", "Search time 11ms"],
    },
    cards: Array.from({ length: cardCount }).map((_, index) => ({
      id: `hotel-${index + 1}`,
      hotelName: "Ace Hotel Las Vegas",
      cityLabel: "Las Vegas",
      areaLabel: "The Strip",
      starRating: 4,
      guestScore: 8.9,
      reviewCount: 512,
      offerSummary: "King Suite · Flexible King",
      amenitiesSummary: ["Breakfast included"],
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
    })),
  },
});

test("returns a loading renderer state while the canonical route is navigating", () => {
  const model = resolveHotelResultsRendererModel(buildSuccessPage(2), {
    isLoading: true,
    currentPath: "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
  });

  assert.deepEqual(model, {
    state: "loading",
    loading: {
      title: "Loading hotel results",
      description: "Checking stay pricing, policies, and availability for this city.",
      placeholderCount: 3,
    },
  });
});

test("returns an empty renderer state with revise-search actions", () => {
  const model = resolveHotelResultsRendererModel(buildSuccessPage(0), {
    currentPath: "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
  });

  assert.equal(model.state, "empty");
  if (model.state !== "empty") {
    assert.fail("expected an empty renderer state");
  }

  assert.equal(model.summary.stayLengthLabel, "5 nights");
  assert.deepEqual(model.empty, {
    title: "No hotels were found for this search.",
    description: "Try different dates, a nearby destination, or a shorter stay.",
    primaryAction: {
      label: "Revise search",
      href: "/hotels?destination=Las+Vegas%2C+NV%2C+US&checkIn=2026-05-10&checkOut=2026-05-15",
    },
    secondaryAction: {
      label: "Start a new search",
      href: "/hotels",
    },
  });
});

test("returns a safe error renderer state for malformed route failures", () => {
  const model = resolveHotelResultsRendererModel(
    {
      status: 400,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        field: "route",
        message: "route must match a supported canonical search route.",
      },
      request: undefined,
    },
    {
      currentPath: "/hotels/search/not-a-valid-route",
    },
  );

  assert.deepEqual(model, {
    state: "error",
    error: {
      title: "This hotel search link is incomplete.",
      description: "The URL did not match a supported Andacity hotel search route.",
      statusLabel: "HTTP 400",
      routeLabel: null,
      retryHref: "/hotels/search/not-a-valid-route",
      retryLabel: "Try again",
      backToSearchHref: "/hotels",
      backToSearchLabel: "Start a new search",
    },
  });
});

test("returns a results renderer state with stable card count and summary", () => {
  const model = resolveHotelResultsRendererModel(buildSuccessPage(2), {
    currentPath: "/hotels/search/las-vegas-nv-us/2026-05-10/2026-05-15",
  });

  assert.equal(model.state, "results");
  if (model.state !== "results") {
    assert.fail("expected a results renderer state");
  }

  assert.equal(model.summary.cityLabel, "Las Vegas, NV, US");
  assert.equal(model.cards.length, 2);
  assert.ok(model.cards.every((card) => card.ctaLabel === "View details"));
});
