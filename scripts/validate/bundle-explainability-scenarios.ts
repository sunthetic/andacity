import assert from "node:assert/strict";
import {
  buildCarPriceDisplay,
  buildFlightPriceDisplay,
  buildHotelPriceDisplay,
  type PriceDisplayContract,
} from "../../src/lib/pricing/price-display";
import { buildTripEditBundleImpact } from "../../src/lib/trips/bundle-swap-impact";
import { buildSuggestionExplanation } from "../../src/lib/trips/bundling-suggestion-service.server";
import type {
  TripBundlingGap,
  TripBundlingPricingContext,
  TripItemType,
} from "../../src/types/trips/trip";

const toDisplayedBaseCents = (
  display: PriceDisplayContract,
  fallbackPriceCents: number,
) =>
  Math.round((display.baseTotalAmount ?? display.baseAmount ?? 0) * 100) ||
  fallbackPriceCents;

const baseGap = (
  overrides: Partial<TripBundlingGap>,
): TripBundlingGap => ({
  id: "gap:demo",
  gapType: "missing_lodging",
  priority: "medium",
  targetItemType: "hotel",
  title: "Add hotel",
  description: "The current itinerary leaves nights uncovered.",
  startDate: "2026-04-15",
  endDate: "2026-04-17",
  cityId: 1,
  cityName: "Austin",
  originCityId: 2,
  originCityName: "Denver",
  destinationCityId: 1,
  destinationCityName: "Austin",
  relatedItemIds: [11],
  ...overrides,
});

const pricing: TripBundlingPricingContext = {
  currencyCode: "USD",
  snapshotTotalCents: 84000,
  hasMixedCurrencies: false,
};

const buildScenario = (input: {
  label: string;
  itemType: TripItemType;
  gap: TripBundlingGap;
  tripPricing: TripBundlingPricingContext | null;
  display: PriceDisplayContract;
  fallbackPriceCents: number;
  inventory: Parameters<typeof buildSuggestionExplanation>[0]["inventory"];
}) => {
  const displayedBaseCents = toDisplayedBaseCents(
    input.display,
    input.fallbackPriceCents,
  );
  const explanation = buildSuggestionExplanation({
    gap: input.gap,
    itemType: input.itemType,
    startDate: input.gap.startDate,
    endDate: input.gap.endDate,
    cityName: input.gap.cityName,
    tripPricing: input.tripPricing,
    inventory: input.inventory,
    displayedBaseCents,
  });

  return {
    label: input.label,
    explanation,
  };
};

const strongHotel = buildScenario({
  label: "strong-hotel",
  itemType: "hotel",
  gap: baseGap({
    id: "gap:hotel-strong",
    gapType: "missing_lodging",
    priority: "high",
    targetItemType: "hotel",
    title: "Add hotel for the stay",
    description: "The trip arrives in Austin without lodging for the stay.",
  }),
  tripPricing: pricing,
  display: buildHotelPriceDisplay({
    currencyCode: "USD",
    nightlyRate: 160,
    nights: 2,
  }),
  fallbackPriceCents: 16000,
  inventory: {
    currencyCode: "USD",
    availabilityConfidence: {
      degraded: false,
      match: "exact",
      label: "Available",
      supportText: null,
    },
    explainability: {
      cheapestExactMatchPriceCents: 16000,
      preferredLocationType: null,
      selectedLocationType: null,
    },
  },
});

assert.equal(strongHotel.explanation.strength.level, "strong");
assert.equal(
  strongHotel.explanation.savings.pricePosition,
  "lowest_exact_match",
);
assert.match(strongHotel.explanation.savings.summary, /Base total trace:/);
assert.match(
  strongHotel.explanation.savings.summary,
  /No cheaper exact match was found/,
);

const tentativeCar = buildScenario({
  label: "tentative-car",
  itemType: "car",
  gap: baseGap({
    id: "gap:car-tentative",
    gapType: "arrival_ground_transport",
    priority: "low",
    targetItemType: "car",
    title: "Add ground transport",
    description: "The arrival leg lands without ground transport.",
    startDate: "2026-04-15",
    endDate: "2026-04-16",
  }),
  tripPricing: {
    currencyCode: null,
    snapshotTotalCents: null,
    hasMixedCurrencies: true,
  },
  display: buildCarPriceDisplay({
    currencyCode: "USD",
    dailyRate: 92,
    days: 1,
  }),
  fallbackPriceCents: 9200,
  inventory: {
    currencyCode: "USD",
    availabilityConfidence: {
      degraded: false,
      match: "exact",
      label: "Available",
      supportText: null,
    },
    explainability: {
      cheapestExactMatchPriceCents: 6100,
      preferredLocationType: "airport",
      selectedLocationType: "city",
    },
  },
});

assert.equal(tentativeCar.explanation.strength.level, "tentative");
assert.equal(
  tentativeCar.explanation.savings.pricePosition,
  "above_lowest_exact_match",
);
assert.match(
  tentativeCar.explanation.savings.summary,
  /Full projected base total is withheld because this trip mixes currencies/,
);
assert.ok(
  tentativeCar.explanation.tradeoffs.some((entry) =>
    entry.includes("preferred airport"),
  ),
);

