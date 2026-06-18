/**
 * CLAUDE-UI-006 — Home page implementation: production search module.
 *
 * Promoted from the CLAUDE-UI-005 sample's HomeSearchModule, with the
 * placeholder fields replaced by the real canonical search flow: Flights,
 * Hotels, and Cars each project the existing FlightsSearchCard /
 * HotelSearchCard / CarRentalSearchCard with `surface="plain"` and
 * `submitBehavior="canonical-route"` — the exact contract the legacy
 * GlobalSearchEntry used, so submission behavior is proven and unchanged.
 * Destinations is a real discovery intent: selecting a vibe routes into the
 * existing /explore?theme=<key> filter (see src/routes/explore/index.tsx).
 *
 * Visual chrome (tab strip, panel) is built on `--ui-*`; the embedded search
 * cards still render with the legacy `--color-*` token system, exactly as
 * they do today on /flights, /hotels, and /car-rentals — those forms are
 * shared across multiple live booking flows and are out of scope for a
 * home-page-only task. See HOME_PAGE_IMPLEMENTATION.md "Deferred work".
 *
 * `id="global-search-entry"` is preserved so the header's existing
 * `/#global-search-entry` search affordance (desktop pill, mobile row,
 * mobile sheet "Start a search") keeps landing on this module unchanged.
 */
import { component$, useSignal } from "@builder.io/qwik";
import { CarRentalSearchCard } from "~/components/car-rentals/CarRentalSearchCard";
import { FlightsSearchCard } from "~/components/flights/search/FlightsSearchCard";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";
import { HOME_DESTINATION_VIBES } from "~/components/home/homeContent";

type HomeSearchVerticalId = "flights" | "hotels" | "cars" | "destinations";

const TABS: { id: HomeSearchVerticalId; label: string; summary: string }[] = [
  {
    id: "flights",
    label: "Flights",
    summary: "Route-first planning with canonical departure and return dates.",
  },
  {
    id: "hotels",
    label: "Hotels",
    summary:
      "Stay-first search with destination, check-in, check-out, and guests.",
  },
  {
    id: "cars",
    label: "Cars",
    summary: "Pickup-first search using normalized locations and rental dates.",
  },
  {
    id: "destinations",
    label: "Destinations",
    summary:
      "Not sure yet? Start from a mood, then branch into flights, stays, and cars.",
  },
];

const DestinationsPanel = component$(() => {
  const selected = useSignal(HOME_DESTINATION_VIBES[0].key);

  return (
    <div class="flex flex-col gap-3 md:flex-row md:items-stretch">
      <div class="min-w-0 flex-1">
        <div
          role="radiogroup"
          aria-label="Trip mood"
          class="flex flex-wrap gap-2"
        >
          {HOME_DESTINATION_VIBES.map((vibe) => {
            const isActive = vibe.key === selected.value;
            return (
              <button
                key={vibe.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick$={() => (selected.value = vibe.key)}
                class="rounded-full px-4 py-2 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style={
                  isActive
                    ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                    : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                }
              >
                {vibe.label}
              </button>
            );
          })}
        </div>
        <a
          href="/destinations"
          class="mt-2 inline-block text-[12px] font-medium underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="color:var(--ui-text-muted)"
        >
          Or browse all destinations
        </a>
      </div>

      <a
        href={`/explore?theme=${selected.value}`}
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:-translate-y-px hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)] md:self-start"
        style="background:var(--ui-primary);color:var(--ui-on-primary)"
      >
        Explore destinations
      </a>
    </div>
  );
});

export const HomeSearchModule = component$(
  (props: { id?: string; class?: string }) => {
    const active = useSignal<HomeSearchVerticalId>("flights");
    const tab = TABS.find((t) => t.id === active.value) ?? TABS[0];

    return (
      <div
        id={props.id}
        class={["relative w-full text-left", props.class]}
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
      >
        <div class="p-3 md:p-4">
          {/* Vertical tabs */}
          <div
            role="tablist"
            aria-label="Search type"
            class="flex w-full gap-1 overflow-x-auto rounded-full p-1"
            style="background:var(--ui-surface-muted)"
          >
            {TABS.map((t) => {
              const isActive = t.id === active.value;
              return (
                <button
                  key={t.id}
                  id={`home-search-tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive ? "true" : "false"}
                  aria-controls={`home-search-panel-${t.id}`}
                  onClick$={() => (active.value = t.id)}
                  class="flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style={
                    isActive
                      ? "background:var(--ui-surface);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
                      : "background:transparent;color:var(--ui-text-muted)"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Active panel */}
          <div
            id={`home-search-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`home-search-tab-${tab.id}`}
            class="mt-3"
          >
            <p class="px-1 text-[12px]" style="color:var(--ui-text-muted)">
              {tab.summary}
            </p>

            <div class="mt-2">
              {tab.id === "flights" ? (
                <FlightsSearchCard
                  surface="plain"
                  submitBehavior="canonical-route"
                  autoResolveOriginLocation={true}
                />
              ) : tab.id === "hotels" ? (
                <HotelSearchCard
                  surface="plain"
                  submitBehavior="canonical-route"
                />
              ) : tab.id === "cars" ? (
                <CarRentalSearchCard
                  variant="hero"
                  surface="plain"
                  submitBehavior="canonical-route"
                />
              ) : (
                <DestinationsPanel />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
