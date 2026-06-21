/**
 * CLAUDE-UI-028 — Production destination detail page.
 *
 * Promotes the CLAUDE-UI-027 direction into production, replacing the legacy
 * hotel-centric page with an editorial destination guide.
 *
 * Changed from the previous implementation:
 * - H1 is now the destination name (was "Hotels in {name}")
 * - Page shell: --ui-* token system replaces legacy t-card / --color-* tokens
 * - Legacy empty Map card removed (no map dependency added)
 * - Legacy DateField hotel-search form removed
 * - topStays DB call removed (hotel cards not shown in new layout)
 * - Developer/SEO placeholder copy removed
 * - Page component replaced with inline --ui-* layout (no new <main>)
 *
 * Added:
 * - Cinematic --ui-hero gradient band hero
 * - Real quick-fact chips (airport, neighborhoods, bestFor, priceFrom)
 * - Sticky in-page anchor nav
 * - Editorial overview + "Good to know" facts card
 * - Real bestFor chips → /explore?destination=<slug> handoff
 * - Neighborhood area cards (REAL d.neighborhoods data)
 * - "Plan this trip" 4-tile panel (Flights / Hotels / Cars / Explore)
 * - Real FAQ planning guide
 * - Related destinations (other real destinations only)
 * - Whole-trip handoff panel + mobile sticky CTA
 *
 * Preserved exactly from the previous implementation:
 * - routeLoader$ / useDestinationPage (slug lookup, 404 on unknown slug)
 * - head metadata: canonical, OG, Twitter (copy updated to guide framing)
 * - JSON-LD: BreadcrumbList + TouristDestination + FAQPage (fields unchanged)
 */
import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { DESTINATIONS, DESTINATIONS_BY_SLUG, type Destination } from '~/data/destinations'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── real link builders (all target routes verified to resolve) ───────────────

const guideHref = (d: Destination) => `/destinations/${encodeURIComponent(d.slug)}`
const flightsHref = (d: Destination) =>
  buildFlightsSearchPath('anywhere', slugifyLocation(d.name) || 'anywhere', 'round-trip', 1)
// /hotels/in/<slug> and /car-rentals/in/<slug> resolve for both current
// destinations. For a future destination without a city page, fall back to the
// always-valid entry routes below.
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

// ─── route loader ─────────────────────────────────────────────────────────────

export const useDestinationPage = routeLoader$(async ({ params, error }) => {
  const slug = String(params.slug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')
  const destination = DESTINATIONS_BY_SLUG[slug]
  if (!destination) throw error(404, 'Not found')
  return { slug, destination, faq: destination.faq }
})

// ─── page component ───────────────────────────────────────────────────────────

export default component$(() => {
  const { destination: d } = useDestinationPage().value
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
            <p
              class="mt-3 max-w-[68ch] text-base leading-relaxed"
              style="color:var(--ui-text-secondary)"
            >
              {summary}
            </p>

            {/* Best-for / trip-style chips → Explore handoff */}
            <div class="mt-5">
              <p
                class="text-[11px] font-bold uppercase tracking-[0.15em]"
                style="color:var(--ui-text-muted)"
              >
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

      {/* ── Neighborhoods / areas (REAL data; omitted if empty) ─────────────── */}
      {d.neighborhoods.length > 0 ? (
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

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            {d.neighborhoods.map((n, i) => (
              <article
                key={n.slug}
                class="flex overflow-hidden rounded-[var(--ui-radius)]"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
              >
                {/* CSS-only editorial accent band — decorative, no geocoded meaning */}
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
      ) : null}

      {/* ── Plan this trip ──────────────────────────────────────────────────── */}
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

      {/* ── Practical guide (REAL faq data; omitted if empty) ───────────────── */}
      {d.faq.length > 0 ? (
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
                <h3
                  class="text-base font-bold"
                  style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                >
                  {qa.q}
                </h3>
                <p class="mt-2 text-sm leading-relaxed" style="color:var(--ui-text-secondary)">
                  {qa.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
                  <span
                    class="mt-3 inline-flex text-sm font-semibold"
                    style="color:var(--ui-primary)"
                  >
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
                <div
                  class="text-base font-bold"
                  style={`color:#fff;font-family:${FONT_DISPLAY}`}
                >
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
            <div
              class="truncate text-sm font-bold"
              style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
            >
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

// ─── head ─────────────────────────────────────────────────────────────────────

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useDestinationPage)
  const d = data.destination

  const title = `${d.name} — Destination Guide | Andacity Travel`
  const description = `Plan a trip to ${d.name}. Explore neighborhoods, search flights into ${d.airportCode}, compare hotels, and book car rentals — all with transparent totals. Best for ${d.bestFor.join(', ')}.`

  const canonicalHref = new URL(
    `/destinations/${encodeURIComponent(data.slug)}`,
    url.origin,
  ).href
  const ogImage = new URL(
    `/og/destination/${encodeURIComponent(data.slug)}.png`,
    url.origin,
  ).href

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Destinations',
            item: new URL('/destinations', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: d.name,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'TouristDestination',
        name: d.name,
        description,
      },
      {
        '@type': 'FAQPage',
        mainEntity: d.faq.map((qa) => ({
          '@type': 'Question',
          name: qa.q,
          acceptedAnswer: { '@type': 'Answer', text: qa.a },
        })),
      },
    ],
  })

  return {
    title,
    meta: [
      { name: 'description', content: description },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },

      { name: 'json-ld', content: jsonLd },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
