import { component$ } from "@builder.io/qwik";
import {
  CarRentalFilters,
  type CarRentalFilterGroup,
} from "~/components/car-rentals/CarRentalFilters";
import { ResultsShell } from "~/components/results/ResultsShell";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
import { CarResultsList } from "~/components/search/cars/CarResultsList";
import { buildCarSearchEditorHref } from "~/components/search/cars/carResultsRendererModel";
import {
  CAR_RENTALS_SORT_OPTIONS,
  normalizeCarRentalsSortValue,
  type CarRentalsSortKey,
} from "~/lib/search/car-rentals/car-sort-options";
import type {
  CarRentalsPickupType,
  CarRentalsTransmission,
} from "~/lib/search/car-rentals/filter-types";
import {
  clearSearchStateFilters,
  withSearchStateArrayToggle,
  withSearchStateSingleToggle,
  withSearchStateSort,
} from "~/lib/search/state-controls";
import { searchStateToUrl } from "~/lib/search/state-to-url";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { mapCarResultCardForUi } from "~/server/search/mapCarResultsForUi";
import type { CanonicalCarSearchPageSuccess } from "~/server/search/loadCanonicalCarSearchPage";
import type { CarSearchEntity } from "~/types/search-entity";

const CAR_FILTER_KEYS = [
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

const PRICE_BANDS = [
  { label: "Under $50", value: "under-50" },
  { label: "$50-$100", value: "50-100" },
  { label: "$100-$150", value: "100-150" },
  { label: "$150+", value: "150-plus" },
] as const;

const normalizeToken = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

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

const parseCarRentalsSelectedFilters = (filters: Record<string, unknown>) => {
  const pickupType = normalizeToken(
    String(filters.pickup || filters.pickupType || ""),
  );
  const transmission = normalizeToken(String(filters.transmission || ""));
  const seatsToken = String(filters.seats || filters.seatsMin || "").trim();
  const seatsMin = seatsToken ? Number.parseInt(seatsToken, 10) : null;

  return {
    vehicleClasses: Array.from(
      new Set(
        [...toStringArray(filters.class), ...toStringArray(filters.vehicleClass)]
          .map(normalizeToken)
          .filter(Boolean),
      ),
    ),
    pickupType:
      pickupType === "airport" || pickupType === "city" ? pickupType : "",
    transmission:
      transmission === "automatic" || transmission === "manual"
        ? transmission
        : "",
    seatsMin:
      seatsMin != null && Number.isFinite(seatsMin) && seatsMin > 0
        ? seatsMin
        : null,
    priceBand: normalizeToken(
      String(
        filters.priceBand ||
          filters.price ||
          toStringArray(filters.priceRange)[0] ||
          "",
      ),
    ),
  };
};

const titleCase = (value: string) =>
  normalizeToken(value)
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

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

const getVehicleClass = (result: CarSearchEntity) =>
  normalizeToken(String(result.payload.vehicleClass || result.metadata.vehicleClass || ""));

const getPickupType = (result: CarSearchEntity): CarRentalsPickupType | "" => {
  const token = normalizeToken(
    String(result.payload.pickupLocationType || result.metadata.pickupLocationType || ""),
  );
  if (token === "airport" || token === "city") return token;
  return "";
};

const getTransmission = (result: CarSearchEntity): CarRentalsTransmission | "" => {
  const token = normalizeToken(String(result.payload.transmissionType || result.metadata.transmission || ""));
  if (token === "automatic" || token === "manual") return token;
  return "";
};

const getSeats = (result: CarSearchEntity) =>
  typeof result.payload.seatingCapacity === "number"
    ? result.payload.seatingCapacity
    : typeof result.metadata.seats === "number"
      ? result.metadata.seats
      : null;

const getDailyAmount = (result: CarSearchEntity) => {
  const dailyCents =
    result.payload.priceSummary?.dailyBaseCents ?? result.price.amountCents;
  return typeof dailyCents === "number"
    ? Math.max(0, Math.round(dailyCents / 100))
    : Number.MAX_SAFE_INTEGER;
};

const getTotalAmount = (result: CarSearchEntity) => {
  const totalCents = result.payload.priceSummary?.totalPriceCents;
  return typeof totalCents === "number"
    ? Math.max(0, Math.round(totalCents / 100))
    : getDailyAmount(result);
};

const getValueScore = (result: CarSearchEntity) => {
  const airportBonus = getPickupType(result) === "airport" ? 20 : 0;
  const freeCancellationBonus = result.payload.policy?.freeCancellation ? 12 : 0;
  return (airportBonus + freeCancellationBonus + 120) / Math.max(getDailyAmount(result), 1);
};

const inPriceBand = (amount: number, band: string) => {
  if (!Number.isFinite(amount)) return false;
  if (band === "under-50") return amount < 50;
  if (band === "50-100") return amount >= 50 && amount <= 100;
  if (band === "100-150") return amount > 100 && amount <= 150;
  if (band === "150-plus") return amount > 150;
  return true;
};

const buildQuerySummary = (page: CanonicalCarSearchPageSuccess) =>
  [
    `Car rentals at ${page.request.airport}`,
    `${page.ui.summary.pickupDateLabel}-${page.ui.summary.dropoffDateLabel}`,
    page.ui.summary.rentalLengthLabel,
  ].join(" · ");

const compareByActiveSort = (
  activeSort: CarRentalsSortKey,
  left: CarSearchEntity,
  right: CarSearchEntity,
) => {
  if (activeSort === "price-asc") {
    return getTotalAmount(left) - getTotalAmount(right);
  }

  if (activeSort === "value") {
    return getValueScore(right) - getValueScore(left);
  }

  if (activeSort === "pickup-convenience") {
    const leftRank = getPickupType(left) === "airport" ? 0 : 1;
    const rightRank = getPickupType(right) === "airport" ? 0 : 1;
    return leftRank - rightRank || getDailyAmount(left) - getDailyAmount(right);
  }

  return 0;
};

export const CanonicalCarResultsSection = component$(
  (props: CanonicalCarResultsSectionProps) => {
    const url = new URL(props.currentPath, "https://andacity.test");
    const searchState = searchStateFromUrl(url, {
      query: props.page.request.airport,
      dates: {
        checkIn: props.page.request.pickupDate,
        checkOut: props.page.request.dropoffDate,
      },
      sort: "recommended",
      page: 1,
    });
    const activeSort = normalizeCarRentalsSortValue(searchState.sort);
    const selectedFilters = parseCarRentalsSelectedFilters(searchState.filters || {});
    const preservedFilterKeys = Object.keys(searchState.filters || {}).filter(
      (key) =>
        !CAR_FILTER_KEYS.includes(key as (typeof CAR_FILTER_KEYS)[number]),
    );
    const pathname = url.pathname;
    const toHref = (nextState: typeof searchState) =>
      toSearchHref(pathname, nextState);

    const filteredResults = props.page.results.filter((result) => {
      if (
        selectedFilters.vehicleClasses.length &&
        !selectedFilters.vehicleClasses.includes(getVehicleClass(result))
      ) {
        return false;
      }

      if (selectedFilters.pickupType && getPickupType(result) !== selectedFilters.pickupType) {
        return false;
      }

      if (
        selectedFilters.transmission &&
        getTransmission(result) !== selectedFilters.transmission
      ) {
        return false;
      }

      if (
        selectedFilters.seatsMin != null &&
        ((getSeats(result) || 0) < selectedFilters.seatsMin)
      ) {
        return false;
      }

      if (
        selectedFilters.priceBand &&
        !inPriceBand(getDailyAmount(result), selectedFilters.priceBand)
      ) {
        return false;
      }

      return true;
    });

    const sortedResults =
      activeSort === "recommended" || activeSort === "rating-desc"
        ? filteredResults
        : filteredResults
            .slice()
            .sort((left, right) => compareByActiveSort(activeSort, left, right));

    const vehicleClasses = Array.from(
      new Set(props.page.results.map((result) => getVehicleClass(result)).filter(Boolean)),
    );
    const pickupTypes = Array.from(
      new Set(
        props.page.results
          .map((result) => getPickupType(result))
          .filter((value): value is CarRentalsPickupType => Boolean(value)),
      ),
    );
    const transmissions = Array.from(
      new Set(
        props.page.results
          .map((result) => getTransmission(result))
          .filter((value): value is CarRentalsTransmission => Boolean(value)),
      ),
    );
    const seats = Array.from(
      new Set(
        props.page.results
          .map((result) => getSeats(result))
          .filter((value): value is number => typeof value === "number" && value > 0),
      ),
    ).sort((a, b) => a - b);

    const filterGroups: CarRentalFilterGroup[] = [
      {
        title: "Vehicle class",
        options: vehicleClasses.map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateArrayToggle(
              searchState,
              "class",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.vehicleClasses.includes(value),
        })),
      },
      {
        title: "Pickup type",
        options: pickupTypes.map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "pickup",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.pickupType === value,
        })),
      },
      {
        title: "Transmission",
        options: transmissions.map((value) => ({
          label: titleCase(value),
          href: toHref(
            withSearchStateSingleToggle(
              searchState,
              "transmission",
              value,
              normalizeToken,
            ),
          ),
          active: selectedFilters.transmission === value,
        })),
      },
      {
        title: "Seats",
        options: seats.map((value) => ({
          label: `${value}+ seats`,
          href: toHref(
            withSearchStateSingleToggle(searchState, "seats", String(value)),
          ),
          active: selectedFilters.seatsMin === value,
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
    const cards = sortedResults.map((result) =>
      mapCarResultCardForUi(result, props.page.request),
    );
    const hasProviderResults = props.page.results.length > 0;

    return (
      <ResultsShell
        querySummary={buildQuerySummary(props.page)}
        editSearchHref={buildCarSearchEditorHref(props.page.request)}
        filtersTitle="Car rental filters"
        asyncState={props.isNavigating ? "refreshing" : undefined}
        refreshingOverlayLabel="Updating rentals"
        controlsDisabled={props.isNavigating}
        resultCountLabel={`${cards.length.toLocaleString("en-US")} rentals`}
        sortId="canonical-car-results-sort"
        sortOptions={CAR_RENTALS_SORT_OPTIONS.map((option) => ({
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
                  ? "No rentals match these filters."
                  : "No cars were found for this search.",
                description: activeFilterChips.length
                  ? "Clear one or more filters to widen the results."
                  : "Try different dates, a nearby airport, or another pickup location.",
                primaryAction: activeFilterChips.length
                  ? {
                      label: "Clear filters",
                      href: clearAllFiltersHref,
                    }
                  : {
                      label: "Revise search",
                      href: buildCarSearchEditorHref(props.page.request),
                    },
                secondaryAction: {
                  label: hasProviderResults ? "Edit search" : "Start a new search",
                  href: hasProviderResults
                    ? buildCarSearchEditorHref(props.page.request)
                    : "/car-rentals",
                },
              }
        }
      >
        <CarRentalFilters
          q:slot="filters-desktop"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "cars",
            surface: "search_results",
          }}
        />
        <CarRentalFilters
          q:slot="filters-mobile"
          groups={filterGroups}
          disabled={props.isNavigating}
          telemetry={{
            vertical: "cars",
            surface: "search_results",
          }}
        />

        {props.page.progress?.status === "partial" ? (
          <div class="mb-4 rounded-3xl border border-[color:var(--color-border)] bg-white/90 px-5 py-4 text-sm text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)]">
            <p class="font-semibold text-[color:var(--color-text)]">
              Loading more car rental results
            </p>
            <p class="mt-1">
              Additional vehicles and pricing are still arriving. Current results remain filterable while the search finishes.
            </p>
          </div>
        ) : null}

        {cards.length ? <CarResultsList cards={cards} /> : null}
      </ResultsShell>
    );
  },
);

type CanonicalCarResultsSectionProps = {
  page: CanonicalCarSearchPageSuccess;
  currentPath: string;
  isNavigating?: boolean;
};
