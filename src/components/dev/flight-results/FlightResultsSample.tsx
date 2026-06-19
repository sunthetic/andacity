/**
 * CLAUDE-UI-015 — Flight route results page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-flight-results). A premium,
 * comparison-first flight results concept built on the `--ui-*` foundation +
 * CLAUDE-UI-002 primitives. Renders inside the production global shell
 * (SiteHeader/SiteFooter via the root layout); this component is only the page
 * body.
 *
 * Data is ILLUSTRATIVE (flightResultsSampleData.ts) but shaped to mirror the
 * production FlightResultCardModel / FlightSearchSummaryModel so CLAUDE-UI-016
 * can swap in real `mapFlightResultsForUi` output without structural change.
 *
 * Honesty markers:
 *  - Sort options + the Stops/Departure/Arrival/Cabin/Price-band filters mirror
 *    REAL production behavior (CanonicalFlightResultsSection). Airline and
 *    "Bags included" filters, the flexible-date strip, and the fare-tier
 *    comparison are labeled CONCEPT — not in production today.
 *  - Carrier names and prices are illustrative; no live fares, availability,
 *    urgency, demand, partnership, or guarantee claims appear anywhere.
 *
 * It does NOT replace src/routes/flights/search/[...route]/index.tsx.
 * See docs/ui-redesign/samples/FLIGHT_RESULTS_SAMPLE.md for the approval gate.
 */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";
import {
  SAMPLE_SUMMARY,
  SAMPLE_FLEX_DAYS,
  SAMPLE_SORTS,
  SAMPLE_FILTER_GROUPS,
  SAMPLE_RESULT_CARDS,
  SAMPLE_FARE_TIERS,
  SAMPLE_TRIP_HANDOFF,
  type SampleResultCard,
} from "~/components/dev/flight-results/flightResultsSampleData";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";
const s = SAMPLE_SUMMARY;

const IllustrativeBadge = component$((props: { label?: string }) => (
  <span
    class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
    style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
  >
    {props.label ?? "Illustrative"}
  </span>
));

/* ------------------------------------------------------------------ */
/* Route header                                                       */
/* ------------------------------------------------------------------ */

const RouteHeader = component$(() => (
  <section
    id="route-header"
    class="relative isolate overflow-hidden scroll-mt-24"
    style="background-image:var(--ui-hero)"
    aria-label={`Flight results for ${s.originCity} to ${s.destinationCity}`}
  >
    <div class="absolute inset-0 -z-10" style="background-image:var(--ui-hero-scrim)" aria-hidden="true" />

    <div class="mx-auto max-w-6xl px-4 pt-8 pb-7 md:pt-10 md:pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" class="mb-4">
        <ol class="flex flex-wrap items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.72)">
          <li class="flex items-center gap-2">
            <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Home</a>
            <span aria-hidden="true">/</span>
          </li>
          <li class="flex items-center gap-2">
            <a href="/flights" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Flights</a>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">{s.originCode} → {s.destinationCode}</li>
        </ol>
      </nav>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.26)"
            >
              {s.tripTypeLabel}
            </span>
            <span class="text-[12px]" style="color:rgba(255,255,255,0.82)">
              {s.departDateLabel} – {s.returnDateLabel} · {s.travelersLabel}
            </span>
          </div>

          <h1
            class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-balance text-3xl font-bold leading-[1.05] md:text-4xl"
            style={`color:#fff;font-family:${HEADING_FONT}`}
          >
            <span>{s.originCity}</span>
            <span aria-hidden="true" style="color:rgba(255,255,255,0.6)">→</span>
            <span>{s.destinationCity}</span>
          </h1>

          <p class="mt-2 text-sm" style="color:rgba(255,255,255,0.88)">
            {s.resultCount} options · taxes and carrier fees included in every total.
          </p>
        </div>

        {/* Edit search — real prefill target */}
        <div class="flex items-center gap-2">
          <a
            href={s.editSearchHref}
            class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.3)"
          >
            Edit search
          </a>
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Flexible-date strip (concept-only)                                 */
/* ------------------------------------------------------------------ */

