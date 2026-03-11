import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { CarRentalCard } from "~/components/car-rentals/CarRentalCard";
import { CarRentalFilters } from "~/components/car-rentals/CarRentalFilters";
import type { CarRentalFilterGroup } from "~/components/car-rentals/CarRentalFilters";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { ResultsShell } from "~/components/results/ResultsShell";
import {
  isCompared,
  isShortlisted,
  useDecisioning,
} from "~/components/save-compare/DecisioningProvider";
import { CompareSheet } from "~/components/save-compare/CompareSheet";
import { CompareTray } from "~/components/save-compare/CompareTray";
import { RecentlyViewedModule } from "~/components/save-compare/RecentlyViewedModule";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import {
  buildCarPriceDisplay,
  describePriceChangeCollection,
  type PriceChange,
} from "~/lib/pricing/price-display";
import {
  buildRefreshPriceChangeMap,
  consumeRefreshPriceSnapshot,
  storeRefreshPriceSnapshot,
} from "~/lib/pricing/refresh-price-snapshot";
import {
  buildCarRentalDetailHrefWithDates,
  buildCarResultSavedItem,
} from "~/lib/save-compare/item-builders";
import { canOpenCompare } from "~/lib/save-compare/compare-state";
import { computeDays } from "~/lib/search/car-rentals/dates";
import {
  CAR_RENTALS_SORT_OPTIONS,
  type CarRentalsSortKey,
} from "~/lib/search/car-rentals/car-sort-options";
import type {
  CarRentalsSearchFacets,
  CarRentalsSelectedFilters,
} from "~/lib/search/car-rentals/filter-types";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStatePage,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import type { CarRentalResult } from "~/types/car-rentals/search";
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { SearchState } from "~/types/search/state";

