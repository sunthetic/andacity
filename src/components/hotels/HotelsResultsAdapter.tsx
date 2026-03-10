import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { HotelCard } from "~/components/hotels/HotelCard";
import { HotelFilters } from "~/components/hotels/HotelFilters";
import type { HotelFilterGroup } from "~/components/hotels/HotelFilters";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { ResultsShell } from "~/components/results/ResultsShell";
import { CompareDrawer } from "~/components/save-compare/CompareDrawer";
import { CompareTray } from "~/components/save-compare/CompareTray";
import type { ResultsSortOption } from "~/components/results/ResultsSort";
import type { HotelCity } from "~/data/hotel-cities";
import type { Hotel } from "~/data/hotels";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import {
  buildHotelPriceDisplay,
  describePriceChangeCollection,
  formatPriceQualifier,
  mergePriceDisplayMetadata,
  type PriceChange,
} from "~/lib/pricing/price-display";
import {
  buildRefreshPriceChangeMap,
  consumeRefreshPriceSnapshot,
  storeRefreshPriceSnapshot,
} from "~/lib/pricing/refresh-price-snapshot";
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
import { computeNights } from "~/lib/search/hotels/dates";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import { formatMoney } from "~/lib/formatMoney";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { SearchState } from "~/types/search/state";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStatePage,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import {
  HOTEL_SORT_OPTIONS,
  normalizeHotelSort,
} from "~/lib/search/hotels/hotel-sort-options";

const PAGE_SIZE = 6;
const HOTELS_VERTICAL = "hotels" as const;
const HOTEL_RESULTS_FILTER_KEYS = [
  "starsMin",
  "price",
  "amenities",
  "neighborhoods",
  "propertyTypes",
] as const;

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const single = String(value || "").trim();
  if (!single) return [];
  if (single.includes(",")) {
    return single
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [single];
};

const toMaybeNumber = (value: unknown) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

const normalizeToken = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const normalizeAmenity = (value: string) => {
  const token = normalizeToken(value);
  if (token.includes("wifi")) return "wifi";
  if (token.includes("wi-fi")) return "wifi";
  if (token.includes("pet")) return "pet-friendly";
  if (token.includes("pool")) return "pool";
  if (token.includes("parking")) return "parking";
  return token;
};

const hotelPriceTier = (hotel: Hotel): HotelPriceTier => {
  if (hotel.fromNightly < 150) return "budget";
  if (hotel.fromNightly < 300) return "mid";
  if (hotel.fromNightly < 500) return "upscale";
  return "luxury";
};

const hotelValueScore = (hotel: Hotel) => {
  const policyBonus =
    (hotel.policies.freeCancellation ? 18 : 0) +
    (hotel.policies.payLater ? 12 : 0);

  return (
    hotel.rating * 100 +
    hotel.stars * 22 +
    policyBonus
  ) / Math.max(hotel.fromNightly, 1);
};

const matchesPropertyType = (hotel: Hotel, propertyType: string) => {
  const haystack = `${hotel.name} ${hotel.summary}`.toLowerCase();
  const type = normalizeToken(propertyType);

  if (type === "resort") return haystack.includes("resort");
  if (type === "lodge") return haystack.includes("lodge");
  if (type === "motel") return haystack.includes("motel");
  if (type === "aparthotel")
    return haystack.includes("suite") || haystack.includes("aparthotel");
  if (type === "hotel") return true;
  return haystack.includes(type);
};

const clampPage = (page: number, totalPages: number) => {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
};

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
  cityName: string,
  checkIn?: string,
  checkOut?: string,
) => {
  const parts = [`Hotels in ${cityName}`];
  const inLabel = formatDate(checkIn);
  const outLabel = formatDate(checkOut);
  if (inLabel && outLabel) {
    parts.push(`${inLabel}–${outLabel}`);
  }
  return parts.join(" · ");
};

const buildEditSearchHref = (cityName: string, dates: SearchState["dates"]) => {
  const sp = new URLSearchParams();
  sp.set("destination", cityName);
  if (dates?.checkIn) sp.set("checkIn", dates.checkIn);
  if (dates?.checkOut) sp.set("checkOut", dates.checkOut);
  return `/hotels?${sp.toString()}`;
};

const buildHotelDetailHref = (hotelSlug: string) =>
  `/hotels/${encodeURIComponent(hotelSlug)}`;

