import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { CarRentalCard } from "~/components/car-rentals/CarRentalCard";
import { CarRentalFilters } from "~/components/car-rentals/CarRentalFilters";
import type { CarRentalFilterGroup } from "~/components/car-rentals/CarRentalFilters";
import { ResultsShell } from "~/components/results/ResultsShell";
import { CompareDrawer } from "~/components/save-compare/CompareDrawer";
import { CompareTray } from "~/components/save-compare/CompareTray";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import { formatMoney } from "~/lib/formatMoney";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import { canOpenCompare } from "~/lib/save-compare/compare-state";
import {
  clearSavedCollection,
  isItemSaved,
  loadSavedItems,
  persistSavedItems,
  removeSavedItem,
  toggleSavedItem,
} from "~/lib/save-compare/saved-state";
import { SAVE_COMPARE_STORAGE_KEY } from "~/lib/save-compare/storage";
import {
  CAR_RENTALS_SORT_OPTIONS,
  type CarRentalsSortKey,
} from "~/lib/search/car-rentals/car-sort-options";
import type {
  CarRentalsSearchFacets,
  CarRentalsSelectedFilters,
} from "~/lib/search/car-rentals/filter-types";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import type { CarRentalResult } from "~/types/car-rentals/search";
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { SearchState } from "~/types/search/state";

const CARS_VERTICAL = "cars" as const;

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

const withFilters = (
  state: SearchState,
  updater: (filters: Record<string, unknown>) => Record<string, unknown>,
): SearchState => {
  const nextFilters = updater({ ...(state.filters || {}) });
  return {
    ...state,
    page: 1,
    filters: Object.keys(nextFilters).length ? nextFilters : undefined,
  };
};

const withArrayToggle = (
  state: SearchState,
  key: string,
  value: string,
): SearchState => {
  return withFilters(state, (filters) => {
    const currentRaw = filters[key];
    const current = Array.isArray(currentRaw)
      ? currentRaw
          .map((item) => normalizeToken(String(item || "")))
          .filter(Boolean)
      : String(currentRaw || "")
          .split(",")
          .map((item) => normalizeToken(item))
          .filter(Boolean);

    const has = current.includes(value);
    const next = has
      ? current.filter((item) => item !== value)
      : [...current, value];

    if (next.length) {
      filters[key] = next;
    } else {
      delete filters[key];
    }

    return filters;
  });
};

const withSingleToggle = (
  state: SearchState,
  key: string,
  value: string,
): SearchState => {
  return withFilters(state, (filters) => {
    const current = normalizeToken(String(filters[key] || ""));
    if (current === normalizeToken(value)) {
      delete filters[key];
    } else {
      filters[key] = value;
    }
    return filters;
  });
};

const withSort = (state: SearchState, sort: string): SearchState => ({
  ...state,
  sort,
  page: 1,
});

const withPage = (state: SearchState, page: number): SearchState => ({
  ...state,
  page,
});

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

const buildCarRentalDetailHref = (rentalSlug: string) =>
  `/car-rentals/${encodeURIComponent(rentalSlug)}`;

const toSavedCarItem = (
  result: CarRentalResult,
  dates: SearchState["dates"],
): SavedItem => ({
  id: result.id,
  vertical: CARS_VERTICAL,
  title: result.name,
  subtitle: result.vehicleName || result.category || "Standard car",
  price: `${formatMoney(result.priceFrom, result.currency)} /day`,
  meta: [
    result.pickupArea,
    result.transmission || "",
    result.seats != null ? `${result.seats} seats` : "",
    result.bags || "",
  ].filter(Boolean),
  href: buildCarRentalDetailHref(result.slug),
  image: result.image || undefined,
  tripCandidate:
    result.inventoryId != null
      ? {
          itemType: "car",
          inventoryId: result.inventoryId,
          startDate: dates?.checkIn,
          endDate: dates?.checkOut,
          priceCents: Math.round(result.priceFrom * 100),
          currencyCode: result.currency,
          title: result.name,
          subtitle: result.vehicleName || result.category || "Standard car",
          imageUrl: result.image || undefined,
          meta: [
            result.pickupArea,
            result.transmission || "",
            result.seats != null ? `${result.seats} seats` : "",
            result.bags || "",
          ].filter(Boolean),
        }
      : undefined,
});

