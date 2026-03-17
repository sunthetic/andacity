import { component$ } from "@builder.io/qwik";
import { FlightFilters, type FlightFilterGroup } from "~/components/flights/FlightFilters";
import { ResultsShell } from "~/components/results/ResultsShell";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { FlightResultsList } from "~/components/search/flights/FlightResultsList";
import { mapFlightResultCardForUi } from "~/server/search/mapFlightResultsForUi";
import type { CanonicalFlightSearchPageSuccess } from "~/server/search/loadCanonicalFlightSearchPage";
import {
  FLIGHT_SORT_OPTIONS,
  normalizeFlightSortValue,
  type FlightSortKey,
} from "~/lib/search/flights/flight-sort-options";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import {
  parseFlightsSelectedFilters,
  type FlightPriceBand,
  type FlightSearchFacets,
} from "~/lib/search/flights/filter-types";
import { buildFlightSearchEditorHref } from "~/components/search/flights/flightResultsRendererModel";
import type { FlightSearchEntity } from "~/types/search-entity";
import type { FlightCabinClass, FlightTimeWindow } from "~/types/flights/search";

const FLIGHT_FILTER_KEYS = [
  "nonstop",
  "stops",
  "maxStops",
  "departureWindow",
  "departWindow",
  "arrivalWindow",
  "cabin",
  "cabinClass",
  "priceBand",
  "price",
  "priceRange",
] as const;

const FLIGHT_WINDOW_LABELS: Record<FlightTimeWindow, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  overnight: "Overnight",
};

const PRICE_BANDS: { label: string; value: FlightPriceBand }[] = [
  { label: "Under $200", value: "under-200" },
  { label: "$200-$400", value: "200-400" },
  { label: "$400-$700", value: "400-700" },
  { label: "$700+", value: "700-plus" },
];

const normalizeToken = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toSearchHref = (pathname: string, state: ReturnType<typeof searchStateFromUrl>) =>
  searchStateToUrl(
    pathname,
    {
      ...state,
      query: "",
      location: undefined,
      dates: undefined,
    },
    {
      includeQueryParam: false,
      includeLocationParams: false,
    },
  );

const parseIsoDateTime = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const deriveFlightWindow = (
  value: string | null | undefined,
): FlightTimeWindow | null => {
  const date = parseIsoDateTime(value);
  if (!date) return null;
  const hour = date.getUTCHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "overnight";
};

const deriveStopCount = (result: FlightSearchEntity): 0 | 1 | 2 => {
  const raw =
    typeof result.metadata.stops === "number"
      ? result.metadata.stops
      : Math.max(0, (result.payload.segments?.length || 1) - 1);

  if (raw <= 0) return 0;
  if (raw === 1) return 1;
  return 2;
};

const deriveDurationMinutes = (result: FlightSearchEntity) => {
  if (typeof result.metadata.durationMinutes === "number") {
    return result.metadata.durationMinutes;
  }

  const departureAt = parseIsoDateTime(result.payload.departureAt);
  const arrivalAt = parseIsoDateTime(result.payload.arrivalAt);
  if (departureAt && arrivalAt) {
    return Math.max(
      0,
      Math.round((arrivalAt.getTime() - departureAt.getTime()) / 60000),
    );
  }

  return Number.MAX_SAFE_INTEGER;
};

const deriveCabinClass = (result: FlightSearchEntity): FlightCabinClass | "" => {
  const token = normalizeToken(String(result.payload.cabinClass || ""));
  if (
    token === "economy" ||
    token === "premium-economy" ||
    token === "business" ||
    token === "first"
  ) {
    return token;
  }

  return "";
};

const formatCabinLabel = (value: FlightCabinClass) => {
  switch (value) {
    case "premium-economy":
      return "Premium Economy";
    case "business":
      return "Business";
    case "first":
      return "First";
    default:
      return "Economy";
  }
};

const toPriceAmount = (result: FlightSearchEntity) =>
  typeof result.price.amountCents === "number"
    ? Math.max(0, Math.round(result.price.amountCents / 100))
    : Number.MAX_SAFE_INTEGER;