const buildHotelDetailHrefWithDates = (
  hotelSlug: string,
  dates: SearchState["dates"],
) => {
  const base = buildHotelDetailHref(hotelSlug);
  const sp = new URLSearchParams();

  if (dates?.checkIn) sp.set("checkIn", dates.checkIn);
  if (dates?.checkOut) sp.set("checkOut", dates.checkOut);

  const query = sp.toString();
  return query ? `${base}?${query}` : base;
};

const toSavedHotelItem = (
  hotel: Hotel,
  dates: SearchState["dates"],
  priceDisplay: ReturnType<typeof buildHotelPriceDisplay>,
): SavedItem => ({
  id: hotel.slug,
  vertical: HOTELS_VERTICAL,
  title: hotel.name,
  subtitle: `${hotel.neighborhood} · ${hotel.stars}★ · ${hotel.rating.toFixed(1)}`,
  price:
    priceDisplay.baseTotalAmount != null
      ? `${priceDisplay.baseTotalLabel} ${formatMoney(
          priceDisplay.baseTotalAmount,
          hotel.currency,
        )}`
      : `${priceDisplay.baseLabel} ${formatMoney(
          priceDisplay.baseAmount,
          hotel.currency,
        )} ${formatPriceQualifier(priceDisplay.baseQualifier)}`.trim(),
  meta: [
    priceDisplay.baseTotalAmount != null
      ? `${priceDisplay.baseLabel} ${formatMoney(
          priceDisplay.baseAmount,
          hotel.currency,
        )} ${formatPriceQualifier(priceDisplay.baseQualifier)}`
      : "",
    priceDisplay.totalAmount != null
      ? `${priceDisplay.totalLabel} ${formatMoney(
          priceDisplay.totalAmount,
          hotel.currency,
        )}`
      : "",
    `${hotel.reviewCount.toLocaleString("en-US")} reviews`,
    ...(hotel.policies.freeCancellation ? ["Free cancellation"] : []),
    ...(hotel.policies.payLater ? ["Pay later"] : []),
  ].filter(Boolean),
  href: buildHotelDetailHref(hotel.slug),
  image: hotel.images[0] || undefined,
  tripCandidate:
    hotel.inventoryId != null
      ? {
          itemType: "hotel",
          inventoryId: hotel.inventoryId,
          startDate: dates?.checkIn,
          endDate: dates?.checkOut,
          priceCents: Math.round(
            (priceDisplay.baseTotalAmount ?? priceDisplay.baseAmount ?? 0) *
              100,
          ),
          currencyCode: hotel.currency,
          title: hotel.name,
          subtitle: `${hotel.neighborhood} · ${hotel.stars}★`,
          imageUrl: hotel.images[0] || undefined,
          meta: [
            priceDisplay.baseTotalAmount != null
              ? `${priceDisplay.baseLabel} ${formatMoney(
                  priceDisplay.baseAmount,
                  hotel.currency,
                )} ${formatPriceQualifier(priceDisplay.baseQualifier)}`
              : "",
            priceDisplay.totalAmount != null
              ? `${priceDisplay.totalLabel} ${formatMoney(
                  priceDisplay.totalAmount,
                  hotel.currency,
                )}`
              : "",
            `${hotel.reviewCount.toLocaleString("en-US")} reviews`,
            ...(hotel.policies.freeCancellation ? ["Free cancellation"] : []),
            ...(hotel.policies.payLater ? ["Pay later"] : []),
          ].filter(Boolean),
          metadata: mergePriceDisplayMetadata(undefined, "hotel", priceDisplay),
        }
      : undefined,
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

export const HotelsResultsAdapter = component$(
  (props: HotelsResultsAdapterProps) => {
    const location = useLocation();
    const basePath = `/hotels/in/${encodeURIComponent(props.citySlug)}`;
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(basePath, nextState, {
        includeQueryParam: false,
        includeLocationParams: false,
      });

    const activeSort = normalizeHotelSort(props.searchState.sort);

    const requestedPage =
      props.searchState.page && props.searchState.page > 0
        ? props.searchState.page
        : 1;

    const rawFilters = props.searchState.filters || {};
    const preservedFilterKeys = Object.keys(rawFilters).filter(
      (key) => !HOTEL_RESULTS_FILTER_KEYS.includes(key as (typeof HOTEL_RESULTS_FILTER_KEYS)[number]),
    );
    const selectedStarMin = toMaybeNumber(rawFilters.starsMin);
    const selectedPriceTier = normalizeToken(String(rawFilters.price || "")) as
      | HotelPriceTier
      | "";
    const selectedAmenities = toStringArray(rawFilters.amenities).map(
      normalizeAmenity,
    );
    const selectedNeighborhoods = toStringArray(rawFilters.neighborhoods).map(
      normalizeToken,
    );
    const selectedPropertyTypes = toStringArray(rawFilters.propertyTypes).map(
      normalizeToken,
    );

    const filteredHotels = props.hotels.filter((hotel) => {
      if (selectedStarMin != null && hotel.stars < selectedStarMin)
        return false;

      if (selectedPriceTier && hotelPriceTier(hotel) !== selectedPriceTier)
        return false;

      if (selectedAmenities.length) {
        const amenities = hotel.amenities.map(normalizeAmenity);
        if (!selectedAmenities.every((needle) => amenities.includes(needle)))
          return false;
      }

      if (selectedNeighborhoods.length) {
        const hotelNeighborhood = normalizeToken(hotel.neighborhood);
        if (!selectedNeighborhoods.includes(hotelNeighborhood)) return false;
      }

      if (selectedPropertyTypes.length) {
        if (
          !selectedPropertyTypes.some((type) =>
            matchesPropertyType(hotel, type),
          )
        )
          return false;
      }

      return true;
    });

    const sortedHotels = [...filteredHotels].sort((a, b) => {
      if (activeSort === "price-asc") return a.fromNightly - b.fromNightly;
      if (activeSort === "rating-desc") {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      }
      if (activeSort === "value") {
        const valueDelta = hotelValueScore(b) - hotelValueScore(a);
        if (valueDelta !== 0) return valueDelta;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.fromNightly - b.fromNightly;
      }

      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return a.fromNightly - b.fromNightly;
    });

    const totalPages = Math.max(1, Math.ceil(sortedHotels.length / PAGE_SIZE));
    const page = clampPage(requestedPage, totalPages);
    const offset = (page - 1) * PAGE_SIZE;
    const pageItems = sortedHotels.slice(offset, offset + PAGE_SIZE);
    const nights = computeNights(
      props.searchState.dates?.checkIn || null,
      props.searchState.dates?.checkOut || null,
    );
    const refreshHref = toHref(withSearchStatePage(props.searchState, page));
    const refreshSnapshotId = `hotel-results:${refreshHref}`;
    const visibleInventoryIds = pageItems.flatMap((hotel) =>
      hotel.inventoryId != null ? [hotel.inventoryId] : [],
    );
    const priceDisplays = pageItems.map((hotel) =>
      buildHotelPriceDisplay({
        currencyCode: hotel.currency,
        nightlyRate: hotel.fromNightly,
        nights,
      }),
    );
    const savedItems = useSignal<SavedItem[]>([]);
    const compareOpen = useSignal(false);
    const refreshPriceChanges = useSignal<Record<string, PriceChange>>({});
    const refreshPriceSummary = useSignal<string | null>(null);
    const availabilitySignals = summarizeAvailabilitySignals(pageItems);
    const asyncState = resolveAvailabilityAsyncState({
      itemCount: sortedHotels.length,
      isRefreshing: location.isNavigating,
      signals: availabilitySignals,
    });
    const controlsDisabled = location.isNavigating;
    const statusNotice = buildHotelResultsStatusNotice(asyncState, {
      partialCount: availabilitySignals.partialCount,
      staleCount: availabilitySignals.staleCount,
      failedCount: availabilitySignals.failedCount,
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const syncSaved = () => {
        savedItems.value = loadSavedItems(HOTELS_VERTICAL);
      };

      syncSaved();

      const onStorage = (event: StorageEvent) => {
        if (event.key && event.key !== SAVE_COMPARE_STORAGE_KEY) return;
        syncSaved();
      };

      window.addEventListener("storage", onStorage);
      cleanup(() => window.removeEventListener("storage", onStorage));
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
        pageItems.map((hotel) => ({
          id: hotel.slug,
          amount: hotel.fromNightly,
          currencyCode: hotel.currency,
        })),
        "Nightly rate",
      );

      refreshPriceChanges.value = nextChanges;
      refreshPriceSummary.value = describePriceChangeCollection(
        Object.values(nextChanges),
      );
    });

    const onToggleSave$ = $((item: SavedItem) => {
      const next = toggleSavedItem(savedItems.value, item);
      savedItems.value = next;
      persistSavedItems(HOTELS_VERTICAL, next);
    });

    const onRemoveSaved$ = $((id: string) => {
      const next = removeSavedItem(savedItems.value, id);
      savedItems.value = next;
      persistSavedItems(HOTELS_VERTICAL, next);
    });

    const onClearSaved$ = $(() => {
      const next = clearSavedCollection();
      savedItems.value = next;
      persistSavedItems(HOTELS_VERTICAL, next);
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
        throw new Error("No visible hotel inventory can be revalidated.");
      }

      storeRefreshPriceSnapshot(
        refreshSnapshotId,
        pageItems.map((hotel) => ({
          id: hotel.slug,
          amount: hotel.fromNightly,
          currencyCode: hotel.currency,
        })),
      );

      await revalidateInventoryApi({
        itemType: "hotel",
        inventoryIds: visibleInventoryIds,
      });
    });

    const canCompare = canOpenCompare(savedItems.value.length);

    const sortOptions: ResultsSortOption[] = HOTEL_SORT_OPTIONS.map((option) => ({
      label: option.label,
      value: option.value,
      active: activeSort === option.value,
      href: toHref(withSearchStateSort(props.searchState, option.value)),
    }));

    const starFilterOptions = [3, 4, 5].map((stars) => ({
      label: `${stars}+ stars`,
      href: toHref(
        withSearchStateSingleToggle(
          props.searchState,
          "starsMin",
          String(stars),
          normalizeToken,
        ),
      ),
      active: selectedStarMin === stars,
    }));

    const priceFilterOptions: { label: string; value: HotelPriceTier }[] = [
      { label: "Budget", value: "budget" },
      { label: "Mid range", value: "mid" },
      { label: "Upscale", value: "upscale" },
      { label: "Luxury", value: "luxury" },
    ];

    const amenityFilterOptions = props.city.topAmenities
      .slice(0, 6)
      .map((amenity) => {
        const value = normalizeAmenity(amenity.name);
        return {
          label: amenity.name,
          href: toHref(
            withSearchStateArrayToggle(
              props.searchState,
              "amenities",
              value,
              normalizeAmenity,
            ),
          ),
          active: selectedAmenities.includes(value),
        };
      });

    const neighborhoodFilterOptions = props.city.topNeighborhoods
      .slice(0, 6)
      .map((neighborhood) => {
        const value = normalizeToken(neighborhood.name);
        return {
          label: neighborhood.name,
          href: toHref(
            withSearchStateArrayToggle(
              props.searchState,
              "neighborhoods",
              value,
              normalizeToken,
            ),
          ),
          active: selectedNeighborhoods.includes(value),
        };
      });

    const priceOptions = priceFilterOptions.map((option) => ({
      label: option.label,
      href: toHref(
        withSearchStateSingleToggle(
          props.searchState,
          "price",
          option.value,
          normalizeToken,
        ),
      ),
      active: selectedPriceTier === option.value,
    }));

    const propertyTypeOptions = ["Hotel", "Resort", "Lodge", "Aparthotel"].map(
      (label) => {
        const value = normalizeToken(label);
        return {
          label,
          href: toHref(
            withSearchStateArrayToggle(
              props.searchState,
              "propertyTypes",
              value,
              normalizeToken,
            ),
          ),
          active: selectedPropertyTypes.includes(value),
        };
      },
    );

    const filterGroups: HotelFilterGroup[] = [
      { title: "Star rating", options: starFilterOptions },
      { title: "Price", options: priceOptions },
      { title: "Stay type", options: propertyTypeOptions },
      { title: "Amenities", options: amenityFilterOptions },
      { title: "Neighborhoods", options: neighborhoodFilterOptions },
    ].filter((group) => group.options.length > 0);
    const activeFilterChips = buildResultsFilterChips(filterGroups);
    const clearAllFiltersHref = toHref(
      clearSearchStateFilters(props.searchState, preservedFilterKeys),
    );

    return (
      <ResultsShell
        querySummary={buildQuerySummary(
          props.city.city,
          props.searchState.dates?.checkIn,
          props.searchState.dates?.checkOut,
        )}
        editSearchHref={buildEditSearchHref(
          props.city.city,
          props.searchState.dates,
        )}
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
            "No visible hotel inventory can refresh availability right now.",
          successMessage:
            "Visible hotel availability was refreshed. Any nightly-rate changes are highlighted below.",
          failureMessage:
            "Failed to refresh visible hotel availability signals.",
          disabled: controlsDisabled,
        }}
        filtersTitle="Hotel filters"
        asyncState={asyncState}
        statusNotice={statusNotice}
        loadingVariant="card"
        loadingCount={6}
        refreshingOverlayLabel="Updating stays"
        controlsDisabled={controlsDisabled}
        resultCountLabel={`${sortedHotels.length.toLocaleString("en-US")} stays`}
        sortId="hotel-city-results-sort"
        sortOptions={sortOptions}
        activeFilterChips={activeFilterChips}
        clearAllFiltersHref={clearAllFiltersHref}
        pagination={{
          page,
          totalPages,
          prevHref:
            page > 1
              ? toHref(withSearchStatePage(props.searchState, page - 1))
              : undefined,
          nextHref:
            page < totalPages
              ? toHref(withSearchStatePage(props.searchState, page + 1))
              : undefined,
          pageLinks: buildPageLinks(page, totalPages, (pageNumber) =>
            toHref(withSearchStatePage(props.searchState, pageNumber)),
          ),
        }}
        empty={
          sortedHotels.length
            ? undefined
            : {
                title: `No hotels match this selection in ${props.city.city}`,
                description:
                  "Try removing a filter, changing sort, or broadening your dates.",
                primaryAction: { label: "Reset filters", href: basePath },
                secondaryAction: {
                  label: "Browse hotels hub",
                  href: "/hotels",
                },
              }
        }
      >
        <HotelFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={controlsDisabled}
        />
        <HotelFilters
          q:slot="filters-mobile"
          groups={filterGroups}
          disabled={controlsDisabled}
        />

        {refreshPriceSummary.value ? (
          <div class="mb-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
            {refreshPriceSummary.value}
          </div>
        ) : null}

        <div class="grid gap-3 sm:grid-cols-2">
          {pageItems.map((hotel, index) => {
            const priceDisplay = {
              ...priceDisplays[index],
              delta: refreshPriceChanges.value[hotel.slug] || null,
            };
            const savedItem = toSavedHotelItem(
              hotel,
              props.searchState.dates,
              priceDisplays[index],
            );

            return (
              <HotelCard
                key={hotel.slug}
                hotel={hotel}
                priceDisplay={priceDisplay}
                savedItem={savedItem}
                isSaved={isItemSaved(savedItems.value, savedItem.id)}
                onToggleSave$={onToggleSave$}
                detailHref={buildHotelDetailHrefWithDates(
                  hotel.slug,
                  props.searchState.dates,
                )}
              />
            );
          })}
        </div>

        {canCompare ? (
          <CompareTray
            q:slot="results-overlay"
            vertical={HOTELS_VERTICAL}
            savedCount={savedItems.value.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearSaved$}
          />
        ) : null}

        <CompareDrawer
          q:slot="results-overlay"
          open={compareOpen.value && canCompare}
          vertical={HOTELS_VERTICAL}
          items={savedItems.value}
          onClose$={onCloseCompare$}
          onClear$={onClearSaved$}
          onRemove$={onRemoveSaved$}
        />
      </ResultsShell>
    );
  },
);

type HotelsResultsAdapterProps = {
  citySlug: string;
  city: HotelCity;
  hotels: Hotel[];
  searchState: SearchState;
};

type HotelPriceTier = "budget" | "mid" | "upscale" | "luxury";

const buildHotelResultsStatusNotice = (
  state: BookingAsyncState,
  input: {
    partialCount: number;
    staleCount: number;
    failedCount: number;
  },
) => {
  if (state === "refreshing") {
    return {
      title: "Refreshing hotel results",
      message:
        "Updated rates and filters are loading. Current stays stay visible until the next result set is ready.",
    };
  }

  if (state === "partial") {
    return {
      title: "Some stays only partially match",
      message: `${input.partialCount.toLocaleString("en-US")} visible hotel result${input.partialCount === 1 ? "" : "s"} only partially match the current stay request. Refresh availability or adjust dates to compare cleaner matches.`,
    };
  }

  if (state === "stale") {
    const affected = input.staleCount + input.failedCount;
    return {
      title: "Some stays need recheck",
      message: `${affected.toLocaleString("en-US")} visible hotel result${affected === 1 ? "" : "s"} rely on stale or failed availability signals. Refresh visible availability before trusting these nightly rates.`,
    };
  }

  return undefined;
};
