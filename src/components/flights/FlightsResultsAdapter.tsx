import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { FlightCard } from "~/components/flights/FlightCard";
import { FlightFilters } from "~/components/flights/FlightFilters";
import type { FlightFilterGroup } from "~/components/flights/FlightFilters";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { ResultsShell } from "~/components/results/ResultsShell";
import {
  isCompared,
  isShortlisted,
  useDecisioning,
} from "~/components/save-compare/DecisioningProvider";
import { CompareSheet } from "~/components/save-compare/CompareSheet";
import { CompareTray } from "~/components/save-compare/CompareTray";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import {
  buildFlightPriceDisplay,
  describePriceChangeCollection,
  type PriceChange,
} from "~/lib/pricing/price-display";
import {
  buildRefreshPriceChangeMap,
  consumeRefreshPriceSnapshot,
  storeRefreshPriceSnapshot,
} from "~/lib/pricing/refresh-price-snapshot";
import { buildFlightSavedItem } from "~/lib/save-compare/item-builders";
import {
  FLIGHT_SORT_OPTIONS,
  type FlightSortKey,
} from "~/lib/search/flights/flight-sort-options";
import type {
  FlightSearchFacets,
  FlightsSelectedFilters,
} from "~/lib/search/flights/filter-types";
import type { FlightItineraryTypeSlug } from "~/lib/search/flights/routing";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import { canOpenCompare } from "~/lib/save-compare/compare-state";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStateFilters,
  withSearchStatePage,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import type { FlightResult } from "~/types/flights/search";
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { SearchState } from "~/types/search/state";

const FLIGHTS_VERTICAL = "flights" as const;
const FLIGHT_RESULTS_FILTER_KEYS = [
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

const normalizeToken = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const titleCase = (token: string) =>
  normalizeToken(token)
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const formatDate = (isoDate: string | undefined) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-").map((x) => Number.parseInt(x, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const buildQuerySummary = (
  fromLabel: string,
  toLabel: string,
  itineraryType: FlightItineraryTypeSlug,
  depart?: string,
  ret?: string,
) => {
  const parts = [`Flights from ${fromLabel} to ${toLabel}`];
  parts.push(itineraryType === "one-way" ? "One-way" : "Round-trip");

  const departLabel = formatDate(depart);
  const returnLabel = formatDate(ret);

  if (itineraryType === "one-way" && departLabel) {
    parts.push(`Depart ${departLabel}`);
  } else if (departLabel && returnLabel) {
    parts.push(`${departLabel}–${returnLabel}`);
  } else if (departLabel) {
    parts.push(`Depart ${departLabel}`);
  }

  return parts.join(" · ");
};

const withMaxStopsToggle = (
  state: SearchState,
  value: "0" | "1" | "2",
): SearchState => {
  return withSearchStateFilters(state, (filters) => {
    delete filters.nonstop;
    delete filters.stops;

    const current = String(filters.maxStops || "").trim();
    if (current === value) {
      delete filters.maxStops;
    } else {
      filters.maxStops = value;
    }

    return filters;
  });
};

const buildPageLinks = (
  page: number,
  totalPages: number,
  toHref: (pageNumber: number) => string,
) => {
  const links: { label: string; href: string; active?: boolean }[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let current = start; current <= end; current += 1) {
    links.push({
      label: String(current),
      href: toHref(current),
      active: current === page,
    });
  }

  return links;
};

const stopLabel = (value: 0 | 1 | 2) => {
  if (value === 0) return "Nonstop";
  if (value === 1) return "Up to 1 stop";
  return "Up to 2 stops";
};

const toTravelerCount = (value: unknown) => {
  const count = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.min(count, 9);
};