const inPriceBand = (amount: number, band: FlightPriceBand | "") => {
  if (!Number.isFinite(amount)) return false;
  if (band === "under-200") return amount < 200;
  if (band === "200-400") return amount >= 200 && amount <= 400;
  if (band === "400-700") return amount > 400 && amount <= 700;
  if (band === "700-plus") return amount > 700;
  return true;
};

const buildFlightFacets = (results: FlightSearchEntity[]): FlightSearchFacets => {
  const departureWindows = Array.from(
    new Set(
      results
        .map((result) => deriveFlightWindow(result.payload.departureAt))
        .filter((value): value is FlightTimeWindow => Boolean(value)),
    ),
  );
  const arrivalWindows = Array.from(
    new Set(
      results
        .map((result) => deriveFlightWindow(result.payload.arrivalAt))
        .filter((value): value is FlightTimeWindow => Boolean(value)),
    ),
  );
  const cabinClasses = Array.from(
    new Set(
      results
        .map((result) => deriveCabinClass(result))
        .filter((value): value is FlightCabinClass => Boolean(value)),
    ),
  );
  const maxStops = Array.from(new Set(results.map((result) => deriveStopCount(result)))).sort(
    (a, b) => a - b,
  ) as (0 | 1 | 2)[];

  return {
    departureWindows,
    arrivalWindows,
    cabinClasses,
    maxStops,
  };
};

const buildQuerySummary = (page: CanonicalFlightSearchPageSuccess) => {
  const parts = [`Flights ${page.request.origin} to ${page.request.destination}`];
  parts.push(page.ui.summary.tripTypeLabel);

  if (page.ui.summary.returnDateLabel) {
    parts.push(
      `${page.ui.summary.departDateLabel}-${page.ui.summary.returnDateLabel}`,
    );
  } else {
    parts.push(`Depart ${page.ui.summary.departDateLabel}`);
  }

  return parts.join(" · ");
};