const moderateFlight = buildScenario({
  label: "moderate-flight",
  itemType: "flight",
  gap: baseGap({
    id: "gap:flight-moderate",
    gapType: "missing_return_flight",
    priority: "high",
    targetItemType: "flight",
    title: "Add return flight",
    description: "The trip ends away from home without a return flight.",
    startDate: "2026-04-20",
    endDate: "2026-04-20",
    cityName: "Austin",
    originCityName: "Austin",
    destinationCityName: "Denver",
  }),
  tripPricing: pricing,
  display: buildFlightPriceDisplay({
    currencyCode: "USD",
    fare: 240,
    travelers: 1,
  }),
  fallbackPriceCents: 24000,
  inventory: {
    currencyCode: "USD",
    serviceDate: "2026-04-21",
    availabilityConfidence: {
      degraded: true,
      match: "partial",
      label: "Partial match",
      supportText: "Requested Apr 20, 2026. Closest stored option is Apr 21, 2026.",
    },
    explainability: {
      cheapestExactMatchPriceCents: 21000,
      preferredLocationType: null,
      selectedLocationType: null,
    },
  },
});

assert.equal(moderateFlight.explanation.strength.level, "tentative");
assert.ok(
  moderateFlight.explanation.tradeoffs.some((entry) =>
    entry.includes("Closest stored option"),
  ),
);
assert.ok(moderateFlight.explanation.constraints[0]?.includes("Connects Austin"));

const overrideHotel = buildScenario({
  label: "override-hotel",
  itemType: "hotel",
  gap: baseGap({
    id: "gap:hotel-override",
    gapType: "missing_lodging",
    priority: "high",
    targetItemType: "hotel",
    title: "Swap bundled hotel",
    description: "Keep this arrival stay covered without rebuilding the trip.",
  }),
  tripPricing: null,
  display: buildHotelPriceDisplay({
    currencyCode: "USD",
    nightlyRate: 182,
    nights: 2,
  }),
  fallbackPriceCents: 18200,
  inventory: {
    currencyCode: "USD",
    availabilityConfidence: {
      degraded: true,
      match: "partial",
      label: "Needs recheck",
      supportText:
        "A newer stay snapshot is not available yet, so exact dates could not be reconfirmed.",
    },
    explainability: {
      cheapestExactMatchPriceCents: 16000,
      preferredLocationType: null,
      selectedLocationType: null,
    },
  },
});

const bundleImpact = buildTripEditBundleImpact({
  currentMetadata: {
    smartBundling: {
      generatedAt: "2026-03-10T10:00:00.000Z",
      gapId: "gap:hotel-strong",
      gapType: "missing_lodging",
      relatedItemIds: [11, 12],
      suggestionType: "add_hotel_near_arrival",
      selectionMode: "recommended",
      originalInventoryId: 501,
      currentInventoryId: 501,
      context: {
        priority: "high",
        itemType: "hotel",
        title: "Add hotel for the stay",
        description: "The trip arrives in Austin without lodging for the stay.",
        startDate: "2026-04-15",
        endDate: "2026-04-17",
        cityId: 1,
        cityName: "Austin",
        originCityId: 2,
        originCityName: "Denver",
        destinationCityId: 1,
        destinationCityName: "Austin",
      },
      explanation: strongHotel.explanation,
    },
  },
  nextMetadata: {
    smartBundling: {
      generatedAt: "2026-03-10T10:05:00.000Z",
      gapId: "gap:hotel-strong",
      gapType: "missing_lodging",
      relatedItemIds: [11, 12],
      suggestionType: "add_hotel_near_arrival",
      selectionMode: "manual_override",
      originalInventoryId: 501,
      currentInventoryId: 777,
      context: {
        priority: "high",
        itemType: "hotel",
        title: "Swap bundled hotel",
        description: "Keep this arrival stay covered without rebuilding the trip.",
        startDate: "2026-04-15",
        endDate: "2026-04-17",
        cityId: 1,
        cityName: "Austin",
        originCityId: 2,
        originCityName: "Denver",
        destinationCityId: 1,
        destinationCityName: "Austin",
      },
      explanation: overrideHotel.explanation,
    },
  },
  focusItemId: 9001,
  nextTripItemIds: [9001, 11],
});

assert.equal(bundleImpact?.selectionMode, "manual_override");
assert.deepEqual(bundleImpact?.preservedRelatedItemIds, [11]);
assert.match(bundleImpact?.strengthSummary || "", /Bundle fit/);
assert.match(bundleImpact?.savingsSummary || "", /Savings position/);
assert.ok(
  bundleImpact?.limitations.some((entry) => entry.includes("manual override")),
);

for (const scenario of [
  strongHotel,
  tentativeCar,
  moderateFlight,
  overrideHotel,
]) {
  process.stdout.write(
    `${scenario.label}: ${scenario.explanation.strength.label} | ${scenario.explanation.summary}\n`,
  );
}

process.stdout.write(
  `bundle-override: ${bundleImpact?.strengthSummary} | ${bundleImpact?.savingsSummary}\n`,
);