const CARS_VERTICAL = "cars" as const;
const CAR_RESULTS_FILTER_KEYS = [
  "class",
  "vehicleClass",
  "pickup",
  "pickupType",
  "transmission",
  "seats",
  "seatsMin",
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
  queryLabel: string,
  checkIn?: string,
  checkOut?: string,
) => {
  const parts = [`Car rentals in ${queryLabel}`];
  const start = formatDate(checkIn);
  const end = formatDate(checkOut);
  if (start && end) {
    parts.push(`${start}–${end}`);
  }
  return parts.join(" · ");
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

const buildEditSearchHref = (state: SearchState, queryLabel: string) => {
  const sp = new URLSearchParams();
  sp.set("q", state.query || queryLabel);
  if (state.dates?.checkIn) sp.set("pickupDate", state.dates.checkIn);
  if (state.dates?.checkOut) sp.set("dropoffDate", state.dates.checkOut);

  const drivers = String(state.filters?.drivers || "").trim();
  if (drivers) sp.set("drivers", drivers);

  return `/car-rentals?${sp.toString()}`;
};

export const CarRentalsResultsAdapter = component$(
  (props: CarRentalsResultsAdapterProps) => {
    const decisioning = useDecisioning();
    const location = useLocation();
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(props.basePath, nextState, {
        includeQueryParam: props.urlOptions?.includeQueryParam,
        includeLocationParams: props.urlOptions?.includeLocationParams,
        dateParamKeys: props.urlOptions?.dateParamKeys,
      });

    const preservedFilterKeys = Object.keys(
      props.searchState.filters || {},
    ).filter(
      (key) =>
        !CAR_RESULTS_FILTER_KEYS.includes(
          key as (typeof CAR_RESULTS_FILTER_KEYS)[number],
        ),
    );
    const pageItems = props.results;
    const days = computeDays(
      props.searchState.dates?.checkIn || null,
      props.searchState.dates?.checkOut || null,
    );
    const refreshHref = toHref(
      withSearchStatePage(props.searchState, props.page),
    );
    const refreshSnapshotId = `car-results:${refreshHref}`;
    const visibleInventoryIds = pageItems.flatMap((result) =>
      result.inventoryId != null ? [result.inventoryId] : [],
    );
    const priceDisplays = pageItems.map((result) =>
      buildCarPriceDisplay({
        currencyCode: result.currency,
        dailyRate: result.priceFrom,
        days,
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
    const statusNotice = buildCarResultsStatusNotice(asyncState, {
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
          amount: result.priceFrom,
          currencyCode: result.currency,
        })),
        "Daily rate",
      );

      refreshPriceChanges.value = nextChanges;
      refreshPriceSummary.value = describePriceChangeCollection(
        Object.values(nextChanges),
      );
    });

    const onToggleSave$ = $((item: SavedItem) => {
      decisioning.toggleShortlist$(CARS_VERTICAL, item);
    });

    const onToggleCompare$ = $((item: SavedItem) => {
      decisioning.toggleCompare$(CARS_VERTICAL, item);
    });

    const onOpenCompare$ = $(() => {
      if (!canOpenCompare(decisioning.state.compare[CARS_VERTICAL].length))
        return;
      decisioning.openCompare$(CARS_VERTICAL);
    });

    const onClearCompare$ = $(() => {
      decisioning.clearComparedItems$(CARS_VERTICAL);
    });

    const onRevalidateVisibleResults$ = $(async () => {
      if (!visibleInventoryIds.length) {
        throw new Error("No visible car rental inventory can be revalidated.");
      }

      storeRefreshPriceSnapshot(
        refreshSnapshotId,
        pageItems.map((result) => ({
          id: result.id,
          amount: result.priceFrom,
          currencyCode: result.currency,
        })),
      );

      await revalidateInventoryApi({
        itemType: "car",
        inventoryIds: visibleInventoryIds,
      });
    });

    const comparedItems = decisioning.state.compare[CARS_VERTICAL];
    const canCompare = canOpenCompare(comparedItems.length);

    const sortOptions: ResultsSortOption[] = CAR_RENTALS_SORT_OPTIONS.map(
      (option) => ({
        label: option.label,
        value: option.value,
        active: props.activeSort === option.value,
        href: toHref(withSearchStateSort(props.searchState, option.value)),
      }),
    );

    const classOptions = props.filterFacets.vehicleClasses.map((item) => ({
      label: item.label,
      href: toHref(
        withSearchStateArrayToggle(
          props.searchState,
          "class",
          item.value,
          normalizeToken,
        ),
      ),
      active: props.selectedFilters.vehicleClasses.includes(item.value),
    }));

    const pickupTypeOptions = props.filterFacets.pickupTypes.map(
      (pickupType) => ({
        label: pickupType === "airport" ? "Airport pickup" : "City pickup",
        href: toHref(
          withSearchStateSingleToggle(
            props.searchState,
            "pickup",
            pickupType,
            normalizeToken,
          ),
        ),
        active: props.selectedFilters.pickupType === pickupType,
      }),
    );

    const transmissionOptions = props.filterFacets.transmissions.map(
      (kind) => ({
        label: kind === "automatic" ? "Automatic" : "Manual",
        href: toHref(
          withSearchStateSingleToggle(
            props.searchState,
            "transmission",
            kind,
            normalizeToken,
          ),
        ),
        active: props.selectedFilters.transmission === kind,
      }),
    );

    const seatOptions = props.filterFacets.seats.map((seats) => ({
      label: `${seats}+ seats`,
      href: toHref(
        withSearchStateSingleToggle(
          props.searchState,
          "seats",
          String(seats),
          normalizeToken,
        ),
      ),
      active: props.selectedFilters.seatsMin === seats,
    }));

    const priceBandOptions: {
      label: string;
      value: "under-50" | "50-100" | "100-150" | "150-plus";
    }[] = [
      { label: "Under $50/day", value: "under-50" },
      { label: "$50–$100/day", value: "50-100" },
      { label: "$100–$150/day", value: "100-150" },
      { label: "$150+/day", value: "150-plus" },
    ];

    const priceOptions = priceBandOptions.map((option) => ({
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

    const filterGroups: CarRentalFilterGroup[] = [
      { title: "Vehicle class", options: classOptions },
      { title: "Pickup type", options: pickupTypeOptions },
      { title: "Transmission", options: transmissionOptions },
      { title: "Seats", options: seatOptions },
      { title: "Price band", options: priceOptions },
    ].filter((group) => group.options.length > 0);
    const activeFilterChips = buildResultsFilterChips(filterGroups);
    const clearAllFiltersHref = toHref(
      clearSearchStateFilters(props.searchState, preservedFilterKeys),
    );

    return (
      <ResultsShell
        querySummary={buildQuerySummary(
          props.queryLabel,
          props.searchState.dates?.checkIn,
          props.searchState.dates?.checkOut,
        )}
        editSearchHref={
          props.editSearchHref ||
          buildEditSearchHref(props.searchState, props.queryLabel)
        }
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
            "No visible car rental inventory can refresh availability right now.",
          successMessage:
            "Visible car rental availability was refreshed. Any daily-rate changes are highlighted below.",
          failureMessage:
            "Failed to refresh visible car rental availability signals.",
          disabled: controlsDisabled,
        }}
        filtersTitle="Car rental filters"
        asyncState={asyncState}
        statusNotice={statusNotice}
        failed={
          props.loadError
            ? {
                title: "Car rental results could not be updated",
                description: props.loadError,
                primaryAction: {
                  label: "Retry car rental search",
                  href: location.url.pathname + location.url.search,
                },
                secondaryAction: props.emptyPrimaryAction || {
                  label: "Search car rentals again",
                  href: "/car-rentals",
                },
              }
            : undefined
        }
        loadingVariant="list"
        loadingCount={3}
        refreshingOverlayLabel="Updating rentals"
        controlsDisabled={controlsDisabled}
        resultCountLabel={`${props.totalCount.toLocaleString("en-US")} rentals`}
        sortId="car-results-sort"
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
                title: `No car rentals match this selection in ${props.queryLabel}`,
                description:
                  "Try removing a filter, changing sort, or broadening the pickup criteria.",
                primaryAction: props.emptyPrimaryAction || {
                  label: "Reset filters",
                  href: props.basePath,
                },
                secondaryAction: props.emptySecondaryAction || {
                  label: "Browse rental cities",
                  href: "/car-rentals/in",
                },
              }
        }
      >
        <CarRentalFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={controlsDisabled}
        />
        <CarRentalFilters
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
            const savedItem = buildCarResultSavedItem(
              result,
              props.searchState.dates,
              priceDisplays[index],
              buildCarRentalDetailHrefWithDates(
                result.slug,
                props.searchState.dates,
                props.searchState.filters?.drivers,
              ),
            );
            const compared = isCompared(
              decisioning.state,
              CARS_VERTICAL,
              savedItem.id,
            );

            return (
              <CarRentalCard
                key={result.id}
                result={result}
                priceDisplay={priceDisplay}
                activeSort={props.activeSort}
                savedItem={savedItem}
                isSaved={isShortlisted(
                  decisioning.state,
                  CARS_VERTICAL,
                  savedItem.id,
                )}
                onToggleSave$={onToggleSave$}
                isCompared={compared}
                compareDisabled={
                  !compared &&
                  comparedItems.length >= decisioning.state.compareLimit
                }
                onToggleCompare$={onToggleCompare$}
                detailHref={buildCarRentalDetailHrefWithDates(
                  result.slug,
                  props.searchState.dates,
                  props.searchState.filters?.drivers,
                )}
              />
            );
          })}
        </div>

        <RecentlyViewedModule
          vertical={CARS_VERTICAL}
          excludeIds={pageItems.map((result) => result.slug)}
          class="mt-4"
        />

        {comparedItems.length ? (
          <CompareTray
            q:slot="results-overlay"
            vertical={CARS_VERTICAL}
            compareCount={comparedItems.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearCompare$}
          />
        ) : null}

        <CompareSheet
          q:slot="results-overlay"
          open={
            decisioning.state.compareOpen &&
            decisioning.state.compareVertical === CARS_VERTICAL &&
            canCompare
          }
          vertical={CARS_VERTICAL}
          items={comparedItems}
        />
      </ResultsShell>
    );
  },
);

