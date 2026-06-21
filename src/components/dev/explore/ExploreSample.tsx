/**
 * CLAUDE-UI-021 — Explore page sample component.
 *
 * Cinematic, discovery-first redesign of /explore built on the --ui-* token
 * system. Not production — preview only at /dev/ui-explore.
 *
 * Design direction:
 * - Generous cinematic hero (--ui-hero gradient, no image file)
 * - Sticky mood filter bar (8 theme chips, active state, horizontal scroll)
 * - Editorial idea cards with --ui-hero gradient header bands
 * - Destination cards with city name overlaid on gradient header
 * - Whole-trip handoff inside a --ui-hero panel at the bottom
 * - Guided mode (active filter): next steps promoted above the main grid
 * - URL params ?theme=<key>, ?idea=<key>, ?destination=<key> all functional
 */
import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'
import {
  buildSampleExploreHref,
  DEFAULT_NEXT_STEPS,
  SAMPLE_DESTINATIONS,
  SAMPLE_IDEAS,
  SAMPLE_THEMES,
  type SampleDestination,
  type SampleNextStep,
} from './exploreSampleData'

// ─── shared styles ────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── next step cards (reused in guided and default modes) ─────────────────────

const NextStepsGrid = (props: { steps: SampleNextStep[]; intro: string }) => (
  <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {props.steps.map((step) => (
      <a
        key={step.href}
        href={step.href}
        class="block rounded-[var(--ui-radius)] p-5 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card);focus-visible:ring-color:var(--ui-ring)"
      >
        <div
          class="mb-3 h-0.5 w-8 rounded-full"
          style="background:var(--ui-primary)"
          aria-hidden="true"
        />
        <h3
          class="text-sm font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          {step.title}
        </h3>
        <p class="mt-1 text-xs leading-relaxed" style="color:var(--ui-text-muted)">
          {step.description}
        </p>
        <div class="mt-3 text-xs font-semibold" style="color:var(--ui-primary)">
          {step.cta} &rarr;
        </div>
      </a>
    ))}
  </div>
)

// ─── destination step builder ─────────────────────────────────────────────────

const buildDestSteps = (dest: SampleDestination): SampleNextStep[] => [
  {
    title: `Flights to ${dest.name}`,
    description: `Search air routes that fit ${dest.name} timing and trip flexibility.`,
    href: dest.flightHref,
    cta: 'Search flights',
  },
  {
    title: `${dest.name} hotels`,
    description: `Browse accommodation options for ${dest.name} before fixing dates.`,
    href: dest.hotelHref,
    cta: 'Browse hotels',
  },
  {
    title: `Car rentals in ${dest.name}`,
    description: 'Keep local transport optional with destination-aligned rental paths.',
    href: dest.carHref,
    cta: 'Explore rentals',
  },
  {
    title: `${dest.name} guide`,
    description: 'Use destination content to align neighborhood and planning tradeoffs.',
    href: dest.guideHref,
    cta: 'Open guide',
  },
]

// ─── main component ───────────────────────────────────────────────────────────