export const FlightsResultsAdapter = component$(
  (props: FlightsResultsAdapterProps) => {
    const decisioning = useDecisioning();
    const location = useLocation();
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(props.basePath, nextState, {
        includeQueryParam: false,
        includeLocationParams: false,
        dateParamKeys: { checkIn: "depart", checkOut: "return" },
      });

    const preservedFilterKeys = Object.keys(
      props.searchState.filters || {},
    ).filter(
      (key) =>
        !FLIGHT_RESULTS_FILTER_KEYS.includes(
          key as (typeof FLIGHT_RESULTS_FILTER_KEYS)[number],
        ),
    );
    const pageItems = props.results;
    const travelers = toTravelerCount(props.searchState.filters?.travelers);
    const refreshHref = toHref(
      withSearchStatePage(props.searchState, props.page),
    );
    const refreshSnapshotId = `flight-results:${refreshHref}`;
    const visibleInventoryIds = pageItems.flatMap((result) =>
      result.itineraryId != null ? [result.itineraryId] : [],
    );
    const priceDisplays = pageItems.map((result) =>
      buildFlightPriceDisplay({
        currencyCode: result.currency,
        fare: result.price,
        travelers,
      }),
    );
    const refreshPriceChanges = useSignal<Record<string, PriceChange>>({});
    const refreshPriceSummary = useSignal<string | null>(null);
    const availabilitySignals = summarizeAvailabilitySignals(pageItems);
    const asyncState = resolveAvailabilityAsyncState({
      itemCount: props.totalCount,
      isRefreshing: location.isNavigating,
      isFailed: Boolean(props.loadError),
      signals: availabilitySignals,
    });
    const controlsDisabled = location.isNavigating || asyncState === "failed";
    const statusNotice = buildFlightResultsStatusNotice(asyncState, {
      partialCount: availabilitySignals.partialCount,
      staleCount: availabilitySignals.staleCount,
      failedCount: availabilitySignals.failedCount,
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      const previousEntries = consumeRefreshPriceSnapshot(refreshSnapshotId);
      if (!previousEntries.length) {
        refreshPriceChanges.value = {};
        refreshPriceSummary.value = null;
        return;
      }

      const nextChanges = buildRefreshPriceChangeMap(
        previousEntries,
        pageItems.map((result) => ({
          id: result.id,
          amount: result.price,
          currencyCode: result.currency,
        })),
        "Base fare",
      );

      refreshPriceChanges.value = nextChanges;
      refreshPriceSummary.value = describePriceChangeCollection(
        Object.values(nextChanges),
      );
    });

    const onToggleSave$ = $((item: SavedItem) => {
      decisioning.toggleShortlist$(FLIGHTS_VERTICAL, item);
    });

    const onToggleCompare$ = $((item: SavedItem) => {
      decisioning.toggleCompare$(FLIGHTS_VERTICAL, item);
    });

    const onOpenCompare$ = $(() => {
      if (!canOpenCompare(decisioning.state.compare[FLIGHTS_VERTICAL].length))
        return;
      decisioning.openCompare$(FLIGHTS_VERTICAL);
    });

    const onClearCompare$ = $(() => {
      decisioning.clearComparedItems$(FLIGHTS_VERTICAL);
    });

    const onRevalidateVisibleResults$ = $(async () => {
      if (!visibleInventoryIds.length) {
        throw new Error("No visible flight inventory can be revalidated.");
      }

      storeRefreshPriceSnapshot(
        refreshSnapshotId,
        pageItems.map((result) => ({
          id: result.id,
          amount: result.price,
          currencyCode: result.currency,
        })),
      );

      await revalidateInventoryApi({
        itemType: "flight",
        inventoryIds: visibleInventoryIds,
      });
    });

    const comparedItems = decisioning.state.compare[FLIGHTS_VERTICAL];
    const canCompare = canOpenCompare(comparedItems.length);

    const sortOptions: ResultsSortOption[] = FLIGHT_SORT_OPTIONS.map(
      (option) => ({
        label: option.label,
        value: option.value,
        active: props.activeSort === option.value,
        href: toHref(withSearchStateSort(props.searchState, option.value)),
      }),
    );

    const stopFilters = props.filterFacets.maxStops.map((value) => ({
      label: stopLabel(value),
      href: toHref(
        withMaxStopsToggle(props.searchState, String(value) as "0" | "1" | "2"),
      ),
      active: props.selectedFilters.maxStops === value,
    }));

    const departureFilters = props.filterFacets.departureWindows.map(
      (window) => ({
        label: titleCase(window),
        href: toHref(
          withSearchStateArrayToggle(
            props.searchState,
            "departureWindow",
            window,
            normalizeToken,
          ),
        ),
        active: props.selectedFilters.departureWindows.includes(window),
      }),
    );

    const arrivalFilters = props.filterFacets.arrivalWindows.map((window) => ({
      label: titleCase(window),
      href: toHref(
        withSearchStateArrayToggle(
          props.searchState,
          "arrivalWindow",
          window,
          normalizeToken,
        ),
      ),
      active: props.selectedFilters.arrivalWindows.includes(window),
    }));

    const cabinFilters = props.filterFacets.cabinClasses.map((value) => ({
      label: titleCase(value),
      href: toHref(
        withSearchStateSingleToggle(
          props.searchState,
          "cabin",
          value,
          normalizeToken,
        ),
      ),
      active: props.selectedFilters.cabinClass === value,
    }));

    const priceBands: {
      label: string;
      value: "under-200" | "200-400" | "400-700" | "700-plus";
    }[] = [
      { label: "Under $200", value: "under-200" },
      { label: "$200–$400", value: "200-400" },
      { label: "$400–$700", value: "400-700" },
      { label: "$700+", value: "700-plus" },
    ];

    const priceFilters = priceBands.map((option) => ({
      label: option.label,
      href: toHref(
        withSearchStateSingleToggle(
          props.searchState,
          "priceBand",
          option.value,
          normalizeToken,
        ),
      ),
      active: props.selectedFilters.priceBand === option.value,
    }));

    const filterGroups: FlightFilterGroup[] = [
      { title: "Stops", options: stopFilters },
      { title: "Departure window", options: departureFilters },
      { title: "Arrival window", options: arrivalFilters },
      { title: "Cabin class", options: cabinFilters },
      { title: "Price band", options: priceFilters },
    ].filter((group) => group.options.length > 0);
    const activeFilterChips = buildResultsFilterChips(filterGroups);
    const clearAllFiltersHref = toHref(
      clearSearchStateFilters(props.searchState, preservedFilterKeys),
    );

    return (
      <ResultsShell
        querySummary={buildQuerySummary(
          props.fromLabel,
          props.toLabel,
          props.itineraryType,
          props.searchState.dates?.checkIn,
          props.searchState.dates?.checkOut,
        )}
        editSearchHref={props.editSearchHref}
        refreshControl={{
          id: refreshSnapshotId,
          mode: visibleInventoryIds.length ? "action" : "unsupported",
          onRefresh$: visibleInventoryIds.length
            ? onRevalidateVisibleResults$
            : undefined,
          reloadHref: refreshHref,
          reloadOnSuccess: true,
          label: "Refresh visible availability",
          refreshingLabel: "Refreshing...",
          refreshedLabel: "Availability refreshed",
          failedLabel: "Retry refresh",
          unsupportedLabel: "Refresh unavailable",
          unsupportedMessage:
            "No visible flight inventory can refresh availability right now.",
          successMessage:
            "Visible flight availability was refreshed. Any fare changes are highlighted below.",
          failureMessage:
            "Failed to refresh visible flight availability signals.",
          disabled: controlsDisabled,
        }}
        filtersTitle="Flight filters"
        asyncState={asyncState}
        statusNotice={statusNotice}
        failed={
          props.loadError
            ? {
                title: "Flight results could not be updated",
                description: props.loadError,
                primaryAction: {
                  label: "Retry flight search",
                  href: location.url.pathname + location.url.search,
                },
                secondaryAction: props.emptySecondaryAction || {
                  label: "Search flights again",
                  href: props.editSearchHref || "/flights",
                },
              }
            : undefined
        }
        loadingVariant="list"
        loadingCount={3}
        refreshingOverlayLabel="Updating flights"
        controlsDisabled={controlsDisabled}
        resultCountLabel={`${props.totalCount.toLocaleString("en-US")} flights`}
        sortId="flight-results-sort"
        sortOptions={sortOptions}
        activeFilterChips={activeFilterChips}
        clearAllFiltersHref={clearAllFiltersHref}
        pagination={{
          page: props.page,
          totalPages: props.totalPages,
          prevHref:
            props.page > 1
              ? toHref(withSearchStatePage(props.searchState, props.page - 1))
              : undefined,
          nextHref:
            props.page < props.totalPages
              ? toHref(withSearchStatePage(props.searchState, props.page + 1))
              : undefined,
          pageLinks: buildPageLinks(
            props.page,
            props.totalPages,
            (pageNumber) =>
              toHref(withSearchStatePage(props.searchState, pageNumber)),
          ),
        }}
        empty={
          props.totalCount
            ? undefined
            : {
                title: `No flights match this selection from ${props.fromLabel} to ${props.toLabel}`,
                description:
                  "Try removing a filter, changing sort, or broadening your route and dates.",
                primaryAction: props.emptyPrimaryAction || {
                  label: "Search flights again",
                  href: "/flights",
                },
                secondaryAction: props.emptySecondaryAction || {
                  label: "Explore destinations",
                  href: "/explore",
                },
              }
        }
      >
        <FlightFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={controlsDisabled}
        />
        <FlightFilters
          q:slot="filters-mobile"
          groups={filterGroups}
          disabled={controlsDisabled}
        />

        {refreshPriceSummary.value ? (
          <div class="mb-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
            {refreshPriceSummary.value}
          </div>
        ) : null}

        <div class="grid gap-3">
          {pageItems.map((result, index) => {
            const priceDisplay = {
              ...priceDisplays[index],
              delta: refreshPriceChanges.value[result.id] || null,
            };
            const savedItem = buildFlightSavedItem(
              result,
              priceDisplays[index],
              props.flightCtaHref || props.editSearchHref || "/flights",
            );
            const compared = isCompared(
              decisioning.state,
              FLIGHTS_VERTICAL,
              savedItem.id,
            );

            return (
              <FlightCard
                key={result.id}
                result={result}
                priceDisplay={priceDisplay}
                activeSort={props.activeSort}
                ctaHref={props.flightCtaHref}
                savedItem={savedItem}
                isSaved={isShortlisted(
                  decisioning.state,
                  FLIGHTS_VERTICAL,
                  savedItem.id,
                )}
                onToggleSave$={onToggleSave$}
                isCompared={compared}
                compareDisabled={
                  !compared &&
                  comparedItems.length >= decisioning.state.compareLimit
                }
                onToggleCompare$={onToggleCompare$}
              />
            );
          })}
        </div>

        {comparedItems.length ? (
          <CompareTray
            q:slot="results-overlay"
            vertical={FLIGHTS_VERTICAL}
            compareCount={comparedItems.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearCompare$}
          />
        ) : null}

        <CompareSheet
          q:slot="results-overlay"
          open={
            decisioning.state.compareOpen &&
            decisioning.state.compareVertical === FLIGHTS_VERTICAL &&
            canCompare
          }
          vertical={FLIGHTS_VERTICAL}
          items={comparedItems}
        />
      </ResultsShell>
    );
  },
);

