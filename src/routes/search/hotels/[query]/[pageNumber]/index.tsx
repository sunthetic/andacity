import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useLocation, useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useBookingAbandonmentTelemetry } from "~/lib/analytics/booking-abandonment";
import { trackBookingEvent } from "~/lib/analytics/booking-telemetry";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import { Page } from "~/components/site/Page";
import { HotelResultCard } from "~/components/hotels/search/HotelResultCard";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import {
  buildHotelPriceDisplay,
  describePriceChangeCollection,
  type PriceChange,
} from "~/lib/pricing/price-display";
import {
  buildRefreshPriceChangeMap,
  consumeRefreshPriceSnapshot,
  storeRefreshPriceSnapshot,
} from "~/lib/pricing/refresh-price-snapshot";
import type { HotelResult } from "~/types/hotels/search";
import { loadHotelResultsFromDb } from "~/lib/queries/hotels-search.server";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import {
  clampInt,
  normalizeQuery,
  safeTitleQuery,
} from "~/lib/search/hotels/normalize";
import { SearchMapCard } from "~/components/search/SearchMapCard";
import { SearchResultsSummary } from "~/components/search/SearchResultsSummary";
import { SearchEmptyState } from "~/components/search/SearchEmptyState";
import { computeNights } from "~/lib/search/hotels/dates";
import { FiltersPanel } from "~/components/search/filters/FiltersPanel";
import { ResultsControlBar } from "~/components/results/ResultsControlBar";
import {
  buildResultsFilterChips,
  type ResultsFilterGroup,
} from "~/components/results/ResultsFilterGroups";
import type {
  FilterSectionConfig,
  FilterValues,
} from "~/components/search/filters/types";
import { ResultsPagination } from "~/components/results/ResultsPagination";
import { ResultsLoading } from "~/components/results/ResultsLoading";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import {
  HOTEL_SORT_OPTIONS,
  normalizeHotelSort,
} from "~/lib/search/hotels/hotel-sort-options";

const HOTEL_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    type: "checkbox",
    id: "priceRange",
    title: "Price range",
    options: [
      { label: "Under $150", value: "under-150" },
      { label: "$150–$300", value: "150-300" },
      { label: "$300–$500", value: "300-500" },
      { label: "$500+", value: "500-plus" },
    ],
  },
  {
    type: "checkbox",
    id: "starRating",
    title: "Star rating",
    options: [
      { label: "3-star", value: "3" },
      { label: "4-star", value: "4" },
      { label: "5-star", value: "5" },
    ],
  },
  {
    type: "checkbox",
    id: "guestRating",
    title: "Guest rating",
    options: [
      { label: "7+", value: "7" },
      { label: "8+", value: "8" },
      { label: "9+", value: "9" },
    ],
  },
  {
    type: "checkbox",
    id: "amenities",
    title: "Amenities",
    options: [
      { label: "Pool", value: "pool" },
      { label: "Wi-Fi", value: "wifi" },
      { label: "Parking", value: "parking" },
      { label: "Pet friendly", value: "pet-friendly" },
    ],
  },
];

const parseMultiValue = (url: URL, key: string) => {
  const values = url.searchParams
    .getAll(key)
    .flatMap((entry) => String(entry || "").split(","))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(values));
};

const parseSort = (url: URL) => {
  return normalizeHotelSort(url.searchParams.get("sort"));
};

const toPageHref = (
  basePath: string,
  page: number,
  searchParams: URLSearchParams,
) => {
  const qs = searchParams.toString();
  return qs ? `${basePath}/${page}?${qs}` : `${basePath}/${page}`;
};

const buildPageLinks = (
  page: number,
  totalPages: number,
  makeHref: (pageNumber: number) => string,
) => {
  const links: { label: string; href: string; active?: boolean }[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let value = start; value <= end; value += 1) {
    links.push({
      label: String(value),
      href: makeHref(value),
      active: value === page,
    });
  }

  return links;
};

