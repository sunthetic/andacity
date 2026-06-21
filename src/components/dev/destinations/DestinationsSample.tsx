/**
 * CLAUDE-UI-023 — Destinations page sample component.
 *
 * A premium "travel atlas" redesign of /destinations built on the --ui-* token
 * system. Not production — preview only at /dev/ui-destinations.
 *
 * Design direction:
 * - Atlas-style cinematic hero (--ui-hero gradient, no image file)
 * - Sticky "browse by experience" filter bar derived from REAL bestFor tags
 * - Editorial collection cards grouped by real experience tags
 * - Destination cards with city name + airport overlaid on a gradient header
 * - Whole-trip handoff panel (Explore / Flights / Hotels / Cars)
 *
 * Data honesty:
 * - Destination records come straight from the real production dataset
 *   (`~/data/destinations`): slug, name, query, airportCode, priceFrom,
 *   bestFor, neighborhoods. No invented destinations, regions, counts, or
 *   rankings.
 * - "Experience" groupings are derived only from the real `bestFor` tags.
 * - The production dataset currently holds 2 destinations; the layout scales
 *   to more without change. See DESTINATIONS_SAMPLE.md for what richer regional
 *   grouping would require.
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import { DESTINATIONS, type Destination } from '~/data/destinations'
import { buildFlightsSearchPath, slugifyLocation } from '~/lib/search/flights/routing'

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── real link builders (all target valid existing routes) ────────────────────

const guideHref = (d: Destination) => `/destinations/${encodeURIComponent(d.slug)}`
const flightsHref = (d: Destination) =>
  buildFlightsSearchPath('anywhere', slugifyLocation(d.name) || 'anywhere', 'round-trip', 1)
const hotelsHref = (d: Destination) => `/hotels?destination=${encodeURIComponent(d.query)}`
const carsHref = (d: Destination) => `/car-rentals?q=${encodeURIComponent(d.query)}`

// ─── experience tags derived from real bestFor data ───────────────────────────

const EXPERIENCE_TAGS: string[] = Array.from(
  new Set(DESTINATIONS.flatMap((d) => d.bestFor)),
).sort((a, b) => a.localeCompare(b))

const buildSampleHref = (experience?: string | null) =>
  experience ? `/dev/ui-destinations?experience=${encodeURIComponent(experience.toLowerCase())}` : '/dev/ui-destinations'

// Editorial collections, each defined purely by real bestFor tags.
const COLLECTIONS: { title: string; description: string; tags: string[] }[] = [
  {
    title: 'Beach & waterfront',
    description: 'Coastal destinations for sand, shoreline walks, and easy water access.',
    tags: ['Beach', 'Waterfront'],
  },
  {
    title: 'Family-friendly',
    description: 'Places with broad appeal and outdoor space for travelers of every age.',
    tags: ['Family', 'Outdoor'],
  },
  {
    title: 'Food & nightlife',
    description: 'Destinations known for their dining scenes and after-dark energy.',
    tags: ['Food', 'Nightlife'],
  },
]

const matchesTags = (d: Destination, tags: string[]) =>
  d.bestFor.some((t) => tags.includes(t))

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

// ─── main component ───────────────────────────────────────────────────────────

export const DestinationsSample = component$(() => {
  const location = useLocation()
  const rawExperience = (location.url.searchParams.get('experience') ?? '').trim().toLowerCase()
  const activeTag = EXPERIENCE_TAGS.find((t) => t.toLowerCase() === rawExperience) ?? null

  const visibleDestinations = activeTag
    ? DESTINATIONS.filter((d) => d.bestFor.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
    : DESTINATIONS

  const heroEyebrow = activeTag ? 'Destinations · Filtered' : 'Destinations'
  const heroTitle = activeTag ? `Destinations for ${activeTag.toLowerCase()} trips` : 'Browse destinations'
  const heroSubtitle = activeTag
    ? `Places tagged ${activeTag.toLowerCase()} in the Andacity destination atlas — then move straight into flights, hotels, and cars.`
    : 'A travel atlas of the places Andacity can help you plan around — then move into flights, hotels, cars, and local discovery.'

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Atlas hero ────────────────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="destinations-sample-heading"
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
              <li style="color:rgba(255,255,255,0.9)" aria-current="page">
                Destinations
              </li>
            </ol>
          </nav>

          <div class="max-w-2xl">
            <p
              class="text-[11px] font-bold uppercase tracking-[0.22em]"
              style="color:rgba(255,255,255,0.6)"
            >
              {heroEyebrow}
            </p>

            <h1
              id="destinations-sample-heading"
              class="mt-3 text-balance text-4xl font-bold leading-[1.05] md:text-6xl"
              style={`color:#fff;font-family:${FONT_DISPLAY}`}
            >
              {heroTitle}
            </h1>

            <p
              class="mt-4 max-w-[56ch] text-base leading-relaxed"
              style="color:rgba(255,255,255,0.82)"
            >
              {heroSubtitle}
            </p>

            {/* Browse affordance: jump to the destination grid */}
            <div class="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#all-destinations"
                class="inline-flex rounded-[var(--ui-radius)] px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style="background:#fff;color:var(--ui-text)"
              >
                Browse all destinations
              </a>
              {activeTag ? (
                <a
                  href="/dev/ui-destinations"
                  class="inline-flex rounded-[var(--ui-radius)] px-4 py-2.5 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style="background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3)"
                >
                  Clear filter
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky experience filter bar ──────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label="Browse by experience"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span
            class="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em]"
            style="color:var(--ui-text-muted)"
          >
            Experience
          </span>
          <a
            href="/dev/ui-destinations"
            class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={
              activeTag === null
                ? 'background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent'
                : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
            }
            aria-current={activeTag === null ? ('page' as const) : undefined}
          >
            All
          </a>
          {EXPERIENCE_TAGS.map((tag) => {
            const isActive = activeTag?.toLowerCase() === tag.toLowerCase()
            return (
              <a
                key={tag}
                href={buildSampleHref(tag)}
                class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  isActive
                    ? 'background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent'
                    : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
                }
                aria-current={isActive ? ('page' as const) : undefined}
              >
                {tag}
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Editorial collections ─────────────────────────────────────────── */}
      <section class="mx-auto mt-12 max-w-6xl px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          Editorial collections
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Curated entry points grouped by the experiences each destination is best for.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection) => {
            const count = DESTINATIONS.filter((d) => matchesTags(d, collection.tags)).length
            const primaryTag = collection.tags.find((t) =>
              EXPERIENCE_TAGS.some((e) => e.toLowerCase() === t.toLowerCase()),
            )
            return (
              <a
                key={collection.title}
                href={buildSampleHref(primaryTag ?? null)}
                class="group block overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
              >
                {/* Gradient header band */}
                <div
                  class="flex items-end px-4 pb-3"
                  style="height:80px;background-image:var(--ui-hero);border-radius:var(--ui-radius) var(--ui-radius) 0 0"
                  aria-hidden="true"
                >
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style="background:rgba(255,255,255,0.2);color:rgba(255,255,255,0.9)"
                  >
                    Collection
                  </span>
                </div>

                <div class="p-4">
                  <h3
                    class="text-base font-bold tracking-tight"
                    style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                  >
                    {collection.title}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
                    {collection.description}
                  </p>
                  <div class="mt-3 text-sm font-semibold" style="color:var(--ui-primary)">
                    {count === 1 ? '1 destination' : `${count} destinations`} &rarr;
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── All destinations grid ─────────────────────────────────────────── */}
      <section id="all-destinations" class="mx-auto mt-12 max-w-6xl scroll-mt-20 px-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              class="text-2xl font-bold tracking-tight"
              style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
            >
              {activeTag ? `${activeTag} destinations` : 'All destinations'}
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
              Indexable destination guides. Each links to flights, hotels, and car rentals.
            </p>
          </div>
          <span class="text-sm font-medium" style="color:var(--ui-text-muted)">
            {visibleDestinations.length === 1
              ? '1 place'
              : `${visibleDestinations.length} places`}
          </span>
        </div>

        {visibleDestinations.length === 0 ? (
          <div
            class="mt-6 rounded-[var(--ui-radius)] p-8 text-center"
            style="background:var(--ui-surface);border:1px solid var(--ui-border)"
          >
            <p class="text-sm font-semibold" style="color:var(--ui-text)">
              No destinations match this experience yet.
            </p>
            <a
              href="/dev/ui-destinations"
              class="mt-3 inline-flex text-sm font-semibold focus:outline-none focus-visible:ring-2"
              style="color:var(--ui-primary)"
            >
              View all destinations &rarr;
            </a>
          </div>
        ) : (
          <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleDestinations.map((d) => (
              <article
                key={d.slug}
                class="overflow-hidden rounded-[var(--ui-radius)] transition"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
              >
                {/* Gradient header with city name + airport (real text, not aria-hidden) */}
                <div
                  class="relative flex items-end justify-between px-4 pb-3"
                  style="height:84px;background-image:var(--ui-hero)"
                >
                  <span
                    class="text-xl font-bold"
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

                <div class="p-4">
                  <p class="text-sm" style="color:var(--ui-text-muted)">
                    Best for {d.bestFor.join(', ')}.
                  </p>
                  <p class="mt-1 text-xs" style="color:var(--ui-text-muted)">
                    {d.neighborhoods.length} neighborhoods · from {formatMoney(d.priceFrom)}/night
                    <span style="color:var(--ui-text-muted)"> (varies by season)</span>
                  </p>

                  {/* bestFor tag chips */}
                  <div class="mt-3 flex flex-wrap gap-2">
                    {d.bestFor.map((tag) => (
                      <a
                        key={tag}
                        href={buildSampleHref(tag)}
                        class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                        style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>

                  {/* Whole-trip quick links */}
                  <div class="mt-4 flex flex-wrap gap-2">
                    {(
                      [
                        { label: 'Flights', href: flightsHref(d) },
                        { label: 'Hotels', href: hotelsHref(d) },
                        { label: 'Cars', href: carsHref(d) },
                      ] as const
                    ).map(({ label, href }) => (
                      <a
                        key={label}
                        href={href}
                        class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                        style="background:var(--ui-surface);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                      >
                        {label}
                      </a>
                    ))}
                  </div>

                  {/* Primary action → destination guide */}
                  <div class="mt-4">
                    <a
                      href={guideHref(d)}
                      class="text-sm font-semibold focus:outline-none focus-visible:ring-2"
                      style="color:var(--ui-primary)"
                    >
                      View {d.name} guide &rarr;
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Whole-trip handoff ────────────────────────────────────────────── */}
      <section class="mx-auto mb-16 mt-14 max-w-6xl px-4">
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
            Turn a destination into a whole-trip plan
          </h2>

          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Start anywhere — get inspired in Explore, then search flights, hotels, and car
            rentals with transparent totals and clear policies.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { label: 'Explore', href: '/explore', sub: 'Discover where to go next' },
                { label: 'Flights', href: '/flights', sub: 'Routes and nonstop options' },
                { label: 'Hotels', href: '/hotels', sub: 'Stays with clear totals' },
                { label: 'Car rentals', href: '/car-rentals', sub: 'Flexible pickup and classes' },
              ] as const
            ).map(({ label, href, sub }) => (
              <a
                key={href}
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

    </div>
  )
})
