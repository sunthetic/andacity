import assert from "node:assert/strict";
import test from "node:test";

const helperModule: typeof import("./flightResultsRendererModel.ts") = await import(
  new URL("./flightResultsRendererModel.ts", import.meta.url).href
);

const { resolveFlightResultsRendererModel } = helperModule;

const buildSuccessPage = (cardCount = 1) => ({
  status: 200 as const,
  request: {
    type: "flight" as const,
    origin: "ORL",
    destination: "LAX",
    departDate: "2026-05-10",
    returnDate: "2026-05-15",
  },
  metadata: {
    vertical: "flight" as const,
    totalResults: cardCount,
    providersQueried: ["flight-test-provider"],
    cacheHit: false,
    searchTimeMs: 9,
  },
  ui: {
    summary: {
      routeTitle: "ORL -> LAX",
      originCode: "ORL",
      destinationCode: "LAX",
      departDateLabel: "May 10, 2026",
      returnDateLabel: "May 15, 2026",
      tripTypeLabel: "Round-trip",
      resultCount: cardCount,
      resultCountLabel: `${cardCount} result${cardCount === 1 ? "" : "s"}`,
      statusLabel: "Fresh provider results",
      metadataBadges: ["Fresh provider results", "Search time 9ms"],
    },
    cards: Array.from({ length: cardCount }).map((_, index) => ({
      id: `flight-${index + 1}`,
      airlineLabel: "Delta",
      providerLabel: "flight-test-provider",
      flightNumberLabel: `DL ${index + 1}`,
      routeLabel: "ORL -> LAX",
      originCode: "ORL",
      destinationCode: "LAX",
      departAtLabel: "May 10, 2026, 2:00 PM UTC",
      arriveAtLabel: "May 10, 2026, 7:00 PM UTC",
      durationLabel: "5h",
      stopCount: 0,
      stopSummary: "Nonstop",
      cabinLabel: "Economy",
      itinerarySummary: null,
      price: {
        amount: 318,
        currency: "USD",
        display: "$318",
      },
      ctaLabel: "Select flight",
      ctaHref: null,
      ctaDisabled: true,
    })),
  },
});

test("returns a loading renderer state while the canonical route is navigating", () => {
  const model = resolveFlightResultsRendererModel(buildSuccessPage(2), {
    isLoading: true,
    currentPath: "/flights/search/ORL-LAX/2026-05-10/return/2026-05-15",
  });

  assert.deepEqual(model, {
    state: "loading",
    loading: {
      title: "Loading flight results",
      description: "Checking schedules, timing, and prices for this route.",
      placeholderCount: 3,
    },
  });
});

test("returns an empty renderer state with revise-search actions", () => {
  const model = resolveFlightResultsRendererModel(buildSuccessPage(0), {
    currentPath: "/flights/search/ORL-LAX/2026-05-10/return/2026-05-15",
  });

  assert.equal(model.state, "empty");
  if (model.state !== "empty") {
    assert.fail("expected an empty renderer state");
  }

  assert.equal(model.summary.resultCountLabel, "0 results");
  assert.deepEqual(model.empty, {
    title: "No flights were found for this search.",
    description: "Try different dates, nearby airports, or a different route.",
    primaryAction: {
      label: "Revise search",
      href: "/flights?itineraryType=round-trip&from=ORL&to=LAX&depart=2026-05-10&return=2026-05-15",
    },
    secondaryAction: {
      label: "Start a new search",
      href: "/flights",
    },
  });
});

test("returns a safe error renderer state for malformed route failures", () => {
  const model = resolveFlightResultsRendererModel(
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
      currentPath: "/flights/search/not-a-valid-route",
    },
  );

  assert.deepEqual(model, {
    state: "error",
    error: {
      title: "This flight search link is incomplete.",
      description: "The URL did not match a supported Andacity flight search route.",
      statusLabel: "HTTP 400",
      routeLabel: null,
      retryHref: "/flights/search/not-a-valid-route",
      retryLabel: "Try again",
      backToSearchHref: "/flights",
      backToSearchLabel: "Start a new search",
    },
  });
});

test("returns a results renderer state with stable card count and summary", () => {
  const model = resolveFlightResultsRendererModel(buildSuccessPage(2), {
    currentPath: "/flights/search/ORL-LAX/2026-05-10/return/2026-05-15",
  });

  assert.equal(model.state, "results");
  if (model.state !== "results") {
    assert.fail("expected a results renderer state");
  }

  assert.equal(model.summary.routeTitle, "ORL -> LAX");
  assert.equal(model.cards.length, 2);
  assert.ok(model.cards.every((card) => card.ctaLabel === "Select flight"));
});