const toggleCheckboxFilterHref = (
  basePath: string,
  searchParams: URLSearchParams,
  sectionId: string,
  optionValue: string,
) => {
  const params = new URLSearchParams(searchParams);
  const current = new Set(
    String(params.get(sectionId) || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  if (current.has(optionValue)) {
    current.delete(optionValue);
  } else {
    current.add(optionValue);
  }

  if (!current.size) {
    params.delete(sectionId);
  } else {
    params.set(sectionId, Array.from(current).join(","));
  }

  return toPageHref(basePath, 1, params);
};

export const useSearchHotelsPage = routeLoader$(async ({ params, url }) => {
  const query = normalizeQuery(params.query);
  const page = clampInt(params.pageNumber, 1, 9999);
  const destinationLocation = await resolveLocationFromUrlValues({
    locationId: url.searchParams.get("destinationLocationId"),
    searchSlug: query,
  });
  const checkIn = String(url.searchParams.get("checkIn") || "").trim() || null;
  const checkOut =
    String(url.searchParams.get("checkOut") || "").trim() || null;
  const occupancy = String(url.searchParams.get("guests") || "").trim() || null;

  const filters = {
    priceRange: parseMultiValue(url, "priceRange"),
    starRating: parseMultiValue(url, "starRating"),
    guestRating: parseMultiValue(url, "guestRating"),
    amenities: parseMultiValue(url, "amenities"),
  };

  const sort = parseSort(url);

  let loadError: string | null = null;

  const source = await loadHotelResultsFromDb({
    query,
    location: destinationLocation,
    checkIn,
    checkOut,
    occupancy,
    sort,
    page,
    pageSize: 24,
    filters,
  }).catch((error) => {
    loadError =
      error instanceof Error ? error.message : "Failed to load hotel results.";

    return {
      matchedCity: null,
      page,
      results: [],
      totalCount: 0,
      totalPages: 1,
    };
  });

  const qHuman =
    destinationLocation?.displayName ||
    source.matchedCity?.name ||
    safeTitleQuery(query).replaceAll("-", " ");

  return {
    query: destinationLocation?.searchSlug || query,
    page: source.page,
    qHuman,
    destinationLocationId: destinationLocation?.locationId || null,
    results: source.results,
    totalCount: source.totalCount,
    totalPages: source.totalPages,
    sort,
    filters,
    loadError,
  };
});

export default component$(() => {
  const data = useSearchHotelsPage().value;
  const location = useLocation();
  const navigate = useNavigate();
  useBookingAbandonmentTelemetry({
    vertical: "hotels",
    stage: "search_results",
    payload: {
      surface: "legacy_search_route",
    },
    trackOnCleanup: false,
  });

  const pathBase = `/search/hotels/${encodeURIComponent(data.query)}`;
  const mobileFiltersOpen = useSignal(false);
  const desktopFiltersOpen = useSignal(true);

  const nights = computeNights(
    location.url.searchParams.get("checkIn"),
    location.url.searchParams.get("checkOut"),
  );

  const activeFilters: FilterValues = {
    priceRange: data.filters.priceRange,
    starRating: data.filters.starRating,
    guestRating: data.filters.guestRating,
    amenities: data.filters.amenities,
  };

  const onCheckboxToggle$ = $(
    async (sectionId: string, optionValue: string) => {
      trackBookingEvent("booking_filter_toggled", {
        vertical: "hotels",
        surface: "search_results",
        filter_group: sectionId,
        filter_value: optionValue,
        action: Array.isArray(activeFilters[sectionId])
          ? activeFilters[sectionId].includes(optionValue)
            ? "remove"
            : "add"
          : "set",
      });
      await navigate(
        toggleCheckboxFilterHref(
          pathBase,
          location.url.searchParams,
          sectionId,
          optionValue,
        ),
      );
    },
  );

  const onSelectChange$ = $(async (sectionId: string, value: string) => {
    void sectionId;
    void value;
    // Hotels filters are checkbox-based in this view.
  });

  const onReset$ = $(async () => {
    trackBookingEvent("booking_filters_cleared", {
      vertical: "hotels",
      surface: "search_results",
      active_filter_count: activeFilterChips.length,
    });
    const params = new URLSearchParams(location.url.searchParams);
    params.delete("priceRange");
    params.delete("starRating");
    params.delete("guestRating");
    params.delete("amenities");
    await navigate(toPageHref(pathBase, 1, params));
  });

  const onToggleFilters$ = $(() => {
    trackBookingEvent("booking_filter_panel_toggled", {
      vertical: "hotels",
      surface: "search_results",
      action: "toggle",
      active_filter_count: activeFilterChips.length,
    });
    if (window.matchMedia("(min-width: 1024px)").matches) {
      desktopFiltersOpen.value = !desktopFiltersOpen.value;
      return;
    }

    mobileFiltersOpen.value = !mobileFiltersOpen.value;
  });

  const contextParts = [`Destination: ${data.qHuman}`];
  if (nights != null) {
    contextParts.push(`${nights} ${nights === 1 ? "night" : "nights"}`);
  }

  const destination =
    String(location.url.searchParams.get("destination") || "").trim() ||
    data.qHuman;
  const checkIn = String(location.url.searchParams.get("checkIn") || "").trim();
  const checkOut = String(
    location.url.searchParams.get("checkOut") || "",
  ).trim();
  const guests = String(location.url.searchParams.get("guests") || "").trim();
  const searchAgainParams = new URLSearchParams();
  if (destination) {
    searchAgainParams.set("destination", destination);
  }
  if (data.destinationLocationId) {
    searchAgainParams.set("destinationLocationId", data.destinationLocationId);
  }
  if (checkIn) {
    searchAgainParams.set("checkIn", checkIn);
  }
  if (checkOut) {
    searchAgainParams.set("checkOut", checkOut);
  }
  if (guests) {
    searchAgainParams.set("guests", guests);
  }
  const searchAgainHref = searchAgainParams.toString()
    ? `/hotels?${searchAgainParams.toString()}`
    : "/hotels";

  const makePageHref = (pageNumber: number) =>
    toPageHref(pathBase, pageNumber, location.url.searchParams);
  const refreshHref = `${location.url.pathname}${location.url.search}`;
  const refreshSnapshotId = `hotel-search:${refreshHref}`;
  const visibleInventoryIds = data.results.flatMap((hotel) =>
    hotel.inventoryId != null ? [hotel.inventoryId] : [],
  );
  const refreshPriceChanges = useSignal<Record<string, PriceChange>>({});
  const refreshPriceSummary = useSignal<string | null>(null);
  const availabilitySignals = summarizeAvailabilitySignals(data.results);
  const asyncState = resolveAvailabilityAsyncState({
    itemCount: data.totalCount,
    isRefreshing: location.isNavigating,
    isFailed: Boolean(data.loadError),
    signals: availabilitySignals,
  });
  const controlsDisabled = location.isNavigating || asyncState === "failed";
  const statusNotice = buildHotelSearchStatusNotice(asyncState, {
    partialCount: availabilitySignals.partialCount,
    staleCount: availabilitySignals.staleCount,
    failedCount: availabilitySignals.failedCount,
  });
  const detailParams = new URLSearchParams();
  if (checkIn) detailParams.set("checkIn", checkIn);
  if (checkOut) detailParams.set("checkOut", checkOut);
  const sortOptions = HOTEL_SORT_OPTIONS.map((option) => {
    const params = new URLSearchParams(location.url.searchParams);
    if (option.value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", option.value);
    }

    return {
      label: option.label,
      value: option.value,
      active: data.sort === option.value,
      href: toPageHref(pathBase, 1, params),
    };
  });
  const activeFilterGroups: ResultsFilterGroup[] = HOTEL_FILTER_SECTIONS.map(
    (section) => ({
      title: section.title,
      options:
        section.type === "checkbox"
          ? section.options
              .filter((option) =>
                Array.isArray(activeFilters[section.id])
                  ? activeFilters[section.id].includes(option.value)
                  : false,
              )
              .map((option) => ({
                label: option.label,
                href: toggleCheckboxFilterHref(
                  pathBase,
                  location.url.searchParams,
                  section.id,
                  option.value,
                ),
                active: true,
              }))
          : [],
    }),
  ).filter((group) => group.options.length > 0);
  const activeFilterChips = buildResultsFilterChips(activeFilterGroups);
  const clearAllHref = (() => {
    const params = new URLSearchParams(location.url.searchParams);
    params.delete("priceRange");
    params.delete("starRating");
    params.delete("guestRating");
    params.delete("amenities");
    return toPageHref(pathBase, 1, params);
  })();

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
      data.results.map((hotel) => ({
        id: hotel.id,
        amount: hotel.priceFrom,
        currencyCode: hotel.currency,
      })),
      "Nightly rate",
    );

    refreshPriceChanges.value = nextChanges;
    refreshPriceSummary.value = describePriceChangeCollection(
      Object.values(nextChanges),
    );
  });

  const onRevalidateVisibleResults$ = $(async () => {
    if (!visibleInventoryIds.length) {
      throw new Error("No visible hotel inventory can be revalidated.");
    }

    storeRefreshPriceSnapshot(
      refreshSnapshotId,
      data.results.map((hotel) => ({
        id: hotel.id,
        amount: hotel.priceFrom,
        currencyCode: hotel.currency,
      })),
    );

    await revalidateInventoryApi({
      itemType: "hotel",
      inventoryIds: visibleInventoryIds,
    });
  });

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Hotels", href: "/hotels" },
        { label: "Search", href: "/search/hotels" },
        { label: data.qHuman, href: `${pathBase}/1` },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Hotel search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          {contextParts.join(" · ")}
        </p>
      </div>

      <div class="mt-4 flex justify-end">
        <InventoryRefreshControl
          id={refreshSnapshotId}
          mode={visibleInventoryIds.length ? "action" : "unsupported"}
          onRefresh$={
            visibleInventoryIds.length ? onRevalidateVisibleResults$ : undefined
          }
          reloadHref={refreshHref}
          reloadOnSuccess={true}
          label="Refresh visible availability"
          refreshingLabel="Refreshing..."
          refreshedLabel="Availability refreshed"
          failedLabel="Retry refresh"
          unsupportedLabel="Refresh unavailable"
          unsupportedMessage="No visible hotel inventory can refresh availability right now."
          successMessage="Visible hotel availability was refreshed. Any nightly-rate changes are highlighted below."
          failureMessage="Failed to refresh visible hotel availability signals."
          align="right"
          disabled={controlsDisabled}
          telemetry={{
            vertical: "hotels",
            surface: "search_results",
            refreshType: "visible_inventory_revalidation",
            itemCount: visibleInventoryIds.length,
          }}
        />
      </div>

      <ResultsControlBar
        class="mt-4"
        sortId="hotel-search-results-sort"
        resultCountLabel={`${data.totalCount.toLocaleString("en-US")} hotels found`}
        sortOptions={sortOptions}
        activeFilterChips={activeFilterChips}
        clearAllHref={clearAllHref}
        onToggleFilters$={onToggleFilters$}
        busy={location.isNavigating}
        disabled={controlsDisabled}
        telemetry={{
          vertical: "hotels",
          surface: "search_results",
        }}
      />

      <div class="mt-4 lg:hidden">
        {mobileFiltersOpen.value ? (
          <FiltersPanel
            title="Filters"
            sections={HOTEL_FILTER_SECTIONS}
            values={activeFilters}
            onCheckboxToggle$={onCheckboxToggle$}
            onSelectChange$={onSelectChange$}
            onReset$={onReset$}
            disabled={controlsDisabled}
          />
        ) : null}
      </div>

      <div
        class={[
          "mt-6 grid gap-6 lg:items-start",
          desktopFiltersOpen.value
            ? "lg:grid-cols-[300px_1fr]"
            : "lg:grid-cols-[1fr]",
        ]}
      >
        {desktopFiltersOpen.value ? (
          <FiltersPanel
            title="Filters"
            class="hidden lg:block"
            sections={HOTEL_FILTER_SECTIONS}
            values={activeFilters}
            onCheckboxToggle$={onCheckboxToggle$}
            onSelectChange$={onSelectChange$}
            onReset$={onReset$}
            disabled={controlsDisabled}
          />
        ) : null}

        <main>
          <SearchMapCard />

          <section class="mt-6">
            <SearchResultsSummary
              shown={data.results.length}
              total={data.totalCount}
              page={data.page}
              totalPages={data.totalPages}
            />

            {statusNotice ? (
              <AsyncStateNotice
                class="mt-4"
                state={asyncState}
                title={statusNotice.title}
                message={statusNotice.message}
              />
            ) : null}

            {refreshPriceSummary.value ? (
              <div class="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
                {refreshPriceSummary.value}
              </div>
            ) : null}

            <div class="mt-4">
              {asyncState === "failed" ? (
                <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
                  <AsyncStateNotice
                    state="failed"
                    title="Hotel results could not be updated"
                    message={data.loadError || "Failed to load hotel results."}
                  />
                  <AsyncRetryControl
                    class="mt-4"
                    message="Retry this search or go back to the hotel search form."
                    label="Retry hotel search"
                    href={location.url.pathname + location.url.search}
                    telemetry={{
                      vertical: "hotels",
                      surface: "search_results",
                      retryType: "search_reload",
                      context: "load_failure",
                    }}
                  />
                </div>
              ) : asyncState === "initial_loading" ? (
                <ResultsLoading variant="list" count={3} />
              ) : data.results.length ? (
                <div
                  class={[
                    "grid gap-3",
                    asyncState === "refreshing" ? "opacity-70" : null,
                  ]}
                >
                  {data.results.map((hotel: HotelResult, index: number) => (
                    <HotelResultCard
                      key={hotel.id}
                      h={hotel}
                      nights={nights}
                      activeSort={data.sort}
                      priceDisplay={{
                        ...buildHotelPriceDisplay({
                          currencyCode: hotel.currency,
                          nightlyRate: hotel.priceFrom,
                          nights,
                        }),
                        delta: refreshPriceChanges.value[hotel.id] || null,
                      }}
                      detailHref={
                        detailParams.size
                          ? `/hotels/${encodeURIComponent(hotel.slug)}?${detailParams.toString()}`
                          : `/hotels/${encodeURIComponent(hotel.slug)}`
                      }
                      telemetry={{
                        vertical: "hotels",
                        surface: "search_results",
                        itemId: hotel.id,
                        itemPosition: (data.page - 1) * 24 + index + 1,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <SearchEmptyState
                  title="No hotels matched this search"
                  description="Try different dates, a broader destination, or fewer constraints."
                  primaryAction={{
                    label: "Search hotels again",
                    href: searchAgainHref,
                  }}
                  secondaryAction={{
                    label: "Browse hotel cities",
                    href: "/hotels",
                  }}
                />
              )}
            </div>

            <ResultsPagination
              page={data.page}
              totalPages={data.totalPages}
              prevHref={data.page > 1 ? makePageHref(data.page - 1) : undefined}
              nextHref={
                data.page < data.totalPages
                  ? makePageHref(data.page + 1)
                  : undefined
              }
              pageLinks={buildPageLinks(
                data.page,
                data.totalPages,
                makePageHref,
              )}
              disabled={controlsDisabled}
            />
          </section>
        </main>
      </div>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useSearchHotelsPage);

  const title = `Hotels in ${data.qHuman} – Page ${data.page} | Andacity Travel`;
  const description = `Browse hotel results for ${data.qHuman}. Compare totals and policies with clarity.`;
  const canonicalPath = `/search/hotels/${encodeURIComponent(data.query)}/${data.page}`;
  const canonicalHref = new URL(canonicalPath, url.origin).href;

  return {
    title,
    meta: [
      { name: "description", content: description },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};

const buildHotelSearchStatusNotice = (
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
        "Updated rates and filter changes are loading. Current stays stay visible until the next result set is ready.",
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
