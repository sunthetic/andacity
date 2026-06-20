/**
 * CLAUDE-UI-016 — production flight results section on the `--ui-*` system.
 *
 * Handles real URL-driven sort/filter, progressive-load banner, empty state,
 * and the two-column (filter rail + cards) desktop layout. All logic mirrors
 * CanonicalFlightResultsSection; the presentation is fully `--ui-*`.
 *
 * Filter groups:
 *   Supported (real URL toggles): Stops, Departure window, Arrival window,
 *   Cabin class, Price band.
 * Sort options (real, match FLIGHT_SORT_OPTIONS):
 *   Smart rank · Price · Duration · Earliest departure.
 *
 * Fare safety: only real FlightResultCardModel fields are rendered.
 */
import { $, component$, useSignal } from "@builder.io/qwik";
import { FlightResultCard } from "~/components/flights/results/FlightResultCard";
import { buildResultsFilterChips } from "~/components/results/ResultsFilterGroups";
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
import type { FlightSearchEntity } from "~/types/search-entity";
import type { FlightCabinClass, FlightTimeWindow } from "~/types/flights/search";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* Filter/sort helpers (same logic as CanonicalFlightResultsSection)  */
/* ------------------------------------------------------------------ */

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
  { label: "$200–$400", value: "200-400" },
  { label: "$400–$700", value: "400-700" },
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
    { ...state, query: "", location: undefined, dates: undefined },
    { includeQueryParam: false, includeLocationParams: false },
  );