type FlightsResultsAdapterProps = {
  results: FlightResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  activeSort: FlightSortKey;
  selectedFilters: FlightsSelectedFilters;
  filterFacets: FlightSearchFacets;
  searchState: SearchState;
  fromLabel: string;
  toLabel: string;
  itineraryType: FlightItineraryTypeSlug;
  basePath: string;
  editSearchHref?: string;
  flightCtaHref?: string;
  emptyPrimaryAction?: {
    label: string;
    href: string;
  };
  emptySecondaryAction?: {
    label: string;
    href: string;
  };
  loadError?: string | null;
};

const buildFlightResultsStatusNotice = (
  state: BookingAsyncState,
  input: {
    partialCount: number;
    staleCount: number;
    failedCount: number;
  },
) => {
  if (state === "refreshing") {
    return {
      title: "Refreshing flight results",
      message:
        "Updated fares and filters are loading. Current flight options stay visible until the next result set is ready.",
    };
  }

  if (state === "partial") {
    return {
      title: "Some itineraries only partially match",
      message: `${input.partialCount.toLocaleString("en-US")} visible flight result${input.partialCount === 1 ? "" : "s"} no longer exactly match the requested travel date. Refresh availability or broaden the route to compare fresh options.`,
    };
  }

  if (state === "stale") {
    const affected = input.staleCount + input.failedCount;
    return {
      title: "Some fares need recheck",
      message: `${affected.toLocaleString("en-US")} visible flight result${affected === 1 ? "" : "s"} rely on stale or failed availability signals. Refresh visible availability before treating these fares as current.`,
    };
  }

  return undefined;
};
