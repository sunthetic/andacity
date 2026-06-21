/**
 * CLAUDE-UI-029 — Trips page sample component.
 *
 * A focused, functional redesign of /trips built on the --ui-* token system.
 * Not production — preview only at /dev/ui-trips.
 *
 * Design thesis:
 *   "Your whole trip, organized at a glance."
 *
 * Design direction:
 * - Clean two-panel app layout: trip list sidebar + active trip main area
 * - No decorative hero — this is an app surface, not a landing page
 * - Left sidebar: trip list with selection states and "create trip" entry
 * - Trip header: name, reference, meta badges, price panel, quick-add CTAs
 * - Trip controls: inline name/status editor, save button
 * - Timeline view: day-grouped sections with item cards per day
 * - Item cards: time column + main card (type badge, title, price, details)
 * - Price emphasis with --ui-price; status with --ui-success/warning/danger-soft
 * - Mobile-responsive: sidebar collapses above the trip content
 *
 * Static display only — no interactivity wired. All state is hardcoded to
 * represent a realistic in-progress trip.
 *
 * Does NOT replace the production /trips route.
 * See docs/ui-redesign/samples/ for the approval gate.
 * Next (after approval): CLAUDE-UI-030 — Trips page implementation.
 */
import { component$ } from '@builder.io/qwik'

// ─── fonts ────────────────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Lexend Variable',var(--system-font-family)"
const FONT_BODY = "'Poppins',var(--system-font-family)"

// ─── static data ─────────────────────────────────────────────────────────────

const SAMPLE_TRIPS = [
  { id: 1, name: 'Miami Getaway', itemCount: 3, estimate: '$1,482', active: true },
  { id: 2, name: 'West Coast Loop', itemCount: 5, estimate: '$3,240', active: false },
]

const ACTIVE_TRIP = {
  id: 1,
  reference: 'TRIP-001',
  name: 'Miami Getaway',
  status: 'Planning',
  dateRange: 'Jul 12 – Jul 18, 2026',
  cities: 'Miami, FL',
  itemCount: 3,
  snapshotTotal: '$1,482',
  liveTotal: '$1,510',
  revalidationStatus: 'price_changes_present' as const,
  revalidationSummary: 'Live price differs from snapshot on 1 item',
  driftSummary: '+$28 since snapshot',
}

