/**
 * CLAUDE-UI-025 — Global search results page sample component.
 *
 * A premium, multi-vertical global search results (SRP) concept built on the
 * --ui-* token system. Not production — preview only at /dev/ui-search.
 *
 * Design thesis:
 *   "Here are the most useful matches for your travel intent, organized by what
 *    you can do next."
 *
 * Direction:
 * - Calm --ui-hero search-intent header with the parsed query summary
 * - Sticky vertical switcher (All / Hotels / Flights / Cars / Destinations),
 *   real ?vertical= navigation that works in the preview
 * - "All" view: a mixed, action-grouped overview (Stay / Fly / Drive / Explore)
 * - Per-vertical view: that vertical's result cards + a concept refinement rail
 * - Result cards mirror the production UI-model field shapes (src/types/search-ui)
 * - Empty / loading / pagination shown as clearly-labeled concept blocks
 * - Whole-trip handoff into the real booking verticals
 *
 * Data honesty:
 * - Hotels / flights / cars cards are ILLUSTRATIVE (generic sample names, every
 *   price tagged "Illustrative"). No live availability, fares, suppliers,
 *   scarcity, relevance scores, or "best match" claims.
 * - The Destinations vertical uses the REAL production dataset with real links.
 * - All result CTAs point at real Andacity search entry points or real
 *   destination guides — they start a genuine search, never a fake booking.
 * See docs/ui-redesign/samples/GLOBAL_SEARCH_SAMPLE.md for the approval gate.
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import {
  SAMPLE_QUERY,
  VERTICALS,
  VERTICAL_COUNTS,
  TOTAL_COUNT,
  SAMPLE_HOTELS,
  SAMPLE_FLIGHTS,
  SAMPLE_CARS,
  SAMPLE_DESTINATIONS,
  SAMPLE_SORTS,
  SAMPLE_FILTER_GROUPS,
  SAMPLE_PAGINATION,
  SAMPLE_TRIP_HANDOFF,
  normalizeVertical,
  destinationGuideHref,
  destinationHotelsHref,
  destinationCarsHref,
  type SearchVerticalKey,
  type SampleHotelCard,
  type SampleFlightCard,
  type SampleCarCard,
} from './searchSampleData'

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

const verticalHref = (key: SearchVerticalKey) =>
  key === 'all' ? '/dev/ui-search' : `/dev/ui-search?vertical=${key}`

// ─── small, reused presentational pieces ──────────────────────────────────────

const IllustrativeTag = () => (
  <span
    class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
    style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
  >
    Illustrative
  </span>
)

const cardClass =
  'flex flex-col overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus-within:ring-2'
const cardStyle =
  'background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)'

const ctaClass =
  'mt-4 inline-flex w-fit rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2'
const ctaStyle = 'background:var(--ui-primary);color:var(--ui-on-primary)'

const typeChip = (label: string) => (
  <span
    class="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
    style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
  >
    {label}
  </span>
)

// ─── per-vertical card renderers ──────────────────────────────────────────────

const HotelCard = (h: SampleHotelCard) => (
  <article key={h.id} class={cardClass} style={cardStyle}>
    <div
      class="flex items-center justify-between px-4 pt-4"
      aria-hidden="false"
    >
      {typeChip('Hotel')}
      <span class="text-xs font-semibold" style="color:var(--ui-text-muted)">
        {'★'.repeat(h.starRating)}
        <span class="sr-only">{h.starRating}-star class</span>
      </span>
    </div>
    <div class="px-4 pb-4 pt-2">
      <h3 class="text-base font-bold tracking-tight" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
        {h.hotelName}
      </h3>
      <p class="mt-0.5 text-sm" style="color:var(--ui-text-muted)">
        {h.areaLabel} · {h.cityLabel}
      </p>
      <p class="mt-2 text-xs" style="color:var(--ui-text-muted)">
        {h.amenitiesSummary.join(' · ')}
      </p>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-lg font-bold" style="color:var(--ui-text)">
          {h.priceDisplay}
        </span>
        <span class="text-xs" style="color:var(--ui-text-muted)">
          /night
        </span>
        <IllustrativeTag />
      </div>
      <a href={h.ctaHref} class={ctaClass} style={ctaStyle}>
        {h.ctaLabel}
      </a>
    </div>
  </article>
)

const FlightCard = (f: SampleFlightCard) => (
  <article key={f.id} class={cardClass} style={cardStyle}>
    <div class="flex items-center justify-between px-4 pt-4">
      {typeChip('Flight')}
      <span class="text-xs font-semibold" style="color:var(--ui-text-muted)">
        {f.stopSummary}
      </span>
    </div>
    <div class="px-4 pb-4 pt-2">
      <h3 class="text-base font-bold tracking-tight" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
        {f.routeLabel}
      </h3>
      <p class="mt-0.5 text-sm" style="color:var(--ui-text-muted)">
        {f.departTime} – {f.arriveTime} · {f.durationLabel}
      </p>
      <p class="mt-2 text-xs" style="color:var(--ui-text-muted)">
        {f.airlineLabel} · {f.cabinLabel}
      </p>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-lg font-bold" style="color:var(--ui-text)">
          {f.priceDisplay}
        </span>
        <span class="text-xs" style="color:var(--ui-text-muted)">
          round-trip
        </span>
        <IllustrativeTag />
      </div>
      <a href={f.ctaHref} class={ctaClass} style={ctaStyle}>
        {f.ctaLabel}
      </a>
    </div>
  </article>
)

const CarCard = (c: SampleCarCard) => (
  <article key={c.id} class={cardClass} style={cardStyle}>
    <div class="flex items-center justify-between px-4 pt-4">
      {typeChip('Car')}
      <span class="text-xs font-semibold" style="color:var(--ui-text-muted)">
        {c.categoryLabel}
      </span>
    </div>
    <div class="px-4 pb-4 pt-2">
      <h3 class="text-base font-bold tracking-tight" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
        {c.vehicleName}
      </h3>
      <p class="mt-0.5 text-sm" style="color:var(--ui-text-muted)">
        {c.brandLabel} · {c.pickupLabel}
      </p>
      <p class="mt-2 text-xs" style="color:var(--ui-text-muted)">
        {c.transmissionLabel} · {c.passengerLabel}
      </p>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-lg font-bold" style="color:var(--ui-text)">
          {c.priceDisplay}
        </span>
        <IllustrativeTag />
      </div>
      <a href={c.ctaHref} class={ctaClass} style={ctaStyle}>
        {c.ctaLabel}
      </a>
    </div>
  </article>
)

const DestinationCard = (d: (typeof SAMPLE_DESTINATIONS)[number]) => (
  <article key={d.slug} class={cardClass} style={cardStyle}>
    <div
      class="relative flex items-end justify-between px-4 pb-3"
      style="height:84px;background-image:var(--ui-hero)"
    >
      <span
        class="text-lg font-bold"
        style={`color:#fff;font-family:${FONT_DISPLAY};text-shadow:0 1px 4px rgba(0,0,0,0.4)`}
      >
        {d.name}
      </span>
      <span
        class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
        style="background:rgba(255,255,255,0.22);color:#fff"
      >
        {d.airportCode}
      </span>
    </div>
    <div class="px-4 pb-4 pt-3">
      <div class="flex items-center gap-2">
        {typeChip('Destination')}
        <span class="text-xs" style="color:var(--ui-text-muted)">
          Real guide
        </span>
      </div>
      <p class="mt-2 text-sm" style="color:var(--ui-text-muted)">
        Best for {d.bestFor.join(', ')}.
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <a
          href={destinationHotelsHref(d)}
          class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
          style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
        >
          Hotels
        </a>
        <a
          href={destinationCarsHref(d)}
          class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
          style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
        >
          Cars
        </a>
      </div>
      <a
        href={destinationGuideHref(d)}
        class="mt-4 inline-flex text-sm font-semibold focus:outline-none focus-visible:ring-2"
        style="color:var(--ui-primary)"
      >
        View {d.name} guide &rarr;
      </a>
    </div>
  </article>
)

// ─── section heading with a "see all" switch into the vertical ────────────────

const SectionHeader = (props: { title: string; sub: string; seeAll?: SearchVerticalKey; count?: number }) => (
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 class="text-xl font-bold tracking-tight" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
        {props.title}
      </h2>
      <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
        {props.sub}
      </p>
    </div>
    {props.seeAll ? (
      <a
        href={verticalHref(props.seeAll)}
        class="text-sm font-semibold focus:outline-none focus-visible:ring-2"
        style="color:var(--ui-primary)"
      >
        See all {props.count} &rarr;
      </a>
    ) : null}
  </div>
)

// ─── main component ───────────────────────────────────────────────────────────

export const GlobalSearchSample = component$(() => {
  const location = useLocation()
  const active = normalizeVertical(location.url.searchParams.get('vertical'))

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Search intent header ─────────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="global-search-heading"
      >
        <div class="absolute inset-0 -z-10" style="background-image:var(--ui-hero-scrim)" aria-hidden="true" />
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <nav aria-label="Breadcrumb" class="mb-5">
            <ol class="flex flex-wrap items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.65)">
              <li class="flex items-center gap-2">
                <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li style="color:rgba(255,255,255,0.9)" aria-current="page">
                Search
              </li>
            </ol>
          </nav>

          <p class="text-[11px] font-bold uppercase tracking-[0.22em]" style="color:rgba(255,255,255,0.6)">
            Global search
          </p>
          <h1
            id="global-search-heading"
            class="mt-3 text-balance text-3xl font-bold leading-[1.06] md:text-5xl"
            style={`color:#fff;font-family:${FONT_DISPLAY}`}
          >
            Results for &ldquo;{SAMPLE_QUERY}&rdquo;
          </h1>
          <p class="mt-3 max-w-[60ch] text-base leading-relaxed" style="color:rgba(255,255,255,0.82)">
            The most useful matches for your travel intent, organized by what you can do next —
            stay, fly, drive, or explore.
          </p>

          {/* Query summary row (read-only intent, not a fake input) */}
          <div class="mt-6 flex flex-wrap items-center gap-3">
            <span
              class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style="background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3)"
            >
              <span aria-hidden="true">🔎</span>
              Searching: {SAMPLE_QUERY}
              <span class="text-[10px] font-bold uppercase tracking-wide" style="color:rgba(255,255,255,0.7)">
                sample query
              </span>
            </span>
            <a
              href="/"
              class="inline-flex rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style="background:#fff;color:var(--ui-text)"
            >
              Start a new search
            </a>
            <span class="text-sm" style="color:rgba(255,255,255,0.75)">
              {TOTAL_COUNT} matches across {VERTICALS.length - 1} categories
            </span>
          </div>
        </div>
      </section>

      {/* ── Sticky vertical switcher ─────────────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label="Filter results by category"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          {VERTICALS.map((v) => {
            const isActive = active === v.key
            const count = v.key === 'all' ? TOTAL_COUNT : VERTICAL_COUNTS[v.key]
            return (
              <a
                key={v.key}
                href={verticalHref(v.key)}
                class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  isActive
                    ? 'background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent'
                    : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
                }
                aria-current={isActive ? ('page' as const) : undefined}
              >
                {v.label}
                <span class="ml-1.5 text-xs font-normal" style="opacity:0.7">
                  {count}
                </span>
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Results body ─────────────────────────────────────────────────────── */}
      {active === 'all' ? (
        // Mixed, action-grouped overview
        <div class="mx-auto max-w-6xl space-y-12 px-4 py-12">
          <section aria-labelledby="all-hotels">
            <div id="all-hotels">
              <SectionHeader
                title="Stay"
                sub="Hotels that match this destination"
                seeAll="hotels"
                count={VERTICAL_COUNTS.hotels}
              />
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_HOTELS.slice(0, 3).map((h) => HotelCard(h))}
            </div>
          </section>

          <section aria-labelledby="all-flights">
            <div id="all-flights">
              <SectionHeader
                title="Fly"
                sub="Routes into the area"
                seeAll="flights"
                count={VERTICAL_COUNTS.flights}
              />
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_FLIGHTS.slice(0, 3).map((f) => FlightCard(f))}
            </div>
          </section>

          <section aria-labelledby="all-cars">
            <div id="all-cars">
              <SectionHeader
                title="Drive"
                sub="Car rentals at the destination"
                seeAll="cars"
                count={VERTICAL_COUNTS.cars}
              />
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_CARS.slice(0, 3).map((c) => CarCard(c))}
            </div>
          </section>

          <section aria-labelledby="all-destinations">
            <div id="all-destinations">
              <SectionHeader
                title="Explore"
                sub="Real destination guides — indexable and linked into every vertical"
                seeAll="destinations"
                count={VERTICAL_COUNTS.destinations}
              />
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_DESTINATIONS.map((d) => DestinationCard(d))}
            </div>
          </section>
        </div>
      ) : (
        // Per-vertical view: refinement rail + results
        <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[260px_1fr]">
          {/* Refinement concept rail */}
          <aside class="hidden lg:block" aria-label="Refine results (concept)">
            <div
              class="rounded-[var(--ui-radius)] p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase tracking-wide" style="color:var(--ui-text)">
                  Refine
                </h2>
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                >
                  Concept
                </span>
              </div>
              <p class="mt-2 text-xs" style="color:var(--ui-text-muted)">
                Refinement controls are a preview of direction. Real per-vertical filters are wired
                up in CLAUDE-UI-026.
              </p>

              <div class="mt-4">
                <label for="sample-sort" class="text-xs font-semibold" style="color:var(--ui-text-secondary)">
                  Sort
                </label>
                <select
                  id="sample-sort"
                  class="mt-1 w-full rounded-[var(--ui-radius)] px-3 py-2 text-sm"
                  style="background:var(--ui-surface-muted);color:var(--ui-text);border:1px solid var(--ui-border)"
                  disabled
                  aria-describedby="sample-sort-note"
                >
                  {SAMPLE_SORTS.map((s) => (
                    <option key={s.value} value={s.value} selected={s.active}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span id="sample-sort-note" class="sr-only">
                  Concept preview, not interactive.
                </span>
              </div>

              {SAMPLE_FILTER_GROUPS.map((group) => (
                <div key={group.title} class="mt-4 border-t pt-4" style="border-color:var(--ui-border)">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold" style="color:var(--ui-text-secondary)">
                      {group.title}
                    </span>
                    {!group.supported ? (
                      <span class="text-[10px] font-bold uppercase tracking-wide" style="color:var(--ui-text-muted)">
                        Future
                      </span>
                    ) : null}
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    {group.options.map((opt) => (
                      <span
                        key={opt}
                        class="rounded-full px-3 py-1 text-xs font-medium"
                        style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Results column */}
          <div>
            {/* Mobile refine affordance (concept, clearly labeled non-interactive) */}
            <div
              class="mb-4 flex items-center justify-between rounded-[var(--ui-radius)] px-4 py-3 lg:hidden"
              style="background:var(--ui-surface);border:1px solid var(--ui-border)"
            >
              <span class="text-sm font-semibold" style="color:var(--ui-text)">
                {VERTICAL_COUNTS[active]} results
              </span>
              <span
                class="rounded-full px-3 py-1 text-xs font-semibold"
                style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
              >
                Refine (concept)
              </span>
            </div>

            {active === 'hotels' ? (
              <div class="grid gap-4 sm:grid-cols-2">{SAMPLE_HOTELS.map((h) => HotelCard(h))}</div>
            ) : null}
            {active === 'flights' ? (
              <div class="grid gap-4 sm:grid-cols-2">{SAMPLE_FLIGHTS.map((f) => FlightCard(f))}</div>
            ) : null}
            {active === 'cars' ? (
              <div class="grid gap-4 sm:grid-cols-2">{SAMPLE_CARS.map((c) => CarCard(c))}</div>
            ) : null}
            {active === 'destinations' ? (
              <div class="grid gap-4 sm:grid-cols-2">{SAMPLE_DESTINATIONS.map((d) => DestinationCard(d))}</div>
            ) : null}

            {/* Pagination concept */}
            <nav
              class="mt-8 flex items-center justify-center gap-2"
              aria-label="Pagination (concept)"
            >
              <span
                class="rounded-[var(--ui-radius)] px-3 py-2 text-sm font-medium"
                style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border);opacity:0.6"
                aria-disabled="true"
              >
                ← Prev
              </span>
              {Array.from({ length: SAMPLE_PAGINATION.totalPages }, (_, i) => i + 1).map((n) => (
                <span
                  key={n}
                  class="rounded-[var(--ui-radius)] px-3.5 py-2 text-sm font-semibold"
                  style={
                    n === SAMPLE_PAGINATION.page
                      ? 'background:var(--ui-primary);color:var(--ui-on-primary)'
                      : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
                  }
                  aria-current={n === SAMPLE_PAGINATION.page ? ('page' as const) : undefined}
                >
                  {n}
                </span>
              ))}
              <span
                class="rounded-[var(--ui-radius)] px-3 py-2 text-sm font-medium"
                style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
              >
                Next →
              </span>
            </nav>
            <p class="mt-2 text-center text-xs" style="color:var(--ui-text-muted)">
              Pagination is a concept preview — production maps the real{' '}
              <code>[pageNumber]</code> route param.
            </p>
          </div>
        </div>
      )}

      {/* ── Empty + loading state concepts (labeled examples) ────────────────── */}
      <section class="mx-auto max-w-6xl px-4 pb-4">
        <h2 class="text-lg font-bold tracking-tight" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
          State previews
        </h2>
        <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
          How the page behaves with no matches or while results stream in. Shown together here for
          review only.
        </p>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Empty state */}
          <div
            class="rounded-[var(--ui-radius)] p-8 text-center"
            style="background:var(--ui-surface);border:1px solid var(--ui-border)"
          >
            <span
              class="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
            >
              Empty state · concept
            </span>
            <p class="mt-3 text-base font-semibold" style="color:var(--ui-text)">
              No matches for that search yet
            </p>
            <p class="mx-auto mt-1 max-w-[42ch] text-sm" style="color:var(--ui-text-muted)">
              Try a different city or broaden your dates. You can also jump straight into a vertical.
            </p>
            <div class="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href="/explore"
                class="rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2"
                style="background:var(--ui-primary);color:var(--ui-on-primary)"
              >
                Explore destinations
              </a>
              <a
                href="/"
                class="rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2"
                style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
              >
                Start a new search
              </a>
            </div>
          </div>

          {/* Loading state */}
          <div
            class="rounded-[var(--ui-radius)] p-6"
            style="background:var(--ui-surface);border:1px solid var(--ui-border)"
          >
            <span
              class="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
            >
              Loading state · concept
            </span>
            <div class="mt-3 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  class="flex items-center gap-3 rounded-[var(--ui-radius)] p-3"
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
                >
                  <div class="h-12 w-12 shrink-0 rounded-[var(--ui-radius)]" style="background:var(--ui-border)" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-2/3 rounded-full" style="background:var(--ui-border)" />
                    <div class="h-3 w-1/3 rounded-full" style="background:var(--ui-border)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Whole-trip handoff ───────────────────────────────────────────────── */}
      <section class="mx-auto mb-16 mt-8 max-w-6xl px-4">
        <div
          class="relative isolate overflow-hidden rounded-[var(--ui-radius-lg)] px-6 py-10 md:px-10"
          style="background-image:var(--ui-hero)"
        >
          <div class="absolute inset-0 -z-10" style="background-image:var(--ui-hero-scrim)" aria-hidden="true" />
          <p class="text-[11px] font-bold uppercase tracking-[0.2em]" style="color:rgba(255,255,255,0.62)">
            Plan your trip
          </p>
          <h2 class="mt-2 text-balance text-2xl font-bold md:text-3xl" style={`color:#fff;font-family:${FONT_DISPLAY}`}>
            Turn a search into a whole-trip plan
          </h2>
          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Move between flights, hotels, cars, and local discovery without losing your place.
          </p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SAMPLE_TRIP_HANDOFF.map(({ label, href, sub }) => (
              <a
                key={href}
                href={href}
                class="block rounded-[var(--ui-radius)] px-5 py-4 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.28)"
              >
                <div class="text-base font-bold" style={`color:#fff;font-family:${FONT_DISPLAY}`}>
                  {label}
                </div>
                <div class="mt-1 text-xs" style="color:rgba(255,255,255,0.75)">
                  {sub}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
})