export const ExploreSample = component$(() => {
  const location = useLocation()
  const rawTheme = (location.url.searchParams.get('theme') ?? '').trim().toLowerCase()
  const rawIdea = (location.url.searchParams.get('idea') ?? '').trim().toLowerCase()
  const rawDestination = (location.url.searchParams.get('destination') ?? '').trim().toLowerCase()

  const activeTheme = SAMPLE_THEMES.find((t) => t.key === rawTheme) ?? null
  const activeIdea = SAMPLE_IDEAS.find((i) => i.key === rawIdea) ?? null
  const activeDestination = SAMPLE_DESTINATIONS.find((d) => d.key === rawDestination) ?? null

  const isGuidedMode = !!(activeTheme || activeIdea || activeDestination)

  const bannerText =
    activeIdea?.contextBanner ??
    activeTheme?.contextBanner ??
    (activeDestination ? `Showing trip paths for ${activeDestination.name}` : null)

  const nextStepsIntro =
    activeIdea?.nextStepsIntro ??
    activeTheme?.nextStepsIntro ??
    (activeDestination
      ? `Use ${activeDestination.name} as the planning anchor, then branch into flights, hotels, and car rentals.`
      : 'Start with one vertical, then expand into hotels, flights, and rentals as your plan takes shape.')

  const nextSteps: SampleNextStep[] =
    activeIdea?.nextSteps ??
    activeTheme?.nextSteps ??
    (activeDestination ? buildDestSteps(activeDestination) : null) ??
    DEFAULT_NEXT_STEPS

  const popularTitle =
    activeIdea?.popularTitle ??
    activeTheme?.popularTitle ??
    (activeDestination ? `Popular destination paths from ${activeDestination.name}` : 'Popular destinations')

  const popularDescription =
    activeIdea?.popularDescription ??
    activeTheme?.popularDescription ??
    'Jump into places that pair well with flexible planning and multi-vertical booking.'

  const prioritySlugs =
    activeIdea?.destinationSlugs ??
    activeTheme?.destinationSlugs ??
    (activeDestination ? [activeDestination.key] : [])

  const orderedDestinations =
    prioritySlugs.length > 0
      ? [...SAMPLE_DESTINATIONS].sort((a, b) => {
          const ai = prioritySlugs.indexOf(a.key)
          const bi = prioritySlugs.indexOf(b.key)
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })
      : SAMPLE_DESTINATIONS

  const heroEyebrow = isGuidedMode ? 'Explore · Guided' : 'Explore'
  const heroTitle = isGuidedMode
    ? 'Exploring trips that match your selection'
    : 'Discover where to go next'
  const heroSubtitle = isGuidedMode
    ? 'Use the suggested next steps below to move from inspiration to active trip planning.'
    : 'Browse trips by mood, season, or budget — then turn inspiration into a whole-trip plan.'

  return (
    <div style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}>

      {/* ── Cinematic hero ───────────────────────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background-image:var(--ui-hero)"
        aria-labelledby="explore-sample-heading"
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
                Explore
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
              id="explore-sample-heading"
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

            {/* Guided mode: glass panel + clear link */}
            {isGuidedMode && bannerText ? (
              <div
                class="mt-6 max-w-xl rounded-[var(--ui-radius-lg)] p-5"
                style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.28);backdrop-filter:blur(4px)"
              >
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.15em]"
                  style="color:rgba(255,255,255,0.62)"
                >
                  Current selection
                </p>
                <p
                  class="mt-2 text-sm font-semibold"
                  style={`color:#fff;font-family:${FONT_DISPLAY}`}
                >
                  {bannerText}
                </p>
                <p class="mt-1 text-sm" style="color:rgba(255,255,255,0.75)">
                  Use the next steps below to move from this mood into active booking.
                </p>
                <a
                  href="/dev/ui-explore"
                  class="mt-4 inline-flex rounded-[var(--ui-radius)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style="background:#fff;color:var(--ui-text)"
                >
                  Clear selection
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Sticky mood filter bar ────────────────────────────────────────── */}
      <div
        class="sticky top-0 z-20 overflow-x-auto"
        style="background:var(--ui-bg);border-bottom:1px solid var(--ui-border)"
        role="navigation"
        aria-label="Browse by mood"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span
            class="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em]"
            style="color:var(--ui-text-muted)"
          >
            Mood
          </span>
          {SAMPLE_THEMES.map((theme) => {
            const isActive = rawTheme === theme.key
            return (
              <a
                key={theme.key}
                href={buildSampleExploreHref({ theme: theme.key })}
                class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={
                  isActive
                    ? 'background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent'
                    : 'background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)'
                }
                aria-current={isActive ? ('page' as const) : undefined}
              >
                {theme.label}
              </a>
            )
          })}
          {rawTheme ? (
            <a
              href="/dev/ui-explore"
              class="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2"
              style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
            >
              Clear
            </a>
          ) : null}
        </div>
      </div>

      {/* ── Guided next steps (top position) ─────────────────────────────── */}
      {isGuidedMode ? (
        <section class="mx-auto mt-10 max-w-6xl px-4">
          <h2
            class="text-2xl font-bold tracking-tight"
            style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
          >
            Suggested next steps
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
            {nextStepsIntro}
          </p>
          <NextStepsGrid steps={nextSteps} intro={nextStepsIntro} />
        </section>
      ) : null}

      {/* ── Trip ideas ────────────────────────────────────────────────────── */}
      <section class="mx-auto mt-12 max-w-6xl px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          Trip ideas
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          Use themed starters when your destination is still open.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_IDEAS.map((idea) => {
            const isActive = rawIdea === idea.key
            return (
              <a
                key={idea.key}
                href={buildSampleExploreHref({ idea: idea.key })}
                class="group block overflow-hidden rounded-[var(--ui-radius)] transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                style={
                  isActive
                    ? `background:var(--ui-surface);border:2px solid var(--ui-primary);box-shadow:var(--ui-shadow-panel);focus-visible:ring-color:var(--ui-ring)`
                    : `background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card);focus-visible:ring-color:var(--ui-ring)`
                }
                aria-current={isActive ? ('page' as const) : undefined}
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
                    Flexible idea
                  </span>
                </div>

                <div class="p-4">
                  <h3
                    class="text-base font-bold tracking-tight"
                    style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
                  >
                    {idea.title}
                  </h3>
                  <p class="mt-1 text-sm leading-relaxed" style="color:var(--ui-text-muted)">
                    {idea.description}
                  </p>
                  <div class="mt-3 text-sm font-semibold" style="color:var(--ui-primary)">
                    Explore idea &rarr;
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── Popular destinations ──────────────────────────────────────────── */}
      <section class="mx-auto mt-12 max-w-6xl px-4">
        <h2
          class="text-2xl font-bold tracking-tight"
          style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
        >
          {popularTitle}
        </h2>
        <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
          {popularDescription}
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedDestinations.map((dest) => {
            const isActive = rawDestination === dest.key
            return (
              <article
                key={dest.key}
                class="overflow-hidden rounded-[var(--ui-radius)] transition"
                style={
                  isActive
                    ? 'background:var(--ui-surface);border:2px solid var(--ui-primary);box-shadow:var(--ui-shadow-panel)'
                    : 'background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)'
                }
              >
                {/* Gradient header with city name */}
                <div
                  class="relative flex items-end justify-between px-4 pb-3"
                  style="height:72px;background-image:var(--ui-hero)"
                  aria-hidden="true"
                >
                  <span
                    class="text-xl font-bold"
                    style={`color:#fff;font-family:${FONT_DISPLAY};text-shadow:0 1px 4px rgba(0,0,0,0.4)`}
                  >
                    {dest.name}
                  </span>
                  {isActive ? (
                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                      style="background:rgba(255,255,255,0.25);color:#fff"
                    >
                      In focus
                    </span>
                  ) : null}
                </div>

                <div class="p-4">
                  <p class="text-sm" style="color:var(--ui-text-muted)">
                    {dest.blurb}
                  </p>

                  {/* Quick links */}
                  <div class="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        { label: 'Flights', href: dest.flightHref },
                        { label: 'Hotels', href: dest.hotelHref },
                        { label: 'Cars', href: dest.carHref },
                      ] as const
                    ).map(({ label, href }) => (
                      <a
                        key={label}
                        href={href}
                        class="rounded-full px-3 py-1 text-xs font-semibold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2"
                        style="background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                      >
                        {label}
                      </a>
                    ))}
                  </div>

                  {/* Primary action + Use in Explore */}
                  <div class="mt-4 flex items-center justify-between gap-2">
                    <a
                      href={dest.primaryHref}
                      class="text-sm font-semibold focus:outline-none focus-visible:ring-2"
                      style="color:var(--ui-primary)"
                    >
                      {dest.primaryLabel} &rarr;
                    </a>
                    <a
                      href={buildSampleExploreHref({ destination: dest.key })}
                      class="text-xs font-medium transition hover:underline focus:outline-none focus-visible:ring-2"
                      style="color:var(--ui-text-muted)"
                    >
                      Use in Explore
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Default next steps (bottom position) ─────────────────────────── */}
      {!isGuidedMode ? (
        <section class="mx-auto mt-12 max-w-6xl px-4">
          <h2
            class="text-2xl font-bold tracking-tight"
            style={`color:var(--ui-text);font-family:${FONT_DISPLAY}`}
          >
            Suggested next steps
          </h2>
          <p class="mt-2 max-w-[72ch] text-sm" style="color:var(--ui-text-muted)">
            {nextStepsIntro}
          </p>
          <NextStepsGrid steps={nextSteps} intro={nextStepsIntro} />
        </section>
      ) : null}

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
            Turn inspiration into a whole-trip plan
          </h2>

          <p class="mt-2 max-w-[56ch] text-sm leading-relaxed" style="color:rgba(255,255,255,0.8)">
            Pick a vertical to start — flights, hotels, or car rentals. Each opens a full
            search experience with filters, transparent totals, and clear policies.
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  label: 'Search Flights',
                  href: '/flights',
                  sub: 'Routes, schedules, and nonstop options',
                },
                {
                  label: 'Browse Hotels',
                  href: '/hotels',
                  sub: 'Destination-aware stays with clear totals',
                },
                {
                  label: 'Compare Cars',
                  href: '/car-rentals',
                  sub: 'Flexible pickup dates and vehicle classes',
                },
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
