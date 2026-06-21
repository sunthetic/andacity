/**
 * CLAUDE-UI-027 — Destination detail page sample component.
 *
 * A premium, editorial "city guide" redesign of /destinations/[slug] built on
 * the --ui-* token system. Not production — preview only at
 * /dev/ui-destination-detail.
 *
 * Design thesis:
 *   "Understand this destination quickly, then plan the stay, flight, car,
 *    and local discovery around it."
 *
 * Design direction:
 * - Destination-specific cinematic hero (--ui-hero gradient + scrim, no image file)
 * - One H1 = the destination name; real quick-facts chips
 * - Sticky in-page anchor nav (Overview / Neighborhoods / Plan / Guide)
 * - Editorial summary + best-for / trip-style chips (real bestFor tags)
 * - Neighborhood/area section (REAL d.neighborhoods data)
 * - "Plan this trip" action panel: Flights / Hotels / Cars / Explore handoffs
 * - Practical guide section from REAL d.faq data
 * - Related destinations (other REAL destinations only)
 * - Whole-trip handoff panel
 * - Mobile sticky CTA
 *
 * Data honesty:
 * - Every field comes straight from the real production dataset
 *   (`~/data/destinations`): slug, name, query, airportCode, priceFrom,
 *   bestFor, neighborhoods, faq. Nothing is invented.
 * - No fabricated attractions, airport distances, weather/seasonality claims,
 *   popularity/ranking claims, or "best time to visit" claims. The only
 *   seasonality wording shown comes verbatim from the real `faq` field.
 * - All handoff links target routes verified to resolve (see
 *   docs/ui-redesign/samples/DESTINATION_DETAIL_SAMPLE.md).
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import { DESTINATIONS, type Destination } from '~/data/destinations'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── real link builders (all target routes verified to resolve) ───────────────

const guideHref = (d: Destination) => `/destinations/${encodeURIComponent(d.slug)}`
const flightsHref = (d: Destination) =>
  buildFlightsSearchPath('anywhere', slugifyLocation(d.name) || 'anywhere', 'round-trip', 1)
// City-specific pages resolve for both real destinations (miami, san-diego).
// Implementation should fall back to the query-param entry routes for any
// destination slug that lacks a matching city page.
const hotelsCityHref = (d: Destination) => `/hotels/in/${encodeURIComponent(d.slug)}`
const carsCityHref = (d: Destination) => `/car-rentals/in/${encodeURIComponent(d.slug)}`
const exploreHref = (d: Destination) => `/explore?destination=${encodeURIComponent(d.slug)}`
const areaHotelsHref = (d: Destination, area: string) =>
  `/hotels?destination=${encodeURIComponent(`${d.query} ${area}`)}`

const formatMoney = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${Math.round(amount)}`
  }
}

// Editorial summary built ONLY from real fields — no invented claims.
const buildSummary = (d: Destination) => {
  const best = d.bestFor.map((t) => t.toLowerCase())
  const bestPhrase =
    best.length >= 3
      ? `${best.slice(0, -1).join(', ')}, and ${best[best.length - 1]}`
      : best.join(' and ')
  return `${d.name} is one of the destinations Andacity can plan around — known on Andacity for ${bestPhrase}. Fly into ${d.airportCode}, choose a base across ${d.neighborhoods.length} distinct neighborhoods, then build the stay, car, and local discovery in one place.`
}

// ─── main component ───────────────────────────────────────────────────────────

export const DestinationDetailSample = component$(() => {
  const location = useLocation()
  // Allow previewing either real destination; default to Miami (or first valid).
  const requested = (location.url.searchParams.get('destination') ?? '').trim().toLowerCase()
  const d =
    DESTINATIONS.find((x) => x.slug === requested) ??
    DESTINATIONS.find((x) => x.slug === 'miami') ??
    DESTINATIONS[0]

  const related = DESTINATIONS.filter((x) => x.slug !== d.slug)
  const summary = buildSummary(d)

  const anchors = [
    { id: 'overview', label: 'Overview' },
    { id: 'neighborhoods', label: 'Neighborhoods' },
    { id: 'plan', label: 'Plan this trip' },
    { id: 'guide', label: 'Guide' },
  ] as const

  const planTiles = [
    {
      label: 'Flights',
      href: flightsHref(d),
      desc: `Compare routes into ${d.airportCode}. Nonstop options and fare types, with clear totals.`,
      cta: `Find flights to ${d.name}`,
    },
    {
      label: 'Hotels',
      href: hotelsCityHref(d),
      desc: `Browse stays across ${d.name} with transparent totals and clean cancellation policies.`,
      cta: `Browse ${d.name} stays`,
    },
    {
      label: 'Car rentals',
      href: carsCityHref(d),
      desc: `Pickup options and vehicle classes for getting around ${d.name} and beyond.`,
      cta: `Compare ${d.name} cars`,
    },
    {
      label: 'Explore',
      href: exploreHref(d),
      desc: `See how ${d.name} fits trip ideas by mood, season, and budget before you commit.`,
      cta: `Explore around ${d.name}`,
    },
  ] as const

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Destination hero ────────────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="destination-detail-heading"
      >
        <div
          class="absolute inset-0 -z-10"
          style="background-image:var(--ui-hero-scrim)"
          aria-hidden="true"
        />
        <div class="mx-auto max-w-6xl px-4 py-20 md:py-28">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" class="mb-6">
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
              <li class="flex items-center gap-2">
                <a
                  href="/destinations"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Destinations
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li style="color:rgba(255,255,255,0.92)" aria-current="page">
                {d.name}
              </li>
            </ol>
          </nav>

          <div class="max-w-2xl">
            <p
              class="text-[11px] font-bold uppercase tracking-[0.22em]"
              style="color:rgba(255,255,255,0.6)"
            >
              Destination guide
            </p>

            <h1
              id="destination-detail-heading"
              class="mt-3 text-balance text-4xl font-bold leading-[1.05] md:text-6xl"
              style={`color:#fff;font-family:${FONT_DISPLAY}`}
            >
              {d.name}
            </h1>

            <p
              class="mt-4 max-w-[58ch] text-base leading-relaxed"
              style="color:rgba(255,255,255,0.82)"
            >
              {summary}
            </p>

            {/* Quick-fact chips — real fields only */}
            <div class="mt-6 flex flex-wrap gap-2">
              {[
                `${d.airportCode} airport`,
                `${d.neighborhoods.length} neighborhoods`,
                ...d.bestFor.map((t) => `Best for ${t.toLowerCase()}`),
                `From ${formatMoney(d.priceFrom)}/night`,
              ].map((chip) => (
                <span
                  key={chip}
                  class="rounded-full px-3 py-1 text-xs font-semibold"
                  style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.28)"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Primary CTAs */}
            <div class="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#plan"
                class="inline-flex rounded-[var(--ui-radius)] px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style="background:#fff;color:var(--ui-text)"
              >
                Plan this trip
              </a>
              <a
                href={hotelsCityHref(d)}
                class="inline-flex rounded-[var(--ui-radius)] px-4 py-2.5 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style="background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3)"
              >
                Browse stays
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky in-page anchor nav ───────────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label={`On this ${d.name} guide`}
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span
            class="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em]"
            style="color:var(--ui-text-muted)"
          >
            On this guide
          </span>
          {anchors.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Overview / summary ──────────────────────────────────────────────── */}
      <section id="overview" class="mx-auto mt-12 max-w-6xl scroll-mt-20 px-4">
        <div class="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
          <div>
            <h2
              class="text-2xl font-bold tracking-tight"
              style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
            >
              Why {d.name}
            </h2>
            <p class="mt-3 max-w-[68ch] text-base leading-relaxed" style="color:var(--ui-text-secondary)">
              {summary}
            </p>

            {/* Best-for / trip-style chips (real bestFor → Explore handoff) */}
            <div class="mt-5">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em]" style="color:var(--ui-text-muted)">
                Best for
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                {d.bestFor.map((tag) => (
                  <a
                    key={tag}
                    href={exploreHref(d)}
                    class="rounded-full px-3 py-1.5 text-sm font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                    style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Good-to-know card — real fields only */}
          <aside
            class="rounded-[var(--ui-radius)] p-5"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
          >
            <h3
              class="text-sm font-bold uppercase tracking-[0.12em]"
              style="color:var(--ui-text-muted)"
            >
              Good to know
            </h3>
            <dl class="mt-3 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <dt style="color:var(--ui-text-muted)">Airport</dt>
                <dd class="font-semibold" style="color:var(--ui-text)">{d.airportCode}</dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt style="color:var(--ui-text-muted)">Neighborhoods</dt>
                <dd class="font-semibold" style="color:var(--ui-text)">{d.neighborhoods.length}</dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt style="color:var(--ui-text-muted)">Stays from</dt>
                <dd class="font-semibold" style="color:var(--ui-text)">
                  {formatMoney(d.priceFrom)}
                  <span class="font-normal" style="color:var(--ui-text-muted)"> /night</span>
                </dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt style="color:var(--ui-text-muted)">Best for</dt>
                <dd class="text-right font-semibold" style="color:var(--ui-text)">{d.bestFor.join(', ')}</dd>
              </div>
            </dl>
            <p class="mt-3 text-xs leading-relaxed" style="color:var(--ui-text-muted)">
              Nightly rates vary by season. Compare total price before booking.
            </p>
          </aside>
        </div>
      </section>

      {/* ── Neighborhoods / areas (REAL data) ───────────────────────────────── */}
      <section id="neighborhoods" class="mx-auto mt-14 max-w-6xl scroll-mt-20 px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          Where to stay in {d.name}
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Pick a base by the kind of trip you want. Each area links into stays for that part of {d.name}.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {d.neighborhoods.map((n, i) => (
            <article
              key={n.slug}
              class="flex overflow-hidden rounded-[var(--ui-radius)]"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              {/* CSS-only editorial accent band (decorative) */}
              <div
                class="hidden w-2 shrink-0 sm:block"
                style={`background-image:var(--ui-hero);opacity:${0.55 + (i % 4) * 0.12}`}
                aria-hidden="true"
              />
              <div class="p-5">
                <h3
                  class="text-base font-bold tracking-tight"
                  style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                >
                  {n.name}
                </h3>
                <p class="mt-1 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
                  {n.blurb}
                </p>
                <a
                  href={areaHotelsHref(d, n.name)}
                  class="mt-3 inline-flex text-sm font-semibold focus:outline-none focus-visible:ring-2"
                  style="color:var(--ui-primary)"
                >
                  Find stays in {n.name} &rarr;
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Plan this trip (handoff panel) ──────────────────────────────────── */}
      <section id="plan" class="mx-auto mt-14 max-w-6xl scroll-mt-20 px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          Plan this trip
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Move from reading about {d.name} to booking it. Every step links into a real search with transparent totals.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planTiles.map((tile) => (
            <a
              key={tile.label}
              href={tile.href}
              class="group flex flex-col rounded-[var(--ui-radius)] p-5 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              <span
                class="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
              >
                {tile.label}
              </span>
              <p class="mt-3 flex-1 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
                {tile.desc}
              </p>
              <span class="mt-4 text-sm font-semibold" style="color:var(--ui-primary)">
                {tile.cta} &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Practical guide (REAL faq data) ─────────────────────────────────── */}
      <section id="guide" class="mx-auto mt-14 max-w-6xl scroll-mt-20 px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          {d.name} planning guide
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Practical answers for planning a stay in {d.name}.
        </p>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          {d.faq.map((qa) => (
            <div
              key={qa.q}
              class="rounded-[var(--ui-radius)] p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              <h3 class="text-base font-bold" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
                {qa.q}
              </h3>
              <p class="mt-2 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
                {qa.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related destinations (REAL destinations only) ───────────────────── */}
      {related.length > 0 ? (
        <section class="mx-auto mt-14 max-w-6xl px-4">
          <h2
            class="text-2xl font-bold tracking-tight"
            style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
          >
            Keep planning
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
            Other destinations you can plan around on Andacity.
          </p>

          <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <a
                key={r.slug}
                href={guideHref(r)}
                class="group overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
              >
                <div
                  class="relative flex items-end justify-between px-4 pb-3"
                  style="height:84px;background-image:var(--ui-hero)"
                >
                  <span
                    class="text-xl font-bold"
                    style={`color:#fff;font-family:${FONT_DISPLAY};text-shadow:0 1px 4px rgba(0,0,0,0.4)`}
                  >
                    {r.name}
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style="background:rgba(255,255,255,0.22);color:#fff"
                  >
                    {r.airportCode}
                  </span>
                </div>
                <div class="p-4">
                  <p class="text-sm" style="color:var(--ui-text-muted)">
                    Best for {r.bestFor.join(', ')}.
                  </p>
                  <span class="mt-3 inline-flex text-sm font-semibold" style="color:var(--ui-primary)">
                    View {r.name} guide &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Whole-trip handoff ──────────────────────────────────────────────── */}
      <section class="mx-auto mb-24 mt-16 max-w-6xl px-4 lg:mb-16">
        <div
          class="relative isolate overflow-hidden rounded-[var(--ui-radius-lg)] px-6 py-10 md:px-10"
          style="background-image:var(--ui-hero)"
        >
          <div
            class="absolute inset-0 -z-10"
            style="background-image:var(--ui-hero-scrim)"
            aria-hidden="true"
          />

          <p class="text-[11px] font-bold uppercase tracking-[0.2em]" style="color:rgba(255,255,255,0.62)">
            Plan your trip
          </p>
          <h2
            class="mt-2 text-balance text-2xl font-bold md:text-3xl"
            style={`color:#fff;font-family:${FONT_DISPLAY}`}
          >
            Turn {d.name} into a whole-trip plan
          </h2>
          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Start anywhere — get inspired in Explore, then search flights, hotels, and car
            rentals with transparent totals and clear policies.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                { label: 'Explore', href: exploreHref(d), sub: `Ideas around ${d.name}` },
                { label: 'Flights', href: flightsHref(d), sub: `Routes into ${d.airportCode}` },
                { label: 'Hotels', href: hotelsCityHref(d), sub: 'Stays with clear totals' },
                { label: 'Car rentals', href: carsCityHref(d), sub: 'Flexible pickup and classes' },
                { label: 'Destinations', href: '/destinations', sub: 'Browse the full atlas' },
              ] as const
            ).map(({ label, href, sub }) => (
              <a
                key={label}
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

      {/* ── Mobile sticky CTA ───────────────────────────────────────────────── */}
      <div
        class="fixed inset-x-0 bottom-0 z-30 lg:hidden"
        style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:var(--ui-shadow-panel)"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-bold" style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}>
              Plan {d.name}
            </div>
            <div class="truncate text-xs" style="color:var(--ui-text-muted)">
              From {formatMoney(d.priceFrom)}/night · {d.airportCode}
            </div>
          </div>
          <a
            href={hotelsCityHref(d)}
            class="shrink-0 rounded-[var(--ui-radius)] px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
            style="background:var(--ui-primary);color:var(--ui-on-primary)"
          >
            Browse stays
          </a>
        </div>
      </div>

    </div>
  )
})
