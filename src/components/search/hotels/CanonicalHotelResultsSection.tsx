import { component$ } from "@builder.io/qwik";
import { HotelFilters, type HotelFilterGroup } from "~/components/hotels/HotelFilters";
import { ResultsShell } from "~/components/results/ResultsShell";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { HotelResultsList } from "~/components/search/hotels/HotelResultsList";
import { buildHotelSearchEditorHref } from "~/components/search/hotels/hotelResultsRendererModel";
import {
  HOTEL_SORT_OPTIONS,
  normalizeHotelSort,
  type HotelSortKey,
} from "~/lib/search/hotels/hotel-sort-options";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { mapHotelResultCardForUi } from "~/server/search/mapHotelResultsForUi";
import type { CanonicalHotelSearchPageSuccess } from "~/server/search/loadCanonicalHotelSearchPage";
import type { HotelSearchEntity } from "~/types/search-entity";

const HOTEL_FILTER_KEYS = [
  "starsMin",
  "price",
  "amenities",
  "neighborhoods",
  "propertyTypes",
] as const;

type HotelPriceTier = "budget" | "mid" | "upscale" | "luxury";

const normalizeToken = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

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
  const numeric = Number.parseInt(raw, 10);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeAmenity = (value: string) => {
  const token = normalizeToken(value);
  if (token.includes("wifi")) return "wifi";
  if (token.includes("pet")) return "pet-friendly";
  if (token.includes("pool")) return "pool";
  if (token.includes("parking")) return "parking";
  return token;
};

const titleCase = (value: string) =>
  normalizeToken(value)
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const getHotelStars = (result: HotelSearchEntity) =>
  result.payload.propertySummary?.stars ?? result.metadata.stars ?? null;

const getHotelRating = (result: HotelSearchEntity) =>
  result.payload.propertySummary?.rating ?? result.metadata.rating ?? null;

const getHotelNeighborhood = (result: HotelSearchEntity) =>
  normalizeToken(
    String(
      result.payload.propertySummary?.neighborhood || result.metadata.neighborhood || "",
    ),
  );

const getHotelPropertyType = (result: HotelSearchEntity) =>
  normalizeToken(String(result.payload.propertySummary?.propertyType || ""));

const getHotelAmenities = (result: HotelSearchEntity) => {
  const propertyAmenities = result.payload.propertySummary?.amenities || [];
  const inclusions = Array.isArray(result.payload.inclusions)
    ? result.payload.inclusions
    : [];

  return Array.from(
    new Set(
      [...propertyAmenities, ...inclusions]
        .map((entry) => normalizeAmenity(String(entry || "")))
        .filter(Boolean),
    ),
  );
};

const getNightlyAmount = (result: HotelSearchEntity) => {
  const nightlyCents = result.payload.priceSummary?.nightlyBaseCents;
  if (typeof nightlyCents === "number") {
    return Math.max(0, Math.round(nightlyCents / 100));
  }

  const totalCents =
    result.payload.priceSummary?.totalPriceCents ?? result.price.amountCents;
  const nights = result.payload.priceSummary?.nights;
  if (typeof totalCents === "number" && typeof nights === "number" && nights > 0) {
    return Math.max(0, Math.round(totalCents / 100 / nights));
  }

  if (typeof totalCents === "number") {
    return Math.max(0, Math.round(totalCents / 100));
  }

  return Number.MAX_SAFE_INTEGER;
};

const getTotalAmount = (result: HotelSearchEntity) => {
  const totalCents =
    result.payload.priceSummary?.totalPriceCents ?? result.price.amountCents;
  return typeof totalCents === "number"
    ? Math.max(0, Math.round(totalCents / 100))
    : Number.MAX_SAFE_INTEGER;
};

const getHotelPriceTier = (result: HotelSearchEntity): HotelPriceTier => {
  const nightlyAmount = getNightlyAmount(result);
  if (nightlyAmount < 150) return "budget";
  if (nightlyAmount < 300) return "mid";
  if (nightlyAmount < 500) return "upscale";
  return "luxury";
};

