/**
 * CLAUDE-UI-007 — Hotels landing page sample: search module.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-hotels). A calm, premium,
 * hotel-native search surface (destination · check-in · check-out · guests &
 * rooms) built entirely on the `--ui-*` foundation so it re-skins across every
 * palette + light/dark.
 *
 * Boundary: fields are presentational placeholders and the primary action is a
 * real link to /hotels (no broken submission). In production (CLAUDE-UI-008)
 * this surface mounts the existing HotelSearchCard with `surface="plain"` and
 * `submitBehavior="canonical-route"` — the exact proven contract used by the
 * CLAUDE-UI-006 home page — preserving the canonical hotel search flow and the
 * destination autosuggest / DateField behavior.
 */
import { component$ } from "@builder.io/qwik";
import {
  HOTELS_SEARCH_FIELDS,
  HOTELS_SEARCH_SUGGESTIONS,
} from "~/components/dev/hotels/hotelsSampleData";

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

export const HotelsSearchModule = component$(
  (props: { id?: string; class?: string }) => (
    <div
      id={props.id}
      class={["relative w-full text-left", props.class]}
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
    >
      <div class="p-3 md:p-4">
        {/* Field row: destination grows, dates + guests are compact */}
        <div class="flex flex-col gap-2 md:flex-row md:items-stretch">
          <div class="grid flex-1 gap-2 sm:grid-cols-2 md:flex md:flex-row">
            {HOTELS_SEARCH_FIELDS.map((f, i) => (
              <button
                key={f.label}
                type="button"
                aria-label={`${f.label}: ${f.value}. Edit`}
                class={[
                  "min-w-0 rounded-xl px-3.5 py-2.5 text-left transition hover:brightness-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
                  // Destination is the widest field; others share remaining width.
                  i === 0 ? "sm:col-span-2 md:flex-[1.6]" : "md:flex-1",
                ]}
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
              >
                <span
                  class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style="color:var(--ui-text-muted)"
                >
                  {f.icon ? <span aria-hidden="true">{f.icon}</span> : null}
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
            href="/hotels"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:-translate-y-px hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)] md:py-0"
            style="background:var(--ui-primary);color:var(--ui-on-primary)"
          >
            <SearchGlyph />
            Search hotels
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
          {HOTELS_SEARCH_SUGGESTIONS.map((s) => (
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
  ),
);