const FlexDateStrip = component$(() => (
  <section class="mx-auto max-w-6xl px-4 pt-6">
    <div
      class="p-4"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-bold" style="color:var(--ui-text)">
          Nearby departure dates
        </h2>
        <div class="flex items-center gap-2">
          <IllustrativeBadge />
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
          >
            Concept
          </span>
        </div>
      </div>

      <div
        class="mt-3 grid items-end gap-1.5"
        style="grid-template-columns:repeat(7,minmax(0,1fr))"
        role="img"
        aria-label="Illustrative relative-fare bars across nearby departure dates — lower bars suggest cheaper days. Not live prices."
      >
        {SAMPLE_FLEX_DAYS.map((d) => (
          <div
            key={d.date}
            class="flex flex-col items-center gap-1.5 rounded-lg px-1 py-2"
            style={
              d.selected
                ? "background:var(--ui-accent-soft);border:1px solid var(--ui-accent)"
                : "border:1px solid transparent"
            }
          >
            <div class="flex h-20 w-full items-end justify-center" aria-hidden="true">
              <div
                class="w-2/3 rounded-t-md"
                style={`height:${Math.round(d.relative * 100)}%;${
                  d.selected
                    ? "background:var(--ui-primary)"
                    : "background:color-mix(in srgb, var(--ui-primary) 26%, transparent)"
                }`}
              />
            </div>
            <div class="text-center">
              <div class="text-[11px] font-bold" style="color:var(--ui-text)">{d.dow}</div>
              <div class="text-[10px]" style="color:var(--ui-text-muted)">{d.date}</div>
            </div>
          </div>
        ))}
      </div>
      <p class="mt-2 text-[11px]" style="color:var(--ui-text-muted)">
        Relative shape only — no amounts shown. Real date-flexible pricing would load from a live search.
      </p>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Sticky toolbar — sort + result count + mobile filters affordance   */
/* ------------------------------------------------------------------ */

const ResultsToolbar = component$(() => (
  <div
    class="sticky top-[var(--sticky-top-offset,0)] z-30 mt-6"
    style="background:var(--ui-surface);border-top:1px solid var(--ui-border);border-bottom:1px solid var(--ui-border)"
  >
    <div class="mx-auto max-w-6xl px-4">
      <div class="flex items-center justify-between gap-3 py-2.5">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold" style="color:var(--ui-text)">
            {s.resultCount} flights
          </span>
          <span class="hidden text-[12px] sm:inline" style="color:var(--ui-text-muted)">
            {s.originCode} → {s.destinationCode}
          </span>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Mobile filters affordance (sheet concept) */}
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
            aria-label="Open filters (concept)"
          >
            <span aria-hidden="true">⚑</span> Filters
          </button>

          <span class="hidden shrink-0 text-[12px] font-semibold sm:inline" style="color:var(--ui-text-muted)">
            Sort
          </span>
          {SAMPLE_SORTS.map((sort) => (
            <button
              key={sort.value}
              type="button"
              aria-pressed={sort.active ?? false}
              class="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style={
                sort.active
                  ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                  : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
              }
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Filter rail                                                        */
/* ------------------------------------------------------------------ */

const FilterRail = component$(() => (
  <aside class="hidden lg:block" aria-label="Flight filters">
    <div
      class="sticky top-[calc(var(--sticky-top-offset,0)+3.5rem)] p-4"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
          Filters
        </h2>
        <button
          type="button"
          class="text-[12px] font-semibold focus:outline-none focus-visible:underline"
          style="color:var(--ui-primary)"
        >
          Clear all
        </button>
      </div>
      <p class="mt-1 text-[11px]" style="color:var(--ui-text-muted)">
        Illustrative in this preview.
      </p>

      <div class="mt-3 flex flex-col gap-4">
        {SAMPLE_FILTER_GROUPS.map((group) => (
          <div key={group.title} style="border-top:1px solid var(--ui-divider)" class="pt-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-[13px] font-bold" style="color:var(--ui-text)">
                {group.title}
              </h3>
              {group.supported ? null : (
                <span
                  class="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
                  style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                >
                  Concept
                </span>
              )}
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5">
              {group.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={opt.active ?? false}
                  class="rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style={
                    opt.active
                      ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                      : "background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p class="mt-4 text-[11px]" style="color:var(--ui-text-muted)">
        Stops, departure/arrival window, cabin, and price band are already
        supported in production. Airline and bag filters are concept-only.
      </p>
    </div>
  </aside>
));

/* ------------------------------------------------------------------ */
/* Result card                                                        */
/* ------------------------------------------------------------------ */

const ResultCard = component$((props: { card: SampleResultCard }) => {
  const c = props.card;
  return (
    <article
      class="overflow-hidden p-4 transition hover:-translate-y-px md:p-5"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div class="grid gap-4 lg:grid-cols-[1.05fr_1.4fr_auto] lg:items-center">
        {/* Identity */}
        <div class="flex items-start gap-3">
          <span
            class="grid size-10 shrink-0 place-items-center rounded-full text-[14px]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            ✈
          </span>
          <div class="min-w-0">
            <div class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
              {c.airlineLabel}
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]" style="color:var(--ui-text-muted)">
              <span
                class="rounded px-1.5 py-0.5 font-semibold"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
              >
                {c.flightNumberLabel}
              </span>
              <span>{c.cabinLabel}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div class="flex items-center gap-3">
          <div class="text-center">
            <div class="text-base font-bold" style="color:var(--ui-text)">{c.departTime}</div>
            <div class="text-[11px]" style="color:var(--ui-text-muted)">{c.departCode}</div>
          </div>
          <div class="relative flex-1" aria-hidden="true">
            <div class="text-center text-[10px] font-semibold" style="color:var(--ui-text-muted)">
              {c.durationLabel}
            </div>
            <div class="relative mt-1">
              <div class="h-px w-full" style="background:var(--ui-border)" />
              <span class="absolute -top-1 left-0 size-2 rounded-full" style="background:var(--ui-primary)" />
              <span class="absolute -top-1 right-0 size-2 rounded-full" style="background:var(--ui-accent)" />
              {c.stopCount > 0 ? (
                <span class="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full" style="background:var(--ui-text-muted)" />
              ) : null}
            </div>
            <div
              class="mt-1 text-center text-[10px] font-semibold"
              style={c.stopCount > 0 ? "color:var(--ui-accent)" : "color:var(--ui-primary)"}
            >
              {c.stopSummary}
            </div>
          </div>
          <div class="text-center">
            <div class="text-base font-bold" style="color:var(--ui-text)">{c.arriveTime}</div>
            <div class="text-[11px]" style="color:var(--ui-text-muted)">{c.arriveCode}</div>
          </div>
        </div>

        {/* Price + CTA */}
        <div class="flex items-end justify-between gap-3 lg:flex-col lg:items-end">
          <div class="lg:text-right">
            <div class="text-[10px] font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
              Total · {s.tripTypeLabel.toLowerCase()}
            </div>
            <div class="text-2xl font-extrabold leading-none" style="color:var(--ui-price)">
              {c.priceDisplay}
            </div>
            <div class="text-[10px]" style="color:var(--ui-text-muted)">incl. taxes &amp; fees</div>
          </div>
          <a
            href="#route-header"
            aria-label={`View ${c.airlineLabel} flight (sample — links to flight details in production)`}
            class="inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
          >
            View flight
          </a>
        </div>
      </div>

      {/* Footer */}
      <div class="mt-3 flex flex-wrap items-center gap-2" style="border-top:1px solid var(--ui-divider)">
        <span class="pt-3 text-[12px]" style="color:var(--ui-text-muted)">
          {c.returnNote}
        </span>
        {c.tag ? (
          <span
            class="mt-3 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
          >
            {c.tag}
          </span>
        ) : null}
      </div>
    </article>
  );
});

/* ------------------------------------------------------------------ */
/* Fare/cabin comparison concept                                      */
/* ------------------------------------------------------------------ */

const FareCompareConcept = component$(() => (
  <div
    class="p-4 md:p-5"
    style="background:var(--ui-surface);border:1px dashed var(--ui-border);border-radius:var(--ui-radius)"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
        Compare fare options on a flight
      </h3>
      <div class="flex items-center gap-2">
        <IllustrativeBadge />
        <span
          class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
          style="background:var(--ui-accent-soft);color:var(--ui-accent)"
        >
          Concept
        </span>
      </div>
    </div>
    <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
      Structure only — relative gaps between fare tiers, not real prices. Production results carry one cabin per option today.
    </p>

    <div class="mt-3 grid gap-3 sm:grid-cols-3">
      {SAMPLE_FARE_TIERS.map((tier) => (
        <div
          key={tier.tier}
          class="p-3"
          style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius-sm)"
        >
          <div class="text-sm font-bold" style="color:var(--ui-text)">{tier.tier}</div>
          <div
            class="mt-2 h-2 w-full overflow-hidden rounded-full"
            style="background:var(--ui-surface)"
            aria-hidden="true"
          >
            <div class="h-full rounded-full" style={`width:${Math.round(tier.relative * 100)}%;background:var(--ui-primary)`} />
          </div>
          <div class="mt-2 text-[12px]" style="color:var(--ui-text-muted)">{tier.includes}</div>
        </div>
      ))}
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Results column (cards + price clarity + partial banner concept)    */
/* ------------------------------------------------------------------ */

const ResultsColumn = component$(() => (
  <div class="flex flex-col gap-4">
    {/* Price clarity strip */}
    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[12px]"
      style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);color:var(--ui-text-secondary)"
    >
      <span class="font-semibold" style="color:var(--ui-text)">Every total is all-in.</span>
      <span>Taxes and carrier fees are included before you choose · prices below are illustrative.</span>
    </div>

    {/* Partial-loading banner concept (mirrors production progressive load) */}
    <div
      class="flex items-start gap-3 px-4 py-3"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
    >
      <span
        class="mt-0.5 inline-block size-3 shrink-0 animate-pulse rounded-full"
        style="background:var(--ui-primary)"
        aria-hidden="true"
      />
      <div>
        <div class="text-[13px] font-semibold" style="color:var(--ui-text)">More results still arriving</div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          Current options stay filterable while the search finishes (production loads progressively).
        </div>
      </div>
    </div>

    {SAMPLE_RESULT_CARDS.slice(0, 2).map((card) => (
      <ResultCard key={card.id} card={card} />
    ))}

    <FareCompareConcept />

    {SAMPLE_RESULT_CARDS.slice(2).map((card) => (
      <ResultCard key={card.id} card={card} />
    ))}
  </div>
));

/* ------------------------------------------------------------------ */
/* Empty + loading state concepts                                     */
/* ------------------------------------------------------------------ */

const StateConcepts = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <div class="flex items-center gap-2">
      <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
        States
      </h2>
      <IllustrativeBadge label="Concept demos" />
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      {/* Loading skeleton */}
      <div>
        <div class="mb-2 text-[12px] font-semibold" style="color:var(--ui-text-muted)">Loading</div>
        <div class="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              class="p-4"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
              aria-hidden="true"
            >
              <div class="grid gap-4 sm:grid-cols-[1fr_1.3fr_auto] sm:items-center">
                <div class="flex items-center gap-3">
                  <div class="size-10 animate-pulse rounded-full" style="background:var(--ui-surface-muted)" />
                  <div class="flex-1">
                    <div class="h-3 w-24 animate-pulse rounded" style="background:var(--ui-surface-muted)" />
                    <div class="mt-2 h-2.5 w-16 animate-pulse rounded" style="background:var(--ui-surface-muted)" />
                  </div>
                </div>
                <div class="h-2.5 w-full animate-pulse rounded" style="background:var(--ui-surface-muted)" />
                <div class="h-8 w-20 animate-pulse rounded-xl" style="background:var(--ui-surface-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      <div>
        <div class="mb-2 text-[12px] font-semibold" style="color:var(--ui-text-muted)">No matches</div>
        <div
          class="flex flex-col items-start gap-3 p-6"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
        >
          <span
            class="grid size-10 place-items-center rounded-full text-[16px]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            ⌕
          </span>
          <div>
            <div class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
              No flights match these filters
            </div>
            <p class="mt-1 text-[13px]" style="color:var(--ui-text-muted)">
              Clear one or more filters to widen the results, or adjust your dates.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" label="Clear filters" href="#route-header" ariaLabel="Clear filters" />
            <Button variant="secondary" size="sm" label="Edit search" href={s.editSearchHref} ariaLabel="Edit search" />
          </div>
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Whole-trip handoff                                                 */
/* ------------------------------------------------------------------ */

const WholeTripHandoff = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
      Picked a flight? Build the rest of {s.destinationCity}.
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Keep the whole trip in one place — add a stay, a car, and a plan.
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {SAMPLE_TRIP_HANDOFF.map((item) => (
        <div
          key={item.title}
          class="flex flex-col p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div
            class="mb-3 h-20 w-full overflow-hidden"
            style="background-image:var(--ui-hero);border-radius:var(--ui-radius-sm)"
            role="img"
            aria-hidden="true"
          />
          <h3 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
            {item.title}
          </h3>
          <p class="mt-1.5 flex-1 text-[13px]" style="color:var(--ui-text-muted)">
            {item.body}
          </p>
          <div class="mt-3">
            <Button variant="secondary" size="sm" label={item.cta} href={item.href} ariaLabel={item.cta} />
          </div>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Mobile sticky CTA                                                  */
/* ------------------------------------------------------------------ */

const MobileStickyCta = component$(() => (
  <div
    class="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:0 -8px 24px rgba(8,12,22,0.12)"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
      <div class="min-w-0">
        <div class="text-sm font-semibold" style="color:var(--ui-text)">
          {s.originCode} → {s.destinationCode}
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          {s.resultCount} options · all-in totals
        </div>
      </div>
      <a
        href={s.editSearchHref}
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        Edit search
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Page composition                                                   */
/* ------------------------------------------------------------------ */

export const FlightResultsSample = component$(() => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <RouteHeader />
    <FlexDateStrip />
    <ResultsToolbar />

    <section class="mx-auto max-w-6xl px-4 py-6">
      <div class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <FilterRail />
        <ResultsColumn />
      </div>
    </section>

    <StateConcepts />
    <WholeTripHandoff />

    {/* Spacer for mobile sticky CTA */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