const parseIsoDateTime = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const deriveFlightWindow = (value: string | null | undefined): FlightTimeWindow | null => {
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
    return Math.max(0, Math.round((arrivalAt.getTime() - departureAt.getTime()) / 60000));
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
    case "premium-economy": return "Premium Economy";
    case "business": return "Business";
    case "first": return "First";
    default: return "Economy";
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

const buildFlightFacets = (results: FlightSearchEntity[]): FlightSearchFacets => ({
  departureWindows: Array.from(
    new Set(
      results
        .map((r) => deriveFlightWindow(r.payload.departureAt))
        .filter((v): v is FlightTimeWindow => Boolean(v)),
    ),
  ),
  arrivalWindows: Array.from(
    new Set(
      results
        .map((r) => deriveFlightWindow(r.payload.arrivalAt))
        .filter((v): v is FlightTimeWindow => Boolean(v)),
    ),
  ),
  cabinClasses: Array.from(
    new Set(
      results
        .map((r) => deriveCabinClass(r))
        .filter((v): v is FlightCabinClass => Boolean(v)),
    ),
  ),
  maxStops: Array.from(new Set(results.map((r) => deriveStopCount(r)))).sort(
    (a, b) => a - b,
  ) as (0 | 1 | 2)[],
});

const compareByActiveSort = (
  activeSort: FlightSortKey,
  left: FlightSearchEntity,
  right: FlightSearchEntity,
) => {
  if (activeSort === "price-asc") return toPriceAmount(left) - toPriceAmount(right);
  if (activeSort === "duration") return deriveDurationMinutes(left) - deriveDurationMinutes(right);
  if (activeSort === "departure-asc") {
    const lt = parseIsoDateTime(left.payload.departureAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    const rt = parseIsoDateTime(right.payload.departureAt)?.getTime() || Number.MAX_SAFE_INTEGER;
    return lt - rt;
  }
  return 0;
};

/* ------------------------------------------------------------------ */
/* Filter rail (desktop sticky)                                       */
/* ------------------------------------------------------------------ */

type FilterGroup = {
  title: string;
  options: { label: string; href: string; active: boolean }[];
};

const FilterRail = component$(
  (props: {
    groups: FilterGroup[];
    clearAllHref: string | undefined;
    disabled?: boolean;
  }) => {
    const activeCount = props.groups.reduce(
      (n, g) => n + g.options.filter((o) => o.active).length,
      0,
    );

    return (
      <aside
        class="hidden lg:block"
        aria-label="Flight filters"
      >
        <div
          class="sticky p-4"
          style="top:calc(var(--sticky-top-offset,0) + 3.5rem);background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
              Filters
            </h2>
            {activeCount > 0 && props.clearAllHref ? (
              <a
                href={props.clearAllHref}
                aria-disabled={props.disabled || undefined}
                tabIndex={props.disabled ? -1 : undefined}
                class="text-[12px] font-semibold focus:outline-none focus-visible:underline"
                style="color:var(--ui-primary)"
              >
                Clear all
              </a>
            ) : null}
          </div>

          <div class="mt-3 flex flex-col gap-4">
            {props.groups.map((group) => (
              <div
                key={group.title}
                class="pt-3"
                style="border-top:1px solid var(--ui-divider)"
              >
                <h3
                  class="text-[12px] font-bold uppercase tracking-[0.08em]"
                  style="color:var(--ui-text-muted)"
                >
                  {group.title}
                </h3>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  {group.options.map((option) => (
                    <a
                      key={`${group.title}-${option.label}`}
                      href={option.href}
                      aria-current={option.active ? "page" : undefined}
                      aria-disabled={props.disabled || undefined}
                      tabIndex={props.disabled ? -1 : undefined}
                      class={[
                        "rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
                        props.disabled ? "pointer-events-none cursor-not-allowed opacity-60" : null,
                      ]}
                      style={
                        option.active
                          ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                          : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                      }
                    >
                      {option.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Mobile filter drawer (shown/hidden via signal)                     */
/* ------------------------------------------------------------------ */

const MobileFilterDrawer = component$(
  (props: {
    groups: FilterGroup[];
    clearAllHref: string | undefined;
    disabled?: boolean;
  }) => {
    const activeCount = props.groups.reduce(
      (n, g) => n + g.options.filter((o) => o.active).length,
      0,
    );

    return (
      <div
        class="mt-4 p-4 lg:hidden"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
            Filters
          </h2>
          {activeCount > 0 && props.clearAllHref ? (
            <a
              href={props.clearAllHref}
              aria-disabled={props.disabled || undefined}
              tabIndex={props.disabled ? -1 : undefined}
              class="text-[12px] font-semibold focus:outline-none focus-visible:underline"
              style="color:var(--ui-primary)"
            >
              Clear all
            </a>
          ) : null}
        </div>
        <div class="mt-3 flex flex-col gap-3">
          {props.groups.map((group) => (
            <div
              key={group.title}
              class="pt-3"
              style="border-top:1px solid var(--ui-divider)"
            >
              <h3
                class="text-[12px] font-bold uppercase tracking-[0.08em]"
                style="color:var(--ui-text-muted)"
              >
                {group.title}
              </h3>
              <div class="mt-2 flex flex-wrap gap-1.5">
                {group.options.map((option) => (
                  <a
                    key={`${group.title}-${option.label}`}
                    href={option.href}
                    aria-current={option.active ? "page" : undefined}
                    aria-disabled={props.disabled || undefined}
                    tabIndex={props.disabled ? -1 : undefined}
                    class={[
                      "rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
                      props.disabled ? "pointer-events-none cursor-not-allowed opacity-60" : null,
                    ]}
                    style={
                      option.active
                        ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                        : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                    }
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

const FlightCardSkeleton = component$(() => (
  <div
    class="animate-pulse overflow-hidden p-4 md:p-5"
    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
    aria-hidden="true"
  >
    <div class="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-center">
      <div class="flex items-center gap-3">
        <div class="size-10 shrink-0 rounded-full" style="background:var(--ui-surface-muted)" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 rounded" style="background:var(--ui-surface-muted);width:70%" />
          <div class="h-2.5 rounded" style="background:var(--ui-surface-muted);width:50%" />
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-8 w-12 rounded" style="background:var(--ui-surface-muted)" />
        <div class="flex-1 space-y-2">
          <div class="h-2 rounded" style="background:var(--ui-surface-muted)" />
          <div class="h-2 rounded" style="background:var(--ui-surface-muted);width:60%" />
        </div>
        <div class="h-8 w-12 rounded" style="background:var(--ui-surface-muted)" />
      </div>
      <div class="flex items-center gap-3 md:flex-col md:items-end">
        <div class="h-7 w-16 rounded" style="background:var(--ui-surface-muted)" />
        <div class="h-10 w-28 rounded-xl" style="background:var(--ui-surface-muted)" />
      </div>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */

const EmptyState = component$(
  (props: {
    title: string;
    description: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }) => (
    <div
      class="py-10 text-center"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
    >
      <p
        class="text-3xl"
        style="color:var(--ui-text-muted)"
        aria-hidden="true"
      >
        ✈
      </p>
      <h2
        class="mt-3 text-base font-bold"
        style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
      >
        {props.title}
      </h2>
      <p class="mx-auto mt-2 max-w-[40ch] text-sm" style="color:var(--ui-text-muted)">
        {props.description}
      </p>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
        <a
          href={props.primaryHref}
          class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-primary);color:var(--ui-on-primary)"
        >
          {props.primaryLabel}
        </a>
        {props.secondaryHref && props.secondaryLabel ? (
          <a
            href={props.secondaryHref}
            class="inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="border-color:var(--ui-border);color:var(--ui-text-secondary)"
          >
            {props.secondaryLabel}
          </a>
        ) : null}
      </div>
    </div>
  ),
);

/* ------------------------------------------------------------------ */
/* Main section                                                       */
/* ------------------------------------------------------------------ */

export const FlightResultsSection = component$(
  (props: FlightResultsSectionProps) => {
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
        !FLIGHT_FILTER_KEYS.includes(key as (typeof FLIGHT_FILTER_KEYS)[number]),
    );
    const pathname = url.pathname;
    const toHref = (nextState: typeof searchState) => toSearchHref(pathname, nextState);
    const facets = buildFlightFacets(props.page.results);

    const filteredResults = props.page.results.filter((result) => {
      if (selectedFilters.maxStops != null && deriveStopCount(result) > selectedFilters.maxStops)
        return false;
      if (
        selectedFilters.departureWindows.length &&
        !selectedFilters.departureWindows.includes(
          deriveFlightWindow(result.payload.departureAt) || "overnight",
        )
      )
        return false;
      if (
        selectedFilters.arrivalWindows.length &&
        !selectedFilters.arrivalWindows.includes(
          deriveFlightWindow(result.payload.arrivalAt) || "overnight",
        )
      )
        return false;
      if (selectedFilters.cabinClass && deriveCabinClass(result) !== selectedFilters.cabinClass)
        return false;
      if (
        selectedFilters.priceBand &&
        !inPriceBand(toPriceAmount(result), selectedFilters.priceBand)
      )
        return false;
      return true;
    });

    const sortedResults =
      activeSort === "recommended"
        ? filteredResults
        : filteredResults.slice().sort((l, r) => compareByActiveSort(activeSort, l, r));

    const filterGroups: FilterGroup[] = [
      {
        title: "Stops",
        options: facets.maxStops.map((value) => ({
          label: value === 0 ? "Nonstop" : value === 1 ? "Up to 1 stop" : "Up to 2 stops",
          href: toHref(
            withSearchStateSingleToggle(searchState, "maxStops", String(value), normalizeToken),
          ),
          active: selectedFilters.maxStops === value,
        })),
      },
      {
        title: "Departure window",
        options: facets.departureWindows.map((value) => ({
          label: FLIGHT_WINDOW_LABELS[value],
          href: toHref(
            withSearchStateArrayToggle(searchState, "departureWindow", value, normalizeToken),
          ),
          active: selectedFilters.departureWindows.includes(value),
        })),
      },
      {
        title: "Arrival window",
        options: facets.arrivalWindows.map((value) => ({
          label: FLIGHT_WINDOW_LABELS[value],
          href: toHref(
            withSearchStateArrayToggle(searchState, "arrivalWindow", value, normalizeToken),
          ),
          active: selectedFilters.arrivalWindows.includes(value),
        })),
      },
      {
        title: "Cabin class",
        options: facets.cabinClasses.map((value) => ({
          label: formatCabinLabel(value),
          href: toHref(
            withSearchStateSingleToggle(searchState, "cabin", value, normalizeToken),
          ),
          active: selectedFilters.cabinClass === value,
        })),
      },
      {
        title: "Price band",
        options: PRICE_BANDS.map((option) => ({
          label: option.label,
          href: toHref(
            withSearchStateSingleToggle(searchState, "priceBand", option.value, normalizeToken),
          ),
          active: selectedFilters.priceBand === option.value,
        })),
      },
    ].filter((group) => group.options.length > 0);

    const activeFilterChips = buildResultsFilterChips(
      filterGroups.map((g) => ({
        title: g.title,
        options: g.options.map((o) => ({ ...o, href: o.href })),
      })),
    );
    const clearAllHref = activeFilterChips.length
      ? toHref(clearSearchStateFilters(searchState, preservedFilterKeys))
      : undefined;
    const cards = sortedResults.map((result) => mapFlightResultCardForUi(result));
    const hasProviderResults = props.page.results.length > 0;
    const hasActiveFilters = activeFilterChips.length > 0;
    const emptyTitle = hasActiveFilters
      ? "No flights match these filters."
      : "No flights were found for this search.";
    const emptyDescription = hasActiveFilters
      ? "Clear one or more filters to widen the results."
      : "Try different dates, nearby airports, or a different route.";

    const mobileFiltersOpen = useSignal(false);
    const onToggleMobileFilters$ = $(() => {
      mobileFiltersOpen.value = !mobileFiltersOpen.value;
    });

    const sortLabel = FLIGHT_SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Sort";
    const sortHrefs = FLIGHT_SORT_OPTIONS.map((option) => ({
      ...option,
      href: toHref(withSearchStateSort(searchState, option.value)),
      active: activeSort === option.value,
    }));

    return (
      <section class="mx-auto max-w-6xl px-4 pt-6 pb-12">
        {/* Sort + filter toolbar */}
        <div
          class="sticky z-20 -mx-4 px-4"
          style="top:var(--sticky-top-offset,0);background:var(--ui-surface);border-top:1px solid var(--ui-border);border-bottom:1px solid var(--ui-border)"
        >
          <div class="flex items-center justify-between gap-3 py-2.5">
            <div class="flex items-center gap-2">
              <span
                class="text-sm font-bold"
                style="color:var(--ui-text)"
              >
                {cards.length.toLocaleString("en-US")} flights
              </span>
              {props.isNavigating ? (
                <span class="text-[12px]" style="color:var(--ui-text-muted)">
                  Updating…
                </span>
              ) : null}
            </div>

            <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {/* Mobile: Filters button */}
              {filterGroups.length > 0 ? (
                <button
                  type="button"
                  onClick$={onToggleMobileFilters$}
                  aria-expanded={mobileFiltersOpen.value}
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style={
                    mobileFiltersOpen.value
                      ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                      : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
                  }
                  aria-label={`${mobileFiltersOpen.value ? "Hide" : "Show"} filters${activeFilterChips.length ? ` (${activeFilterChips.length} active)` : ""}`}
                >
                  <span aria-hidden="true">⚑</span>
                  Filters
                  {activeFilterChips.length > 0 ? (
                    <span
                      class="rounded-full px-1.5 text-[10px] font-bold"
                      style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                    >
                      {activeFilterChips.length}
                    </span>
                  ) : null}
                </button>
              ) : null}

              <span
                class="hidden shrink-0 text-[12px] font-semibold lg:inline"
                style="color:var(--ui-text-muted)"
              >
                Sort
              </span>

              {sortHrefs.map((sort) => (
                <a
                  key={sort.value}
                  href={sort.href}
                  aria-current={sort.active ? "page" : undefined}
                  aria-disabled={props.isNavigating || undefined}
                  tabIndex={props.isNavigating ? -1 : undefined}
                  class={[
                    "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
                    props.isNavigating ? "pointer-events-none opacity-70" : null,
                  ]}
                  style={
                    sort.active
                      ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                      : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                  }
                >
                  {sort.label}
                </a>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 ? (
            <div class="flex flex-wrap items-center gap-2 pb-2.5">
              {activeFilterChips.map((chip) => (
                <a
                  key={`${chip.label}-${chip.href}`}
                  href={chip.href}
                  aria-disabled={props.isNavigating || undefined}
                  tabIndex={props.isNavigating ? -1 : undefined}
                  class={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
                    props.isNavigating ? "pointer-events-none opacity-60" : null,
                  ]}
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                  aria-label={`Remove filter: ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true" style="color:var(--ui-text-muted)">×</span>
                </a>
              ))}
              {clearAllHref ? (
                <a
                  href={clearAllHref}
                  aria-disabled={props.isNavigating || undefined}
                  tabIndex={props.isNavigating ? -1 : undefined}
                  class={[
                    "text-[12px] font-semibold focus:outline-none focus-visible:underline",
                    props.isNavigating ? "pointer-events-none opacity-60" : null,
                  ]}
                  style="color:var(--ui-primary)"
                >
                  Clear all
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen.value && filterGroups.length > 0 ? (
          <MobileFilterDrawer
            groups={filterGroups}
            clearAllHref={clearAllHref}
            disabled={props.isNavigating}
          />
        ) : null}

        {/* Price clarity strip */}
        <p
          class="mt-4 text-[12px]"
          style="color:var(--ui-text-muted)"
        >
          Every total includes taxes and carrier fees — what you see is what you pay.
          {props.page.progress?.status === "partial" ? null : (
            <span class="ml-1" style="color:var(--ui-text-secondary)">
              {sortLabel} order.
            </span>
          )}
        </p>

        {/* Progressive load banner */}
        {props.page.progress?.status === "partial" ? (
          <div
            class="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
          >
            <span
              class="size-2 shrink-0 animate-pulse rounded-full"
              style="background:var(--ui-primary)"
              aria-hidden="true"
            />
            <span>
              <span class="font-semibold" style="color:var(--ui-text)">
                More results arriving
              </span>
              {" — "}
              current options stay filterable while the search finishes.
            </span>
          </div>
        ) : null}

        {/* Two-column: filter rail + results */}
        <div class="mt-5 grid gap-6 lg:items-start lg:grid-cols-[260px_1fr]">
          {filterGroups.length > 0 ? (
            <FilterRail
              groups={filterGroups}
              clearAllHref={clearAllHref}
              disabled={props.isNavigating}
            />
          ) : null}

          <div>
            {/* Loading skeletons (navigating between filter states) */}
            {props.isNavigating ? (
              <div class="grid gap-4" aria-label="Loading flight results" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <FlightCardSkeleton key={i} />
                ))}
              </div>
            ) : cards.length > 0 ? (
              <div class="grid gap-4" aria-label="Flight search results">
                {cards.map((card) => (
                  <FlightResultCard key={card.id} card={card} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                primaryHref={
                  hasActiveFilters
                    ? (clearAllHref ?? props.editSearchHref)
                    : props.editSearchHref
                }
                primaryLabel={hasActiveFilters ? "Clear filters" : "Revise search"}
                secondaryHref={hasProviderResults ? props.editSearchHref : "/flights"}
                secondaryLabel={
                  hasProviderResults ? "Edit search" : "Start a new search"
                }
              />
            )}
          </div>
        </div>
      </section>
    );
  },
);

type FlightResultsSectionProps = {
  page: CanonicalFlightSearchPageSuccess;
  currentPath: string;
  isNavigating: boolean;
  editSearchHref: string;
};
