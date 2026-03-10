import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { HotelCard } from "~/components/hotels/HotelCard";
import { HotelFilters } from "~/components/hotels/HotelFilters";
import type { HotelFilterGroup } from "~/components/hotels/HotelFilters";
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
import type { SavedItem } from "~/types/save-compare/saved-item";
import type { SearchState } from "~/types/search/state";

const PAGE_SIZE = 6;
const HOTELS_VERTICAL = "hotels" as const;

const HOTEL_SORTS = [
  { label: "Recommended", value: "relevance" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
  { label: "Rating", value: "rating-desc" },
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
    const current = toStringArray(filters[key]).map(normalizeToken);
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
    if (current === value) {
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
    const basePath = `/hotels/in/${encodeURIComponent(props.citySlug)}`;
    const toHref = (nextState: SearchState) =>
      searchStateToUrl(basePath, nextState, {
        includeQueryParam: false,
        includeLocationParams: false,
      });

    const activeSort = HOTEL_SORTS.some(
      (option) => option.value === props.searchState.sort,
    )
      ? String(props.searchState.sort)
      : "relevance";

    const requestedPage =
      props.searchState.page && props.searchState.page > 0
        ? props.searchState.page
        : 1;

    const rawFilters = props.searchState.filters || {};
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
      if (activeSort === "price-desc") return b.fromNightly - a.fromNightly;
      if (activeSort === "rating-desc") {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
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
    const refreshHref = toHref(withPage(props.searchState, page));
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

    const sortOptions: ResultsSortOption[] = HOTEL_SORTS.map((option) => ({
      label: option.label,
      value: option.value,
      active: activeSort === option.value,
      href: toHref(withSort(props.searchState, option.value)),
    }));

    const starFilterOptions = [3, 4, 5].map((stars) => ({
      label: `${stars}+ stars`,
      href: toHref(
        withSingleToggle(props.searchState, "starsMin", String(stars)),
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
          href: toHref(withArrayToggle(props.searchState, "amenities", value)),
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
            withArrayToggle(props.searchState, "neighborhoods", value),
          ),
          active: selectedNeighborhoods.includes(value),
        };
      });

    const priceOptions = priceFilterOptions.map((option) => ({
      label: option.label,
      href: toHref(withSingleToggle(props.searchState, "price", option.value)),
      active: selectedPriceTier === option.value,
    }));

    const filterGroups: HotelFilterGroup[] = [
      { title: "Star rating", options: starFilterOptions },
      { title: "Price tier", options: priceOptions },
      { title: "Amenities", options: amenityFilterOptions },
      { title: "Neighborhoods", options: neighborhoodFilterOptions },
    ];

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
        }}
        filtersTitle="Hotel filters"
        resultCountLabel={`${sortedHotels.length.toLocaleString("en-US")} stays`}
        sortOptions={sortOptions}
        pagination={{
          page,
          totalPages,
          prevHref:
            page > 1
              ? toHref(withPage(props.searchState, page - 1))
              : undefined,
          nextHref:
            page < totalPages
              ? toHref(withPage(props.searchState, page + 1))
              : undefined,
          pageLinks: buildPageLinks(page, totalPages, (pageNumber) =>
            toHref(withPage(props.searchState, pageNumber)),
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
        <HotelFilters q:slot="filters-desktop" groups={filterGroups} />
        <HotelFilters q:slot="filters-mobile" groups={filterGroups} />

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
