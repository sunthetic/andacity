/**
 * CLAUDE-UI-005 — Home page sample: one obvious search module.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-home). A single, calm, elevated
 * search surface that anticipates all four verticals (flights, hotels, cars,
 * destinations) with one set of fields per vertical. Built entirely on the
 * `--ui-*` foundation so it re-skins across every palette + light/dark.
 *
 * Boundary: fields are presentational placeholders. In production
 * (CLAUDE-UI-006) each vertical projects the existing canonical search card
 * (FlightsSearchCard / HotelSearchCard / CarRentalSearchCard) and submits via
 * the canonical-route flow — exactly like the current GlobalSearchEntry. The
 * `id="global-search-entry"` keeps the header's `/#global-search-entry`
 * affordance landing on this module.
 */
import { component$, useSignal } from "@builder.io/qwik";
import {
  HOME_SEARCH_SUGGESTIONS,
  HOME_SEARCH_VERTICALS,
  type HomeSearchVerticalId,
} from "~/components/dev/home/homeSampleData";

const SearchGlyph = component$(() => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
    <path
      d="m20 20-3-3"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
));

export const HomeSearchModule = component$(
  (props: { id?: string; class?: string }) => {
    const active = useSignal<HomeSearchVerticalId>("flights");
    const vertical =
      HOME_SEARCH_VERTICALS.find((v) => v.id === active.value) ??
      HOME_SEARCH_VERTICALS[0];

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
            {HOME_SEARCH_VERTICALS.map((v) => {
              const isActive = v.id === active.value;
              return (
                <button
                  key={v.id}
                  id={`home-search-tab-${v.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive ? "true" : "false"}
                  aria-controls={`home-search-panel-${v.id}`}
                  onClick$={() => (active.value = v.id)}
                  class="flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style={
                    isActive
                      ? "background:var(--ui-surface);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
                      : "background:transparent;color:var(--ui-text-muted)"
                  }
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Active panel */}
          <div
            id={`home-search-panel-${vertical.id}`}
            role="tabpanel"
            aria-labelledby={`home-search-tab-${vertical.id}`}
            class="mt-3"
          >
            <p class="px-1 text-[12px]" style="color:var(--ui-text-muted)">
              {vertical.summary}
            </p>

            <div class="mt-2 flex flex-col gap-2 md:flex-row md:items-stretch">
              <div class="grid flex-1 gap-2 sm:grid-cols-2 md:flex md:flex-row">
                {vertical.fields.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-label={`${f.label}: ${f.value}. Edit`}
                    class="min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
                  >
                    <span
                      class="block text-[10px] font-bold uppercase tracking-[0.1em]"
                      style="color:var(--ui-text-muted)"
                    >
                      {f.label}
                    </span>
                    <span
                      class="mt-0.5 block truncate text-sm font-semibold"
                      style="color:var(--ui-text)"
                    >
                      {f.value}
                    </span>
                    {f.hint ? (
                      <span
                        class="block text-[11px]"
                        style="color:var(--ui-text-muted)"
                      >
                        {f.hint}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <a
                href={vertical.href}
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:-translate-y-px hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)] md:py-0"
                style="background:var(--ui-primary);color:var(--ui-on-primary)"
              >
                <SearchGlyph />
                {vertical.actionLabel}
              </a>
            </div>

            {/* Quick suggestions */}
            <div class="mt-3 flex flex-wrap items-center gap-2 px-1">
              <span
                class="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style="color:var(--ui-text-muted)"
              >
                Popular
              </span>
              {HOME_SEARCH_SUGGESTIONS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  class="rounded-full px-3 py-1 text-[12px] font-medium transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
