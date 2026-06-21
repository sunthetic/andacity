/**
 * CLAUDE-UI-026 — Production global search overview page component.
 *
 * Renders the unified cross-vertical search overview at
 * /search/all/[query]/[pageNumber]. Design thesis:
 *   "Here are the most useful matches for your travel intent, organized
 *    by what you can do next."
 *
 * This page is a search launcher / cross-vertical overview, not a ranked
 * metasearch engine. It does NOT invent live prices, availability, suppliers,
 * airline names, relevance scores, or scarcity claims.
 *
 * Hotels / flights / cars sections show honest launcher cards that route
 * users into real vertical search flows. The Destinations vertical shows
 * real matching entries from ~/data/destinations (the production dataset).
 *
 * See docs/ui-redesign/GLOBAL_SEARCH_IMPLEMENTATION.md for the full decision
 * record. Next: CLAUDE-UI-027 — Destination Detail Page Sample.
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import { DESTINATIONS, type Destination } from '~/data/destinations'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'

// ─── types ────────────────────────────────────────────────────────────────────

type SearchVerticalKey = 'all' | 'hotels' | 'flights' | 'cars' | 'destinations'

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

const cardClass =
  'flex flex-col overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus-within:ring-2'
const cardStyle =
  'background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)'
const ctaClass =
  'mt-4 inline-flex w-fit rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2'
const ctaStyle = 'background:var(--ui-primary);color:var(--ui-on-primary)'

// ─── vertical definitions ─────────────────────────────────────────────────────

const VERTICALS: { key: SearchVerticalKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hotels', label: 'Hotels' },
  { key: 'flights', label: 'Flights' },
  { key: 'cars', label: 'Cars' },
  { key: 'destinations', label: 'Destinations' },
]

const normalizeVertical = (raw: string | null): SearchVerticalKey => {
  if (raw === 'hotels' || raw === 'flights' || raw === 'cars' || raw === 'destinations') return raw
  return 'all'
}

// ─── destination matching (real data, no fabrication) ─────────────────────────

const matchDestinations = (query: string): Destination[] => {
  const q = query.toLowerCase().trim()
  if (!q) return DESTINATIONS
  return DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.query.toLowerCase().includes(q) ||
      d.bestFor.some((tag) => tag.toLowerCase().includes(q)) ||
      d.airportCode.toLowerCase() === q,
  )
}

// ─── link builders ────────────────────────────────────────────────────────────

const guideHref = (d: Destination) => `/destinations/${encodeURIComponent(d.slug)}`
const destHotelsHref = (d: Destination) => `/hotels?destination=${encodeURIComponent(d.query)}`
const destCarsHref = (d: Destination) => `/car-rentals?q=${encodeURIComponent(d.query)}`
const destFlightsHref = (d: Destination) =>
  buildFlightsSearchPath('anywhere', slugifyLocation(d.name) || 'anywhere', 'round-trip', 1)

// ─── type chip ────────────────────────────────────────────────────────────────

const TypeChip = (props: { label: string }) => (
  <span
    class="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
    style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
  >
    {props.label}
  </span>
)

// ─── section header ────────────────────────────────────────────────────────────

const SectionHeader = (props: {
  id: string
  title: string
  sub: string
  seeAllHref?: string
  seeAllLabel?: string
}) => (
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2
        id={props.id}
        class="text-xl font-bold tracking-tight"
        style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
      >
        {props.title}
      </h2>
      <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
        {props.sub}
      </p>
    </div>
    {props.seeAllHref ? (
      <a
        href={props.seeAllHref}
        class="text-sm font-semibold focus:outline-none focus-visible:ring-2"
        style="color:var(--ui-primary)"
      >
        {props.seeAllLabel ?? 'See all'} &rarr;
      </a>
    ) : null}
  </div>
)

// ─── vertical launcher card (hotels / flights / cars) ─────────────────────────

const LauncherCard = (props: {
  typeLabel: string
  headline: string
  description: string
  ctaLabel: string
  ctaHref: string
}) => (
  <article class={cardClass} style={cardStyle}>
    <div class="flex items-center gap-2 px-5 pt-5">
      <TypeChip label={props.typeLabel} />
    </div>
    <div class="px-5 pb-5 pt-3">
      <h3
        class="text-base font-bold tracking-tight"
        style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
      >
        {props.headline}
      </h3>
      <p class="mt-1.5 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
        {props.description}
      </p>
      <a href={props.ctaHref} class={ctaClass} style={ctaStyle}>
        {props.ctaLabel}
      </a>
    </div>
  </article>
)

// ─── destination card (real production data) ──────────────────────────────────

const DestinationCard = (props: { d: Destination }) => {
  const { d } = props
  return (
    <article class={cardClass} style={cardStyle}>
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
          <TypeChip label="Destination" />
        </div>
        <p class="mt-2 text-sm" style="color:var(--ui-text-muted)">
          Best for {d.bestFor.join(', ')}.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <a
            href={destFlightsHref(d)}
            class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
            style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
          >
            Flights
          </a>
          <a
            href={destHotelsHref(d)}
            class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
            style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
          >
            Hotels
          </a>
          <a
            href={destCarsHref(d)}
            class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
            style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
          >
            Cars
          </a>
        </div>
        <a
          href={guideHref(d)}
          class="mt-4 inline-flex text-sm font-semibold focus:outline-none focus-visible:ring-2"
          style="color:var(--ui-primary)"
        >
          View {d.name} guide &rarr;
        </a>
      </div>
    </article>
  )
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EmptyState = (props: { query: string }) => (
  <div
    class="rounded-[var(--ui-radius)] p-10 text-center"
    style="background:var(--ui-surface);border:1px solid var(--ui-border)"
  >
    <p class="text-lg font-semibold" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
      No destination guides found for &ldquo;{props.query}&rdquo;
    </p>
    <p class="mx-auto mt-2 max-w-[46ch] text-sm" style="color:var(--ui-text-muted)">
      Try a city name, airport code, or travel style. You can also browse all destinations or start
      a search directly in any vertical.
    </p>
    <div class="mt-5 flex flex-wrap justify-center gap-3">
      <a
        href="/destinations"
        class="rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2"
        style="background:var(--ui-primary);color:var(--ui-on-primary)"
      >
        Browse destinations
      </a>
      <a
        href="/explore"
        class="rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2"
        style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
      >
        Explore travel ideas
      </a>
    </div>
  </div>
)

// ─── trip handoff tiles ───────────────────────────────────────────────────────

const HANDOFF_TILES: { label: string; href: string; sub: string }[] = [
  { label: 'Explore', href: '/explore', sub: 'Discover where to go next' },
  { label: 'Flights', href: '/flights', sub: 'Routes and nonstop options' },
  { label: 'Hotels', href: '/hotels', sub: 'Stays with clear totals' },
  { label: 'Car rentals', href: '/car-rentals', sub: 'Flexible pickup and classes' },
  { label: 'Destinations', href: '/destinations', sub: 'Browse the travel atlas' },
]

// ─── main component ───────────────────────────────────────────────────────────

export const GlobalSearchPage = component$((props: { query: string; page: number }) => {
  const { query, page } = props
  const location = useLocation()
  const active = normalizeVertical(location.url.searchParams.get('vertical'))
  const matched = matchDestinations(query)
  const destCount = matched.length

  const base = `/search/all/${encodeURIComponent(query)}/${page}`
  const verticalHref = (key: SearchVerticalKey) =>
    key === 'all' ? base : `${base}?vertical=${key}`

  const hotelsHref = `/hotels?destination=${encodeURIComponent(query)}`
  const flightsHref = `/flights?to=${encodeURIComponent(query)}`
  const carsHref = `/car-rentals?q=${encodeURIComponent(query)}`

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Search intent header ─────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="global-search-heading"
      >
        <div
          class="absolute inset-0 -z-10"
          style="background-image:var(--ui-hero-scrim)"
          aria-hidden="true"
        />
        <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <nav aria-label="Breadcrumb" class="mb-5">
            <ol
              class="flex flex-wrap items-center gap-2 text-[12px]"
              style="color:rgba(255,255,255,0.65)"
            >
              <li class="flex items-center gap-2">
                <a
                  href="/"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li style="color:rgba(255,255,255,0.9)" aria-current="page">
                Search
              </li>
            </ol>
          </nav>

          <p
            class="text-[11px] font-bold uppercase tracking-[0.22em]"
            style="color:rgba(255,255,255,0.6)"
          >
            Search overview
          </p>
          <h1
            id="global-search-heading"
            class="mt-3 text-balance text-3xl font-bold leading-[1.06] md:text-5xl"
            style={`color:#fff;font-family:${FONT_DISPLAY}`}
          >
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p class="mt-3 max-w-[60ch] text-base leading-relaxed" style="color:rgba(255,255,255,0.82)">
            The most useful matches for your travel intent, organized by what you can do next —
            stay, fly, drive, or explore.
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <span
              class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style="background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3)"
            >
              Searching: {query}
              {destCount > 0 ? (
                <span
                  class="text-[10px] font-bold uppercase tracking-wide"
                  style="color:rgba(255,255,255,0.7)"
                >
                  {destCount} {destCount === 1 ? 'destination' : 'destinations'} found
                </span>
              ) : null}
            </span>
            <a
              href="/"
              class="inline-flex rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style="background:#fff;color:var(--ui-text)"
            >
              Start a new search
            </a>
          </div>
        </div>
      </section>

      {/* ── Sticky vertical switcher ─────────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label="Filter results by category"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          {VERTICALS.map((v) => {
            const isActive = active === v.key
            const showCount = v.key === 'destinations' && destCount > 0
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
                {showCount ? (
                  <span class="ml-1.5 text-xs font-normal" style="opacity:0.75">
                    {destCount}
                  </span>
                ) : null}
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Results body ─────────────────────────────────────────────────── */}
      {active === 'all' ? (
        // Mixed, action-grouped overview
        <div class="mx-auto max-w-6xl space-y-12 px-4 py-12">
          {/* Stay */}
          <section aria-labelledby="section-stay">
            <SectionHeader
              id="section-stay"
              title="Stay"
              sub="Search hotels at this destination"
              seeAllHref={verticalHref('hotels')}
              seeAllLabel="Hotels"
            />
            <div class="mt-5">
              <LauncherCard
                typeLabel="Hotels"
                headline={`Search hotels in ${query}`}
                description="Find places to stay with clear pricing, honest totals, and real cancellation policies."
                ctaLabel="Search hotels"
                ctaHref={hotelsHref}
              />
            </div>
          </section>

          {/* Fly */}
          <section aria-labelledby="section-fly">
            <SectionHeader
              id="section-fly"
              title="Fly"
              sub="Find flights to this destination"
              seeAllHref={verticalHref('flights')}
              seeAllLabel="Flights"
            />
            <div class="mt-5">
              <LauncherCard
                typeLabel="Flights"
                headline={`Find flights to ${query}`}
                description="Compare routes, stops, cabin options, and departure times for your trip."
                ctaLabel="Search flights"
                ctaHref={flightsHref}
              />
            </div>
          </section>

          {/* Drive */}
          <section aria-labelledby="section-drive">
            <SectionHeader
              id="section-drive"
              title="Drive"
              sub="Compare car rentals at this destination"
              seeAllHref={verticalHref('cars')}
              seeAllLabel="Cars"
            />
            <div class="mt-5">
              <LauncherCard
                typeLabel="Cars"
                headline={`Compare car rentals in ${query}`}
                description="Browse vehicle classes, automatic or manual, airport or hotel pickup."
                ctaLabel="Compare cars"
                ctaHref={carsHref}
              />
            </div>
          </section>

          {/* Explore / Destinations */}
          <section aria-labelledby="section-explore">
            <SectionHeader
              id="section-explore"
              title="Explore"
              sub={
                destCount > 0
                  ? `${destCount} destination ${destCount === 1 ? 'guide' : 'guides'} matching your search`
                  : 'Browse destination guides'
              }
              seeAllHref={destCount > 0 ? verticalHref('destinations') : '/destinations'}
              seeAllLabel={destCount > 0 ? `See all ${destCount}` : 'All destinations'}
            />
            <div class="mt-5">
              {destCount > 0 ? (
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matched.map((d) => (
                    <DestinationCard key={d.slug} d={d} />
                  ))}
                </div>
              ) : (
                <EmptyState query={query} />
              )}
            </div>
          </section>
        </div>
      ) : active === 'destinations' ? (
        // Destinations vertical
        <div class="mx-auto max-w-6xl px-4 py-12">
          {destCount > 0 ? (
            <>
              <p class="mb-5 text-sm" style="color:var(--ui-text-muted)">
                {destCount} destination {destCount === 1 ? 'guide' : 'guides'} matching &ldquo;
                {query}&rdquo;
              </p>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matched.map((d) => (
                  <DestinationCard key={d.slug} d={d} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      ) : (
        // Per-vertical launcher view (hotels / flights / cars)
        <div class="mx-auto max-w-6xl px-4 py-12">
          <div class="grid gap-6 lg:grid-cols-2">
            {active === 'hotels' ? (
              <LauncherCard
                typeLabel="Hotels"
                headline={`Search hotels in ${query}`}
                description="Find places to stay with clear pricing, honest totals, and real cancellation policies. Filter by area, amenities, and price band once you search."
                ctaLabel={`Search hotels in ${query}`}
                ctaHref={hotelsHref}
              />
            ) : active === 'flights' ? (
              <LauncherCard
                typeLabel="Flights"
                headline={`Find flights to ${query}`}
                description="Compare routes, nonstop vs. connecting, cabin class, and departure times. Add passengers and select travel dates to see real results."
                ctaLabel={`Search flights to ${query}`}
                ctaHref={flightsHref}
              />
            ) : (
              <LauncherCard
                typeLabel="Cars"
                headline={`Compare car rentals in ${query}`}
                description="Browse economy, midsize, SUV, and premium classes. Select your pickup date, location, and driver count to compare available options."
                ctaLabel={`Search cars in ${query}`}
                ctaHref={carsHref}
              />
            )}

            {/* Contextual destination card if we have a match */}
            {destCount > 0 ? (
              <div
                class="rounded-[var(--ui-radius)] p-5"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
              >
                <p class="text-xs font-semibold uppercase tracking-wide" style="color:var(--ui-text-muted)">
                  Destination guides
                </p>
                <div class="mt-3 flex flex-col gap-3">
                  {matched.map((d) => (
                    <a
                      key={d.slug}
                      href={guideHref(d)}
                      class="group flex items-center justify-between rounded-[var(--ui-radius)] px-4 py-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                      style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
                    >
                      <div>
                        <span
                          class="text-sm font-bold"
                          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                        >
                          {d.name}
                        </span>
                        <p class="text-xs" style="color:var(--ui-text-muted)">
                          Best for {d.bestFor.slice(0, 3).join(', ')}
                        </p>
                      </div>
                      <span class="text-sm font-semibold" style="color:var(--ui-primary)">
                        Guide &rarr;
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Whole-trip handoff ───────────────────────────────────────────── */}
      <section class="mx-auto mb-16 mt-4 max-w-6xl px-4" aria-label="Plan your whole trip">
        <div
          class="relative isolate overflow-hidden rounded-[var(--ui-radius-lg)] px-6 py-10 md:px-10"
          style="background-image:var(--ui-hero)"
        >
          <div
            class="absolute inset-0 -z-10"
            style="background-image:var(--ui-hero-scrim)"
            aria-hidden="true"
          />
          <p
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            style="color:rgba(255,255,255,0.62)"
          >
            Plan your trip
          </p>
          <h2
            class="mt-2 text-balance text-2xl font-bold md:text-3xl"
            style={`color:#fff;font-family:${FONT_DISPLAY}`}
          >
            Turn a search into a whole-trip plan
          </h2>
          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Move between flights, hotels, cars, and local discovery without losing your place.
          </p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HANDOFF_TILES.map(({ label, href, sub }) => (
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