const SAMPLE_DAYS = [
  {
    key: 'day-1',
    dayNumber: 1,
    label: 'Saturday, Jul 12',
    shortLabel: 'Jul 12',
    items: [
      {
        id: 101,
        type: 'Flight',
        title: 'JFK → MIA',
        subtitle: 'American Airlines AA 2214 · Economy',
        route: 'New York JFK → Miami MIA',
        schedule: 'Departs 8:15 AM · Arrives 11:40 AM · 3h 25m',
        snapshotPrice: '$312',
        livePrice: '$312',
        priceDrift: 'none' as const,
        revalidation: 'valid' as const,
        locked: false,
        timeEyebrow: 'Departs',
        timePrimary: '8:15 AM',
        timeSecondary: 'Arrives 11:40 AM',
        spanBadge: null,
      },
      {
        id: 102,
        type: 'Hotel',
        title: 'Bayside Suites Miami',
        subtitle: 'South Beach · Standard King · 6 nights',
        route: '1 Collins Ave, Miami Beach, FL',
        schedule: 'Check-in Jul 12 · Check-out Jul 18 · 6 nights',
        snapshotPrice: '$870',
        livePrice: '$898',
        priceDrift: 'up' as const,
        revalidation: 'price_changed' as const,
        locked: false,
        timeEyebrow: 'Check-in',
        timePrimary: '3:00 PM',
        timeSecondary: null,
        spanBadge: '6 nights',
      },
    ],
  },
  {
    key: 'day-7',
    dayNumber: 7,
    label: 'Friday, Jul 18',
    shortLabel: 'Jul 18',
    items: [
      {
        id: 103,
        type: 'Car',
        title: 'Economy Car Rental',
        subtitle: 'Hertz · Toyota Corolla or similar · 2 days',
        route: 'Pick up at MIA Airport',
        schedule: 'Pick up Jul 18 · Return Jul 20',
        snapshotPrice: '$300',
        livePrice: '$300',
        priceDrift: 'none' as const,
        revalidation: 'valid' as const,
        locked: false,
        timeEyebrow: 'Pick up',
        timePrimary: '12:30 PM',
        timeSecondary: 'Return Jul 20',
        spanBadge: '2 days',
      },
    ],
  },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

const revalBadgeStyle = (status: 'valid' | 'price_changed') => {
  if (status === 'valid')
    return `background:var(--ui-success-soft);color:var(--ui-success);border:1px solid transparent`
  return `background:var(--ui-warning-soft);color:var(--ui-warning);border:1px solid transparent`
}
const revalBadgeLabel = (status: 'valid' | 'price_changed') => {
  if (status === 'valid') return 'Confirmed'
  return 'Price changed'
}

const driftStyle = (drift: 'none' | 'up') => {
  if (drift === 'up') return `color:var(--ui-warning)`
  return `color:var(--ui-text-muted)`
}
const driftLabel = (item: { livePrice: string; priceDrift: 'none' | 'up' }) => {
  if (item.priceDrift === 'up') return `Live ${item.livePrice} ↑`
  return `Live ${item.livePrice}`
}

const tripHeaderRevalStyle = (status: 'all_valid' | 'price_changes_present') => {
  if (status === 'all_valid')
    return `background:var(--ui-success-soft);color:var(--ui-success);border:1px solid transparent`
  return `background:var(--ui-warning-soft);color:var(--ui-warning);border:1px solid transparent`
}

// ─── sub-components ───────────────────────────────────────────────────────────

const TypeBadge = component$((props: { label: string }) => (
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    style="background:var(--ui-accent-soft);color:var(--ui-secondary)"
  >
    {props.label}
  </span>
))

const RevalBadge = component$(
  (props: { status: 'valid' | 'price_changed' }) => (
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={revalBadgeStyle(props.status)}
    >
      {revalBadgeLabel(props.status)}
    </span>
  ),
)

const Chip = component$((props: { label: string }) => (
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
    style="background:var(--ui-surface-muted);color:var(--ui-text-muted)"
  >
    {props.label}
  </span>
))

// ─── main component ───────────────────────────────────────────────────────────

export const TripsSample = component$(() => {
  const trip = ACTIVE_TRIP

  return (
    <div
      class="min-h-screen"
      style={`background:var(--ui-bg);color:var(--ui-text);font-family:${FONT_BODY}`}
    >
      {/* ── page content ── */}
      <div class="mx-auto max-w-6xl px-4 py-8 sm:py-10">

        {/* ── page header ── */}
        <div class="mb-6">
          <h1
            class="text-3xl font-bold tracking-tight sm:text-4xl"
            style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
          >
            Trips
          </h1>
          <p class="mt-1.5 text-sm" style="color:var(--ui-text-muted)">
            Save options into trips, sort the bucket, and book when you're ready.
          </p>
        </div>

        {/* ── price-changed notice ── */}
        <div
          class="mb-6 flex items-start gap-3 rounded-[var(--ui-radius)] px-4 py-3"
          role="status"
          style="background:var(--ui-warning-soft);border:1px solid var(--ui-warning)"
        >
          <svg
            class="mt-0.5 h-4 w-4 shrink-0"
            style="color:var(--ui-warning)"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm font-semibold" style="color:var(--ui-warning)">
              Live price differs from snapshot on 1 item
            </p>
            <p class="mt-0.5 text-xs" style="color:var(--ui-text-secondary)">
              Revalidate the trip to refresh prices before booking.
            </p>
          </div>
        </div>

        {/* ── two-panel layout ── */}
        <div class="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* ──────── LEFT SIDEBAR ──────── */}
          <aside>
            <div
              class="rounded-[var(--ui-radius-lg)] p-4"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              <h2
                class="text-xs font-semibold uppercase tracking-widest"
                style="color:var(--ui-text-muted)"
              >
                Your trips
              </h2>

              {/* create trip */}
              <div class="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  placeholder="New trip name…"
                  class="rounded-[var(--ui-radius-sm)] border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);border-color:var(--ui-border);color:var(--ui-text)"
                />
                <button
                  type="button"
                  class="rounded-[var(--ui-radius-sm)] px-3 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-primary);color:var(--ui-on-primary)"
                >
                  Create
                </button>
              </div>

              {/* trip list */}
              <div class="mt-4 grid gap-2">
                {SAMPLE_TRIPS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    class="group w-full rounded-[var(--ui-radius)] p-3 text-left transition focus:outline-none focus-visible:ring-2"
                    style={
                      t.active
                        ? 'background:var(--ui-accent-soft);border:1px solid var(--ui-primary)'
                        : 'background:var(--ui-bg);border:1px solid var(--ui-border)'
                    }
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span
                        class="text-sm font-semibold"
                        style={
                          t.active
                            ? 'color:var(--ui-primary)'
                            : 'color:var(--ui-text)'
                        }
                      >
                        {t.name}
                      </span>
                      {t.active && (
                        <svg
                          class="h-3.5 w-3.5"
                          style="color:var(--ui-primary)"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div
                      class="mt-1 flex items-center gap-2 text-[11px]"
                      style="color:var(--ui-text-muted)"
                    >
                      <span>{t.itemCount} items</span>
                      <span aria-hidden="true">·</span>
                      <span style="color:var(--ui-price);font-weight:600">
                        {t.estimate}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ──────── MAIN TRIP AREA ──────── */}
          <main class="grid gap-4 self-start">

            {/* ── trip header card ── */}
            <section
              class="rounded-[var(--ui-radius-lg)] p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              {/* reference + name + meta */}
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p
                    class="text-[10px] font-semibold uppercase tracking-widest"
                    style="color:var(--ui-text-muted)"
                  >
                    {trip.reference}
                  </p>
                  <h2
                    class="mt-1 text-2xl font-bold tracking-tight"
                    style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
                  >
                    {trip.name}
                  </h2>
                  <div
                    class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                    style="color:var(--ui-text-muted)"
                  >
                    <span>{trip.itemCount} items</span>
                    <span aria-hidden="true">·</span>
                    <span>{trip.dateRange}</span>
                    <span aria-hidden="true">·</span>
                    <span>{trip.cities}</span>
                  </div>
                </div>

                {/* price panel */}
                <div
                  class="min-w-[180px] rounded-[var(--ui-radius)] p-4"
                  style="background:var(--ui-bg);border:1px solid var(--ui-border)"
                >
                  <p
                    class="text-[10px] font-semibold uppercase tracking-widest"
                    style="color:var(--ui-text-muted)"
                  >
                    Saved total
                  </p>
                  <p
                    class="mt-1 text-2xl font-bold"
                    style={`font-family:${FONT_DISPLAY};color:var(--ui-price)`}
                  >
                    {trip.snapshotTotal}
                  </p>
                  <p class="mt-1 text-[11px]" style="color:var(--ui-warning)">
                    Live {trip.liveTotal} ↑
                  </p>
                </div>
              </div>

              {/* quick-add CTAs */}
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href="/flights"
                  class="rounded-[var(--ui-radius-sm)] px-4 py-2 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-primary);color:var(--ui-on-primary)"
                >
                  + Flights
                </a>
                <a
                  href="/hotels"
                  class="rounded-[var(--ui-radius-sm)] px-4 py-2 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);color:var(--ui-text);border:1px solid var(--ui-border)"
                >
                  + Hotels
                </a>
                <a
                  href="/car-rentals"
                  class="rounded-[var(--ui-radius-sm)] px-4 py-2 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);color:var(--ui-text);border:1px solid var(--ui-border)"
                >
                  + Cars
                </a>
                <button
                  type="button"
                  class="ml-auto rounded-[var(--ui-radius-sm)] px-3 py-2 text-[11px] font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                >
                  Revalidate prices
                </button>
              </div>

              {/* divider */}
              <div class="mt-4 border-t" style="border-color:var(--ui-divider)" />

              {/* name / status editor */}
              <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                <input
                  type="text"
                  value={trip.name}
                  aria-label="Trip name"
                  class="rounded-[var(--ui-radius-sm)] border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);border-color:var(--ui-border);color:var(--ui-text)"
                />
                <select
                  aria-label="Trip status"
                  class="rounded-[var(--ui-radius-sm)] border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);border-color:var(--ui-border);color:var(--ui-text)"
                >
                  <option>Draft</option>
                  <option selected>Planning</option>
                  <option>Ready</option>
                  <option>Archived</option>
                </select>
                <button
                  type="button"
                  class="rounded-[var(--ui-radius-sm)] px-3 py-2 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                  style="background:var(--ui-bg);color:var(--ui-text);border:1px solid var(--ui-border)"
                >
                  Save
                </button>
              </div>

              {/* summary stats */}
              <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Trip dates', value: trip.dateRange },
                  { label: 'Cities', value: trip.cities },
                  { label: 'Snapshot total', value: trip.snapshotTotal },
                  { label: 'Live total', value: trip.liveTotal },
                ].map((block) => (
                  <div
                    key={block.label}
                    class="rounded-[var(--ui-radius-sm)] px-3 py-2.5"
                    style="background:var(--ui-bg);border:1px solid var(--ui-border)"
                  >
                    <p
                      class="text-[10px] font-semibold uppercase tracking-widest"
                      style="color:var(--ui-text-muted)"
                    >
                      {block.label}
                    </p>
                    <p
                      class="mt-1 text-sm font-semibold"
                      style="color:var(--ui-text)"
                    >
                      {block.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* revalidation status */}
              <div class="mt-4 flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={tripHeaderRevalStyle('price_changes_present')}
                >
                  {trip.revalidationSummary}
                </span>
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style="background:var(--ui-surface-muted);color:var(--ui-warning)"
                >
                  {trip.driftSummary}
                </span>
              </div>
            </section>

            {/* ── trip timeline ── */}
            <section aria-label="Trip timeline">
              {/* timeline header */}
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <Chip label={`${trip.itemCount} items`} />
                <Chip label="2 days on timeline" />
                <Chip label="1 price change" />
              </div>

              {/* day groups */}
              <div class="grid gap-4">
                {SAMPLE_DAYS.map((day) => (
                  <section
                    key={day.key}
                    aria-labelledby={`day-label-${day.key}`}
                    class="rounded-[var(--ui-radius-lg)]"
                    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
                  >
                    {/* day header */}
                    <div
                      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      style="border-bottom:1px solid var(--ui-divider)"
                    >
                      <div>
                        <p
                          class="text-[10px] font-semibold uppercase tracking-widest"
                          style="color:var(--ui-text-muted)"
                        >
                          Day {day.dayNumber}
                        </p>
                        <h3
                          id={`day-label-${day.key}`}
                          class="mt-0.5 text-base font-semibold"
                          style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
                        >
                          {day.label}
                        </h3>
                        <p class="mt-0.5 text-xs" style="color:var(--ui-text-muted)">
                          {day.items.length} scheduled item
                          {day.items.length === 1 ? '' : 's'} for {day.shortLabel}
                        </p>
                      </div>
                      <Chip
                        label={
                          day.items.some((i) => i.revalidation === 'price_changed')
                            ? '1 price change'
                            : 'No conflicts'
                        }
                      />
                    </div>

                    {/* items */}
                    <div class="grid gap-4 p-4">
                      {day.items.map((item) => (
                        <div
                          key={item.id}
                          class="grid gap-3 md:grid-cols-[100px_1fr]"
                        >
                          {/* time column */}
                          <div
                            class="rounded-[var(--ui-radius)] px-3 py-3"
                            style="background:var(--ui-surface);border:1px solid var(--ui-border)"
                          >
                            <p
                              class="text-[9px] font-semibold uppercase tracking-widest"
                              style="color:var(--ui-text-muted)"
                            >
                              {item.timeEyebrow}
                            </p>
                            <p
                              class="mt-1 text-sm font-bold"
                              style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
                            >
                              {item.timePrimary}
                            </p>
                            {item.timeSecondary && (
                              <p
                                class="mt-0.5 text-[11px]"
                                style="color:var(--ui-text-muted)"
                              >
                                {item.timeSecondary}
                              </p>
                            )}
                            {item.spanBadge && (
                              <p
                                class="mt-3 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                style="background:var(--ui-accent-soft);color:var(--ui-secondary)"
                              >
                                {item.spanBadge}
                              </p>
                            )}
                          </div>

                          {/* item card */}
                          <article
                            class="rounded-[var(--ui-radius)] p-4"
                            style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
                          >
                            {/* badges */}
                            <div class="flex flex-wrap items-center gap-1.5">
                              <TypeBadge label={item.type} />
                              <RevalBadge status={item.revalidation} />
                            </div>

                            {/* content */}
                            <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
                              <div class="min-w-0 flex-1">
                                <h4
                                  class="text-base font-semibold"
                                  style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
                                >
                                  {item.title}
                                </h4>
                                <p
                                  class="mt-0.5 text-sm"
                                  style="color:var(--ui-text-muted)"
                                >
                                  {item.subtitle}
                                </p>
                                <p
                                  class="mt-1 text-xs"
                                  style="color:var(--ui-text-muted)"
                                >
                                  {item.schedule}
                                </p>
                              </div>

                              {/* price box */}
                              <div
                                class="min-w-[140px] rounded-[var(--ui-radius-sm)] p-3 text-right"
                                style="background:var(--ui-bg);border:1px solid var(--ui-border)"
                              >
                                <p
                                  class="text-[10px] font-semibold uppercase tracking-widest"
                                  style="color:var(--ui-text-muted)"
                                >
                                  Snapshot
                                </p>
                                <p
                                  class="mt-1 text-xl font-bold"
                                  style={`font-family:${FONT_DISPLAY};color:var(--ui-price)`}
                                >
                                  {item.snapshotPrice}
                                </p>
                                <p
                                  class="mt-1 text-[11px] font-medium"
                                  style={driftStyle(item.priceDrift)}
                                >
                                  {driftLabel(item)}
                                </p>
                              </div>
                            </div>

                            {/* details disclosure */}
                            <details class="mt-3">
                              <summary
                                class="cursor-pointer list-none rounded-[var(--ui-radius-sm)] px-3 py-2 text-sm font-medium transition hover:opacity-80 focus:outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
                                style="background:var(--ui-bg);color:var(--ui-text-secondary);border:1px solid var(--ui-border)"
                              >
                                <span class="flex items-center justify-between gap-2">
                                  <span>Details &amp; actions</span>
                                  <span
                                    class="text-[11px]"
                                    style="color:var(--ui-text-muted)"
                                  >
                                    Expand
                                  </span>
                                </span>
                              </summary>

                              <div
                                class="mt-2 rounded-[var(--ui-radius-sm)] p-3"
                                style="background:var(--ui-bg);border:1px solid var(--ui-border)"
                              >
                                {/* availability row */}
                                <div class="mb-3">
                                  <p
                                    class="text-[10px] font-semibold uppercase tracking-widest"
                                    style="color:var(--ui-text-muted)"
                                  >
                                    Availability
                                  </p>
                                  <p
                                    class="mt-1 text-sm font-medium"
                                    style={
                                      item.revalidation === 'valid'
                                        ? 'color:var(--ui-success)'
                                        : 'color:var(--ui-warning)'
                                    }
                                  >
                                    {item.revalidation === 'valid'
                                      ? 'Confirmed available'
                                      : 'Price has changed — revalidate before booking'}
                                  </p>
                                </div>

                                {/* actions */}
                                <div class="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    class="rounded-[var(--ui-radius-sm)] px-3 py-1.5 text-xs font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                                    style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
                                  >
                                    Move up
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-[var(--ui-radius-sm)] px-3 py-1.5 text-xs font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                                    style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
                                  >
                                    Move down
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-[var(--ui-radius-sm)] px-3 py-1.5 text-xs font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                                    style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                                  >
                                    View alternatives
                                  </button>
                                  <button
                                    type="button"
                                    class="ml-auto rounded-[var(--ui-radius-sm)] px-3 py-1.5 text-xs font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                                    style="background:var(--ui-danger-soft);color:var(--ui-danger);border:1px solid transparent"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </details>
                          </article>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            {/* ── proceed to checkout ── */}
            <div
              class="rounded-[var(--ui-radius-lg)] p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
            >
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3
                    class="text-base font-semibold"
                    style={`font-family:${FONT_DISPLAY};color:var(--ui-text)`}
                  >
                    Ready to book?
                  </h3>
                  <p class="mt-0.5 text-sm" style="color:var(--ui-text-muted)">
                    Total as saved:{' '}
                    <strong style="color:var(--ui-price)">{trip.snapshotTotal}</strong>.
                    Revalidate before checkout to confirm live prices.
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-[var(--ui-radius-sm)] px-4 py-2.5 text-sm font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                    style="background:var(--ui-bg);color:var(--ui-text);border:1px solid var(--ui-border)"
                  >
                    Revalidate
                  </button>
                  <a
                    href="/checkout"
                    class="rounded-[var(--ui-radius-sm)] px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2"
                    style="background:var(--ui-primary);color:var(--ui-on-primary)"
                  >
                    Proceed to checkout →
                  </a>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  )
})