const compareByActiveSort = (
  activeSort: FlightSortKey,
  left: FlightSearchEntity,
  right: FlightSearchEntity,
) => {
  if (activeSort === "price-asc") {
    return toPriceAmount(left) - toPriceAmount(right);
  }

  if (activeSort === "duration") {
    return deriveDurationMinutes(left) - deriveDurationMinutes(right);
  }

  if (activeSort === "departure-asc") {
    const leftTime = parseIsoDateTime(left.payload.departureAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    const rightTime = parseIsoDateTime(right.payload.departureAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  }

  return 0;
};

export const CanonicalFlightResultsSection = component$(
  (props: CanonicalFlightResultsSectionProps) => {
    const url = new URL(props.currentPath, "https://andacity.test");
    const searchState = searchStateFromUrl(url, {
      dates: {
        checkIn: props.page.request.departDate,
        checkOut: props.page.request.returnDate || undefined,
      },
      sort: "recommended",
      page: 1,
    });
    const activeSort = normalizeFlightSortValue(searchState.sort);
    const selectedFilters = parseFlightsSelectedFilters(searchState.filters || {});
    const preservedFilterKeys = Object.keys(searchState.filters || {}).filter(
      (key) =>
        !FLIGHT_FILTER_KEYS.includes(
          key as (typeof FLIGHT_FILTER_KEYS)[number],
        ),
    );
    const pathname = url.pathname;
    const toHref = (nextState: typeof searchState) =>
      toSearchHref(pathname, nextState);
    const facets = buildFlightFacets(props.page.results);

    const filteredResults = props.page.results.filter((result) => {
      if (
        selectedFilters.maxStops != null &&
        deriveStopCount(result) > selectedFilters.maxStops
      ) {
        return false;
      }

      if (
        selectedFilters.departureWindows.length &&
        !selectedFilters.departureWindows.includes(
          deriveFlightWindow(result.payload.departureAt) || "overnight",
        )
      ) {
        return false;
      }

      if (
        selectedFilters.arrivalWindows.length &&
        !selectedFilters.arrivalWindows.includes(
          deriveFlightWindow(result.payload.arrivalAt) || "overnight",
        )
      ) {
        return false;
      }

      if (
        selectedFilters.cabinClass &&
        deriveCabinClass(result) !== selectedFilters.cabinClass
      ) {
        return false;
      }

      if (
        selectedFilters.priceBand &&
        !inPriceBand(toPriceAmount(result), selectedFilters.priceBand)
      ) {
        return false;
      }

      return true;
    });

    const sortedResults =
      activeSort === "recommended"
        ? filteredResults
        : filteredResults
            .slice()
            .sort((left, right) => compareByActiveSort(activeSort, left, right));

    const filterGroups: FlightFilterGroup[] = [
      {
        title: "Stops",
        options: facets.maxStops.map((value) => ({
          label:
            value === 0 ? "Nonstop" : value === 1 ? "Up to 1 stop" : "Up to 2 stops",
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "maxStops",
              String(value),
              normalizeToken,
            ),
          ),
          active: selectedFilters.maxStops === value,
        })),
      },
      {
        title: "Departure window",
        options: facets.departureWindows.map((value) => ({
          label: FLIGHT_WINDOW_LABELS[value],
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "departureWindow",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.departureWindows.includes(value),
        })),
      },
      {
        title: "Arrival window",
        options: facets.arrivalWindows.map((value) => ({
          label: FLIGHT_WINDOW_LABELS[value],
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "arrivalWindow",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.arrivalWindows.includes(value),
        })),
      },
      {
        title: "Cabin class",
        options: facets.cabinClasses.map((value) => ({
          label: formatCabinLabel(value),
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "cabin",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.cabinClass === value,
        })),
      },
      {
        title: "Price band",
        options: PRICE_BANDS.map((option) => ({
          label: option.label,
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "priceBand",
              option.value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.priceBand === option.value,
        })),
      },
    ].filter((group) => group.options.length > 0);

    const activeFilterChips = buildResultsFilterChips(filterGroups);
    const clearAllFiltersHref = toHref(
      clearSearchStateFilters(searchState, preservedFilterKeys),
    );
    const cards = sortedResults.map((result) => mapFlightResultCardForUi(result));
    const hasProviderResults = props.page.results.length > 0;
    const emptyTitle = activeFilterChips.length
      ? "No flights match these filters."
      : "No flights were found for this search.";
    const emptyDescription = activeFilterChips.length
      ? "Clear one or more filters to widen the results."
      : "Try different dates, nearby airports, or a different route.";

    return (
      <ResultsShell
        querySummary={buildQuerySummary(props.page)}
        editSearchHref={buildFlightSearchEditorHref(props.page.request)}
        filtersTitle="Flight filters"
        asyncState={props.isNavigating ? "refreshing" : undefined}
        refreshingOverlayLabel="Updating flights"
        controlsDisabled={props.isNavigating}
        resultCountLabel={`${cards.length.toLocaleString("en-US")} flights`}
        sortId="canonical-flight-results-sort"
        sortOptions={FLIGHT_SORT_OPTIONS.map((option) => ({
          ...option,
          href: toHref(withSearchStateSort(searchState, option.value)),
          active: activeSort === option.value,
        }))}
        activeFilterChips={activeFilterChips}
        clearAllFiltersHref={activeFilterChips.length ? clearAllFiltersHref : undefined}
        empty={
          cards.length
            ? undefined
            : {
                title: emptyTitle,
                description: emptyDescription,
                primaryAction: activeFilterChips.length
                  ? {
                      label: "Clear filters",
                      href: clearAllFiltersHref,
                    }
                  : {
                      label: "Revise search",
                      href: buildFlightSearchEditorHref(props.page.request),
                    },
                secondaryAction: {
                  label: hasProviderResults ? "Edit search" : "Start a new search",
                  href: hasProviderResults
                    ? buildFlightSearchEditorHref(props.page.request)
                    : "/flights",
                },
              }
        }
      >
        <FlightFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "flights",
            surface: "search_results",
          }}
        />
        <FlightFilters
          q:slot="filters-mobile"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "flights",
            surface: "search_results",
          }}
        />

        {props.page.progress?.status === "partial" ? (
          <div class="mb-4 rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
            <p class="font-semibold text-[color:var(--color-text)]">
              Loading more flight results
            </p>
            <p class="mt-1">
              Additional fares and schedules are still arriving. Current results remain filterable while the search finishes.
            </p>
          </div>
        ) : null}

        {cards.length ? <FlightResultsList cards={cards} /> : null}
      </ResultsShell>
    );
  },
);

type CanonicalFlightResultsSectionProps = {
  page: CanonicalFlightSearchPageSuccess;
  currentPath: string;
  isNavigating?: boolean;
};