export const CarRentalsResultsAdapter = component$(
  (props: CarRentalsResultsAdapterProps) => {
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(props.basePath, nextState, {
        includeQueryParam: props.urlOptions?.includeQueryParam,
        includeLocationParams: props.urlOptions?.includeLocationParams,
        dateParamKeys: props.urlOptions?.dateParamKeys,
      });

    const pageItems = props.results;
    const refreshHref = toHref(withPage(props.searchState, props.page));
    const visibleInventoryIds = pageItems.flatMap((result) =>
      result.inventoryId != null ? [result.inventoryId] : [],
    );
    const savedItems = useSignal<SavedItem[]>([]);
    const compareOpen = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const syncSaved = () => {
        savedItems.value = loadSavedItems(CARS_VERTICAL);
      };

      syncSaved();

      const onStorage = (event: StorageEvent) => {
        if (event.key && event.key !== SAVE_COMPARE_STORAGE_KEY) return;
        syncSaved();
      };

      window.addEventListener("storage", onStorage);
      cleanup(() => window.removeEventListener("storage", onStorage));
    });

    const onToggleSave$ = $((item: SavedItem) => {
      const next = toggleSavedItem(savedItems.value, item);
      savedItems.value = next;
      persistSavedItems(CARS_VERTICAL, next);
    });

    const onRemoveSaved$ = $((id: string) => {
      const next = removeSavedItem(savedItems.value, id);
      savedItems.value = next;
      persistSavedItems(CARS_VERTICAL, next);
    });

    const onClearSaved$ = $(() => {
      const next = clearSavedCollection();
      savedItems.value = next;
      persistSavedItems(CARS_VERTICAL, next);
      compareOpen.value = false;
    });

    const onOpenCompare$ = $(() => {
      if (!canOpenCompare(savedItems.value.length)) return;
      compareOpen.value = true;
    });

    const onCloseCompare$ = $(() => {
      compareOpen.value = false;
    });

    const onRevalidateVisibleResults$ = $(async () => {
      if (!visibleInventoryIds.length) {
        throw new Error("No visible car rental inventory can be revalidated.");
      }

      await revalidateInventoryApi({
        itemType: "car",
        inventoryIds: visibleInventoryIds,
      });
    });

    const canCompare = canOpenCompare(savedItems.value.length);

    const sortOptions: ResultsSortOption[] = CAR_RENTALS_SORT_OPTIONS.map(
      (option) => ({
        label: option.label,
        value: option.value,
        active: props.activeSort === option.value,
        href: toHref(withSort(props.searchState, option.value)),
      }),
    );

    const classOptions = props.filterFacets.vehicleClasses.map((item) => ({
      label: item.label,
      href: toHref(withArrayToggle(props.searchState, "class", item.value)),
      active: props.selectedFilters.vehicleClasses.includes(item.value),
    }));

    const pickupTypeOptions = props.filterFacets.pickupTypes
      .map((pickupType) => ({
        label: pickupType === "airport" ? "Airport pickup" : "City pickup",
        href: toHref(withSingleToggle(props.searchState, "pickup", pickupType)),
        active: props.selectedFilters.pickupType === pickupType,
      }));

    const transmissionOptions = props.filterFacets.transmissions
      .map((kind) => ({
        label: kind === "automatic" ? "Automatic" : "Manual",
        href: toHref(withSingleToggle(props.searchState, "transmission", kind)),
        active: props.selectedFilters.transmission === kind,
      }));

    const seatOptions = props.filterFacets.seats
      .map((seats) => ({
        label: `${seats}+ seats`,
        href: toHref(
          withSingleToggle(props.searchState, "seats", String(seats)),
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
        withSingleToggle(props.searchState, "priceBand", option.value),
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
          id: `car-results:${refreshHref}`,
          mode: visibleInventoryIds.length ? "action" : "unsupported",
          onRefresh$: visibleInventoryIds.length
            ? onRevalidateVisibleResults$
            : undefined,
          reloadHref: refreshHref,
          reloadOnSuccess: true,
          label: "Revalidate visible results",
          refreshingLabel: "Revalidating...",
          refreshedLabel: "Results revalidated",
          failedLabel: "Retry revalidation",
          unsupportedLabel: "Revalidate unavailable",
          unsupportedMessage:
            "No visible car rental inventory can be revalidated.",
          successMessage:
            "Visible car rental results were revalidated. Freshness labels were updated.",
          failureMessage: "Failed to revalidate visible car rental results.",
        }}
        filtersTitle="Car rental filters"
        resultCountLabel={`${props.totalCount.toLocaleString("en-US")} rentals`}
        sortOptions={sortOptions}
        pagination={{
          page: props.page,
          totalPages: props.totalPages,
          prevHref:
            props.page > 1
              ? toHref(withPage(props.searchState, props.page - 1))
              : undefined,
          nextHref:
            props.page < props.totalPages
              ? toHref(withPage(props.searchState, props.page + 1))
              : undefined,
          pageLinks: buildPageLinks(props.page, props.totalPages, (pageNumber) =>
            toHref(withPage(props.searchState, pageNumber)),
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
        <CarRentalFilters q:slot="filters-desktop" groups={filterGroups} />
        <CarRentalFilters q:slot="filters-mobile" groups={filterGroups} />

        <div class="grid gap-3">
          {pageItems.map((result) => {
            const savedItem = toSavedCarItem(result, props.searchState.dates);

            return (
              <CarRentalCard
                key={result.id}
                result={result}
                savedItem={savedItem}
                isSaved={isItemSaved(savedItems.value, savedItem.id)}
                onToggleSave$={onToggleSave$}
              />
            );
          })}
        </div>

        {canCompare ? (
          <CompareTray
            q:slot="results-overlay"
            vertical={CARS_VERTICAL}
            savedCount={savedItems.value.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearSaved$}
          />
        ) : null}

        <CompareDrawer
          q:slot="results-overlay"
          open={compareOpen.value && canCompare}
          vertical={CARS_VERTICAL}
          items={savedItems.value}
          onClose$={onCloseCompare$}
          onClear$={onClearSaved$}
          onRemove$={onRemoveSaved$}
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
  urlOptions?: {
    includeQueryParam?: boolean;
    includeLocationParams?: boolean;
    dateParamKeys?: {
      checkIn?: string;
      checkOut?: string;
    };
  };
};
