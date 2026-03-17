import { component$, useSignal } from "@builder.io/qwik";
import { BookingSearchSurface } from "~/components/booking-surface/SearchFormPrimitives";
import { CarRentalSearchCard } from "~/components/car-rentals/CarRentalSearchCard";
import { FlightsSearchCard } from "~/components/flights/search/FlightsSearchCard";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";

const SEARCH_VERTICAL_OPTIONS = [
  {
    value: "flights",
    label: "Flights",
    summary: "Route-first planning with canonical departure and return dates.",
  },
  {
    value: "hotels",
    label: "Hotels",
    summary:
      "Stay-first search with destination, check-in, check-out, and guests.",
  },
  {
    value: "cars",
    label: "Cars",
    summary: "Pickup-first search using normalized locations and rental dates.",
  },
] as const;

export type GlobalSearchEntryVertical =
  (typeof SEARCH_VERTICAL_OPTIONS)[number]["value"];

export const GlobalSearchEntry = component$((props: GlobalSearchEntryProps) => {
  const activeVertical = useSignal<GlobalSearchEntryVertical>(
    props.initialVertical ?? "flights",
  );
  const activeOption =
    SEARCH_VERTICAL_OPTIONS.find(
      (option) => option.value === activeVertical.value,
    ) || SEARCH_VERTICAL_OPTIONS[0];
  const title = props.title || "Start the trip from one shared search surface";
  const description =
    props.description ||
    "Switch between flights, hotels, and cars without leaving the top-level flow.";

  return (
    <div id={props.id} class={["relative z-20", props.class]}>
      <BookingSearchSurface class="border-white/40 bg-white/96 p-4 shadow-[var(--shadow-xl)] backdrop-blur md:p-5">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              {props.eyebrow ? (
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                  {props.eyebrow}
                </p>
              ) : null}
              <h2 class="mt-1 text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                {title}
              </h2>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)] md:text-base">
                {description}
              </p>
            </div>

            <div
              role="tablist"
              aria-label={props.tabListLabel || "Search vertical"}
              class="relative z-10 inline-flex w-full flex-wrap gap-2 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-1 lg:w-auto lg:flex-nowrap"
            >
              {SEARCH_VERTICAL_OPTIONS.map((option) => {
                const isActive = option.value === activeVertical.value;

                return (
                  <button
                    key={option.value}
                    id={`global-search-tab-${option.value}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive ? "true" : "false"}
                    aria-controls={`global-search-panel-${option.value}`}
                    class={[
                      "flex-1 rounded-[var(--radius-lg)] px-4 py-2 text-sm font-semibold transition md:flex-none",
                      isActive
                        ? "bg-[color:var(--color-action)] text-white shadow-[var(--shadow-sm)]"
                        : "text-[color:var(--color-text-muted)] hover:bg-white hover:text-[color:var(--color-text-strong)]",
                    ]}
                    onClick$={() => {
                      activeVertical.value = option.value;
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id={`global-search-panel-${activeOption.value}`}
            role="tabpanel"
            aria-labelledby={`global-search-tab-${activeOption.value}`}
            class="relative z-20 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] p-3 md:p-4"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {activeOption.label} search
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {activeOption.summary}
            </p>

            <div class="mt-4">
              {activeVertical.value === "flights" ? (
                <FlightsSearchCard
                  surface="plain"
                  submitBehavior="canonical-route"
                  autoResolveOriginLocation={true}
                />
              ) : activeVertical.value === "hotels" ? (
                <HotelSearchCard
                  surface="plain"
                  submitBehavior="canonical-route"
                />
              ) : (
                <CarRentalSearchCard
                  variant="hero"
                  surface="plain"
                  submitBehavior="canonical-route"
                />
              )}
            </div>
          </div>
        </div>
      </BookingSearchSurface>
    </div>
  );
});

type GlobalSearchEntryProps = {
  id?: string;
  class?: string;
  initialVertical?: GlobalSearchEntryVertical;
  eyebrow?: string;
  title?: string;
  description?: string;
  tabListLabel?: string;
};