type CarRentalsResultsAdapterProps = {
  results: CarRentalResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  activeSort: CarRentalsSortKey;
  selectedFilters: CarRentalsSelectedFilters;
  filterFacets: CarRentalsSearchFacets;
  searchState: SearchState;
  queryLabel: string;
  basePath: string;
  editSearchHref?: string;
  emptyPrimaryAction?: {
    label: string;
    href: string;
  };
  emptySecondaryAction?: {
    label: string;
    href: string;
  };
  loadError?: string | null;
  urlOptions?: {
    includeQueryParam?: boolean;
    includeLocationParams?: boolean;
    dateParamKeys?: {
      checkIn?: string;
      checkOut?: string;
    };
  };
};

const buildCarResultsStatusNotice = (
  state: BookingAsyncState,
  input: {
    partialCount: number;
    staleCount: number;
    failedCount: number;
  },
) => {
  if (state === "refreshing") {
    return {
      title: "Refreshing car rental results",
      message:
        "Updated daily rates and filters are loading. Current rentals stay visible until the next result set is ready.",
    };
  }

  if (state === "partial") {
    return {
      title: "Some rentals only partially match",
      message: `${input.partialCount.toLocaleString("en-US")} visible car rental result${input.partialCount === 1 ? "" : "s"} only partially match the requested pickup or dropoff dates. Refresh availability or widen the criteria to compare cleaner matches.`,
    };
  }

  if (state === "stale") {
    const affected = input.staleCount + input.failedCount;
    return {
      title: "Some rentals need recheck",
      message: `${affected.toLocaleString("en-US")} visible car rental result${affected === 1 ? "" : "s"} rely on stale or failed availability signals. Refresh visible availability before trusting these daily rates.`,
    };
  }

  return undefined;
};
