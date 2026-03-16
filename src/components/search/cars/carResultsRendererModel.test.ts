import assert from "node:assert/strict";
import test from "node:test";

const helperModule: typeof import("./carResultsRendererModel.ts") = await import(
  new URL("./carResultsRendererModel.ts", import.meta.url).href
);

const { resolveCarResultsRendererModel } = helperModule;

const buildSuccessPage = (cardCount = 1) => ({
  status: 200 as const,
  request: {
    type: "car" as const,
    airport: "LAX",
    pickupDate: "2026-05-10",
    dropoffDate: "2026-05-15",
  },
  metadata: {
    vertical: "car" as const,
    totalResults: cardCount,
    providersQueried: ["car-test-provider"],
    cacheHit: false,
    searchTimeMs: 12,
  },
  results: [],
  ui: {
    summary: {
      searchTitle: "LAX airport car rentals",
      pickupCode: "LAX",
      dropoffCode: "LAX",
      pickupDateLabel: "May 10, 2026",
      dropoffDateLabel: "May 15, 2026",
      rentalLengthDays: 5,
      rentalLengthLabel: "5 days",
      resultCount: cardCount,
      resultCountLabel: `${cardCount} result${cardCount === 1 ? "" : "s"}`,
      statusLabel: "Fresh provider results",
      metadataBadges: ["Fresh provider results", "Search time 12ms"],
    },
    cards: Array.from({ length: cardCount }).map((_, index) => ({
      id: `car-${index + 1}`,
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
    })),
  },
});

test("returns a loading renderer state while the canonical route is navigating", () => {
  const model = resolveCarResultsRendererModel(buildSuccessPage(2), {
    isLoading: true,
    currentPath: "/cars/search/LAX/2026-05-10/2026-05-15",
  });

  assert.deepEqual(model, {
    state: "loading",
    loading: {
      title: "Loading car results",
      description: "Checking vehicle availability, policies, and total pricing for this airport.",
      placeholderCount: 3,
    },
  });
});

test("returns an empty renderer state with revise-search actions", () => {
  const model = resolveCarResultsRendererModel(buildSuccessPage(0), {
    currentPath: "/cars/search/LAX/2026-05-10/2026-05-15",
  });

  assert.equal(model.state, "empty");
  if (model.state !== "empty") {
    assert.fail("expected an empty renderer state");
  }

  assert.equal(model.summary.rentalLengthLabel, "5 days");
  assert.deepEqual(model.empty, {
    title: "No cars were found for this search.",
    description: "Try different dates, a nearby airport, or another pickup location.",
    primaryAction: {
      label: "Revise search",
      href: "/car-rentals?q=LAX&pickupDate=2026-05-10&dropoffDate=2026-05-15",
    },
    secondaryAction: {
      label: "Start a new search",
      href: "/car-rentals",
    },
  });
});

test("returns a partial renderer state while more provider batches are loading", () => {
  const model = resolveCarResultsRendererModel(
    {
      ...buildSuccessPage(2),
      progress: {
        endpoint: "/api/search?incremental=1&route=%2Fcars%2Fsearch%2FLAX%2F2026-05-10%2F2026-05-15",
        searchKey: "car:LAX:2026-05-10:2026-05-15",
        status: "partial" as const,
        cursor: 1,
      },
    },
    {
      currentPath: "/cars/search/LAX/2026-05-10/2026-05-15",
    },
  );

  assert.equal(model.state, "partial");
  if (model.state !== "partial") {
    assert.fail("expected a partial renderer state");
  }

  assert.equal(model.cards.length, 2);
  assert.equal(model.loading.title, "Loading car results");
});

test("returns a safe error renderer state for malformed route failures", () => {
  const model = resolveCarResultsRendererModel(
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
      currentPath: "/cars/search/not-a-valid-route",
    },
  );

  assert.deepEqual(model, {
    state: "error",
    error: {
      title: "This car search link is incomplete.",
      description: "The URL did not match a supported Andacity car search route.",
      statusLabel: "HTTP 400",
      routeLabel: null,
      retryHref: "/cars/search/not-a-valid-route",
      retryLabel: "Try again",
      backToSearchHref: "/car-rentals",
      backToSearchLabel: "Start a new search",
    },
  });
});

test("returns a results renderer state with stable card count and summary", () => {
  const model = resolveCarResultsRendererModel(buildSuccessPage(2), {
    currentPath: "/cars/search/LAX/2026-05-10/2026-05-15",
  });

  assert.equal(model.state, "results");
  if (model.state !== "results") {
    assert.fail("expected a results renderer state");
  }

  assert.equal(model.summary.searchTitle, "LAX airport car rentals");
  assert.equal(model.cards.length, 2);
  assert.ok(model.cards.every((card) => card.ctaLabel === "Select car"));
});