const getHotelValueScore = (result: HotelSearchEntity) => {
  const rating = getHotelRating(result) || 0;
  const stars = getHotelStars(result) || 0;
  const policyBonus =
    (result.payload.policy?.freeCancellation ? 18 : 0) +
    (result.payload.policy?.payLater ? 12 : 0);

  return (rating * 100 + stars * 22 + policyBonus) / Math.max(getNightlyAmount(result), 1);
};

const buildQuerySummary = (page: CanonicalHotelSearchPageSuccess) =>
  [
    `Hotels in ${page.ui.summary.cityLabel}`,
    `${page.ui.summary.checkInDateLabel}-${page.ui.summary.checkOutDateLabel}`,
    page.ui.summary.stayLengthLabel,
  ].join(" · ");

const compareByActiveSort = (
  activeSort: HotelSortKey,
  left: HotelSearchEntity,
  right: HotelSearchEntity,
) => {
  if (activeSort === "price-asc") {
    return getTotalAmount(left) - getTotalAmount(right);
  }

  if (activeSort === "value") {
    return getHotelValueScore(right) - getHotelValueScore(left);
  }

  if (activeSort === "rating-desc") {
    return (getHotelRating(right) || 0) - (getHotelRating(left) || 0);
  }

  return 0;
};

export const CanonicalHotelResultsSection = component$(
  (props: CanonicalHotelResultsSectionProps) => {
    const url = new URL(props.currentPath, "https://andacity.test");
    const searchState = searchStateFromUrl(url, {
      query: props.page.request.city,
      dates: {
        checkIn: props.page.request.checkIn,
        checkOut: props.page.request.checkOut,
      },
      sort: "recommended",
      page: 1,
    });
    const activeSort = normalizeHotelSort(searchState.sort);
    const rawFilters = searchState.filters || {};
    const selectedStarMin = toMaybeNumber(rawFilters.starsMin);
    const selectedPriceTier = normalizeToken(String(rawFilters.price || "")) as
      | HotelPriceTier
      | "";
    const selectedAmenities = toStringArray(rawFilters.amenities).map(normalizeAmenity);
    const selectedNeighborhoods = toStringArray(rawFilters.neighborhoods).map(normalizeToken);
    const selectedPropertyTypes = toStringArray(rawFilters.propertyTypes).map(normalizeToken);
    const preservedFilterKeys = Object.keys(rawFilters).filter(
      (key) =>
        !HOTEL_FILTER_KEYS.includes(key as (typeof HOTEL_FILTER_KEYS)[number]),
    );
    const pathname = url.pathname;
    const toHref = (nextState: typeof searchState) =>
      toSearchHref(pathname, nextState);

    const filteredResults = props.page.results.filter((result) => {
      if (selectedStarMin != null && (getHotelStars(result) || 0) < selectedStarMin) {
        return false;
      }

      if (selectedPriceTier && getHotelPriceTier(result) !== selectedPriceTier) {
        return false;
      }

      if (selectedAmenities.length) {
        const amenities = getHotelAmenities(result);
        if (!selectedAmenities.every((needle) => amenities.includes(needle))) {
          return false;
        }
      }

      if (
        selectedNeighborhoods.length &&
        !selectedNeighborhoods.includes(getHotelNeighborhood(result))
      ) {
        return false;
      }

      if (
        selectedPropertyTypes.length &&
        !selectedPropertyTypes.includes(getHotelPropertyType(result))
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

    const starValues = Array.from(
      new Set(
        props.page.results
          .map((result) => getHotelStars(result))
          .filter((value): value is number => typeof value === "number" && value > 0),
      ),
    ).sort((a, b) => b - a);
    const propertyTypes = Array.from(
      new Set(
        props.page.results
          .map((result) => getHotelPropertyType(result))
          .filter(Boolean),
      ),
    );
    const neighborhoods = Array.from(
      new Set(
        props.page.results
          .map((result) => getHotelNeighborhood(result))
          .filter(Boolean),
      ),
    );
    const amenities = Array.from(
      new Set(props.page.results.flatMap((result) => getHotelAmenities(result))),
    );

    const filterGroups: HotelFilterGroup[] = [
      {
        title: "Star rating",
        options: starValues.map((value) => ({
          label: `${value}+ stars`,
          href: toHref(
            withSearchStateSingleToggle(searchState, "starsMin", String(value)),
          ),
          active: selectedStarMin === value,
        })),
      },
      {
        title: "Price",
        options: [
          { label: "Budget", value: "budget" },
          { label: "Mid-range", value: "mid" },
          { label: "Upscale", value: "upscale" },
          { label: "Luxury", value: "luxury" },
        ].map((option) => ({
          label: option.label,
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "price",
              option.value,
              normalizeToken,
            ),
          ),
          active: selectedPriceTier === option.value,
        })),
      },
      {
        title: "Stay type",
        options: propertyTypes.map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "propertyTypes",
              value,
              normalizeToken,
            ),
          ),
          active: selectedPropertyTypes.includes(value),
        })),
      },
      {
        title: "Amenities",
        options: amenities.slice(0, 12).map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "amenities",
              value,
              normalizeAmenity,
            ),
          ),
          active: selectedAmenities.includes(value),
        })),
      },
      {
        title: "Neighborhoods",
        options: neighborhoods.map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "neighborhoods",
              value,
              normalizeToken,
            ),
          ),
          active: selectedNeighborhoods.includes(value),
        })),
      },
    ].filter((group) => group.options.length > 0);

    const activeFilterChips = buildResultsFilterChips(filterGroups);
    const clearAllFiltersHref = toHref(
      clearSearchStateFilters(searchState, preservedFilterKeys),
    );
    const cards = sortedResults.map((result) =>
      mapHotelResultCardForUi(result, props.page.ui.summary.cityLabel),
    );
    const hasProviderResults = props.page.results.length > 0;

    return (
      <ResultsShell
        querySummary={buildQuerySummary(props.page)}
        editSearchHref={buildHotelSearchEditorHref(
          props.page.request,
          props.page.ui.summary.cityLabel,
        )}
        filtersTitle="Hotel filters"
        asyncState={props.isNavigating ? "refreshing" : undefined}
        refreshingOverlayLabel="Updating stays"
        controlsDisabled={props.isNavigating}
        resultCountLabel={`${cards.length.toLocaleString("en-US")} stays`}
        sortId="canonical-hotel-results-sort"
        sortOptions={HOTEL_SORT_OPTIONS.map((option) => ({
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
                title: activeFilterChips.length
                  ? "No stays match these filters."
                  : "No hotels were found for this search.",
                description: activeFilterChips.length
                  ? "Clear one or more filters to widen the results."
                  : "Try different dates, a nearby destination, or a shorter stay.",
                primaryAction: activeFilterChips.length
                  ? {
                      label: "Clear filters",
                      href: clearAllFiltersHref,
                    }
                  : {
                      label: "Revise search",
                      href: buildHotelSearchEditorHref(
                        props.page.request,
                        props.page.ui.summary.cityLabel,
                      ),
                    },
                secondaryAction: {
                  label: hasProviderResults ? "Edit search" : "Start a new search",
                  href: hasProviderResults
                    ? buildHotelSearchEditorHref(
                        props.page.request,
                        props.page.ui.summary.cityLabel,
                      )
                    : "/hotels",
                },
              }
        }
      >
        <HotelFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "hotels",
            surface: "search_results",
          }}
        />
        <HotelFilters
          q:slot="filters-mobile"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "hotels",
            surface: "search_results",
          }}
        />

        {props.page.progress?.status === "partial" ? (
          <div class="mb-4 rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
            <p class="font-semibold text-[color:var(--color-text)]">
              Loading more hotel results
            </p>
            <p class="mt-1">
              Additional properties and rates are still arriving. Current results remain filterable while the search finishes.
            </p>
          </div>
        ) : null}

        {cards.length ? <HotelResultsList cards={cards} /> : null}
      </ResultsShell>
    );
  },
);

type CanonicalHotelResultsSectionProps = {
  page: CanonicalHotelSearchPageSuccess;
  currentPath: string;
  isNavigating?: boolean;
};
