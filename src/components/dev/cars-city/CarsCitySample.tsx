/**
 * CLAUDE-UI-019 — Car rentals by City page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-cars-city). A premium,
 * city-specific, search-forward car-rentals-by-city concept built on the
 * `--ui-*` foundation + CLAUDE-UI-002 primitives. Renders inside the production
 * global shell (SiteHeader/SiteFooter via the root layout); this component is
 * only the page body and intentionally does NOT add its own <main>.
 *
 * All vehicle content is ILLUSTRATIVE (see carsCitySampleData.ts) — Orlando-
 * themed class-led results with illustrative per-day prices, no supplier names,
 * no live availability. City-level data mirrors the shape of the real
 * car-rental city + results model so CLAUDE-UI-020 can swap in real loaders
 * without structural changes.
 *
 * Imagery: all media tiles use the palette's --ui-hero gradient as a safe local
 * stand-in. The pickup "map" is a CSS-only concept with honest labelling — no
 * Google Maps / Mapbox / Leaflet, no remote tiles, no API keys, no geocoded pins.
 *
 * It does NOT replace src/routes/car-rentals/in/[citySlug]/index.tsx.
 * See docs/ui-redesign/samples/CARS_CITY_SAMPLE.md for what is illustrative
 * versus real and for the approval gate.
 */
import { component$ } from "@builder.io/qwik";
import { CarCard } from "~/components/ui/CarCard";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import {
  SAMPLE_CAR_CITY,
  SAMPLE_CAR_RESULTS,
  SAMPLE_CAR_SORTS,
  SAMPLE_CAR_FILTERS,
  SAMPLE_PICKUP_POINTS,
  SAMPLE_CAR_MAP_PINS,
  SAMPLE_DRIVING_CONTEXT,
  SAMPLE_CAR_POLICY,
  SAMPLE_RELATED_CAR_CITIES,
  SAMPLE_CAR_CITY_HANDOFF,
} from "~/components/dev/cars-city/carsCitySampleData";

const c = SAMPLE_CAR_CITY;
const cityHref = `/car-rentals/in/${c.citySlug}`;
const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* City hero + search / refinement module                             */
/* ------------------------------------------------------------------ */

const CityHero = component$(() => (
  <section
    class="relative isolate overflow-hidden"
    style="background-image:var(--ui-hero)"
    aria-label={`Car rentals in ${c.city} — hero section`}
  >
    <div
      class="absolute inset-0 -z-10"
      style="background-image:var(--ui-hero-scrim)"
      aria-hidden="true"
    />

    <div class="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" class="mb-4">
        <ol class="flex flex-wrap items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.7)">
          <li class="flex items-center gap-2">
            <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Home</a>
            <span aria-hidden="true">/</span>
          </li>
          <li class="flex items-center gap-2">
            <a href="/car-rentals" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Car Rentals</a>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">{c.city}</li>
        </ol>
      </nav>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div>
          <p
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            style="color:rgba(255,255,255,0.75)"
          >
            {c.region} · {c.country}
          </p>

          {/* H1 — clear, single, city-specific */}
          <h1
            class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
            style={`color:#fff;font-family:${HEADING_FONT}`}
          >
            Car rentals in {c.city}
          </h1>

          <p class="mt-3 max-w-[52ch] text-base" style="color:rgba(255,255,255,0.88)">
            Compare vehicle classes for your dates, pick up at {c.airportCode} or
            in the city, and see mileage and policy terms on every rate before you
            book.
          </p>

          {/* Quick stat pills — illustrative, labelled honestly */}
          <div class="mt-4 flex flex-wrap gap-2">
            {[
              `${c.vehicleCount} vehicles`,
              `${c.airportCode} & city pickup`,
              "Pickup & dropoff dates",
            ].map((label) => (
              <span
                key={label}
                class="rounded-full px-3 py-1 text-[12px] font-semibold"
                style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Search / refinement card — presentational concept */}
        <div
          class="p-5"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
          aria-label={`Refine car rentals in ${c.city}`}
        >
          <div
            class="text-sm font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            Refine your {c.city} search
          </div>

          <div class="mt-4 grid gap-2">
            <SearchField label="Pickup location" placeholder={`${c.city} (${c.airportCode} or city)`} />
            <div class="grid grid-cols-2 gap-2">
              <SearchField label="Pickup date" placeholder="Add date" />
              <SearchField label="Dropoff date" placeholder="Add date" />
            </div>
            <SearchField label="Drivers" placeholder="1" />
          </div>

          <div class="mt-3 grid gap-2">
            <a
              href={cityHref}
              class="block w-full rounded-xl py-3 text-center text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
            >
              See {c.city} rentals
            </a>
            <p class="text-[11px] text-center" style="color:var(--ui-text-muted)">
              This city page is indexable. Live rates appear after you search.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Filter / sort bar                                                  */
/* ------------------------------------------------------------------ */

const FilterBar = component$(() => (
  <div
    class="sticky top-[var(--sticky-top-offset,0)] z-30"
    style="background:var(--ui-surface);border-bottom:1px solid var(--ui-border)"
  >
    <div class="mx-auto max-w-6xl px-4">
      <div class="flex items-center gap-3 overflow-x-auto py-2.5 scrollbar-none">
        {/* Sort — presentational */}
        <div
          class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
        >
          <span>{SAMPLE_CAR_SORTS[0]}</span>
          <span aria-hidden="true" style="color:var(--ui-text-muted)">▾</span>
        </div>

        <div
          class="h-4 shrink-0"
          style="width:1px;background:var(--ui-divider)"
          aria-hidden="true"
        />

        {/* Quick filter chips — presentational concept */}
        {SAMPLE_CAR_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={f.active ?? false}
            class="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style={
              f.active
                ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
            }
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Vehicle results grid                                               */
/* ------------------------------------------------------------------ */

const ResultsGrid = component$(() => (
  <section class="mx-auto max-w-6xl px-4 py-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2
          class="text-xl font-bold"
          style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
        >
          {c.vehicleCount} vehicles in {c.city}
        </h2>
        <p class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
          Illustrative · per day from ${c.priceFrom}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Badge tone="neutral" label="Totals include taxes & fees" />
      </div>
    </div>

    {/* Vehicle card grid — CLAUDE-UI-002 CarCard primitive */}
    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_CAR_RESULTS.map((car) => (
        <CarCard key={car.name} model={car} />
      ))}
    </div>

    <p class="mt-4 text-[11px]" style="color:var(--ui-text-muted)">
      Vehicle classes and prices shown are illustrative — exact vehicles, live
      rates, and availability come from a real search. No supplier shown until you
      compare rates.
    </p>

    <div class="mt-6 text-center">
      <Button
        variant="secondary"
        label={`See all rentals in ${c.city}`}
        href={cityHref}
        ariaLabel={`See all car rentals in ${c.city}`}
      />
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Pickup points + CSS-only map concept                               */
/* ------------------------------------------------------------------ */

const PickupMap = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
    >
      Where to pick up in {c.city}
    </h2>
    <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
      Collect at the airport on arrival or from a city desk closer to your stay.
    </p>

    <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      {/* Pickup point list — prefills the real search */}
      <div class="flex flex-col gap-2">
        {SAMPLE_PICKUP_POINTS.map((p) => (
          <a
            key={p.label}
            href={p.href}
            aria-label={`Search car rentals — ${p.label}`}
            class="group flex items-center justify-between gap-3 p-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
          >
            <div class="min-w-0">
              <div class="text-sm font-semibold" style="color:var(--ui-text)">
                {p.label}
              </div>
              <div class="text-[12px]" style="color:var(--ui-text-muted)">
                {p.note}
              </div>
            </div>
            <span
              class="text-[12px] transition group-hover:translate-x-0.5"
              style="color:var(--ui-text-muted)"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        ))}
        <a
          href="/car-rentals/in"
          class="mt-1 text-[12px] font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="color:var(--ui-primary)"
        >
          Browse all rental cities →
        </a>
      </div>

      {/* CSS-only pickup-area concept — honest, non-geocoded */}
      <div
        class="relative min-h-[20rem] overflow-hidden"
        style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        role="img"
        aria-label={`Layout concept showing approximate pickup areas in ${c.city} — not a geocoded map`}
      >
        {/* Road grid suggestion */}
        <div
          class="absolute inset-0 opacity-50"
          aria-hidden="true"
          style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
        />
        {/* Highway diagonal suggestion */}
        <div
          class="absolute inset-0"
          aria-hidden="true"
          style="background:linear-gradient(118deg, transparent 46%, color-mix(in srgb, var(--ui-primary) 14%, transparent) 47% 50%, transparent 51%)"
        />

        {/* Pickup-area pins */}
        {SAMPLE_CAR_MAP_PINS.map((pin) => (
          <span
            key={pin.label}
            class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={`left:${pin.x}%;top:${pin.y}%;box-shadow:var(--ui-shadow-card);${
              pin.active
                ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                : "background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
            }`}
            aria-hidden="true"
          >
            {pin.label}
          </span>
        ))}

        {/* Honest concept label */}
        <span
          class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
        >
          Pickup areas · concept
        </span>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Local driving / travel context                                     */
/* ------------------------------------------------------------------ */

const DrivingContext = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
    >
      Driving in {c.city}
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Practical context for renting and driving here — production copy would
      reflect real city data.
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {SAMPLE_DRIVING_CONTEXT.map((item) => (
        <div
          key={item.title}
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <span
            class="grid size-8 place-items-center rounded-full text-[14px]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <h3
            class="mt-3 text-sm font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            {item.title}
          </h3>
          <p class="mt-1.5 text-[13px]" style="color:var(--ui-text-muted)">
            {item.body}
          </p>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Trust / policy clarity                                             */
/* ------------------------------------------------------------------ */

const TrustSection = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
    >
      Booking you can read
    </h2>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {SAMPLE_CAR_POLICY.map((t) => (
        <div
          key={t.title}
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <span
            class="grid size-8 place-items-center rounded-full text-[14px]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            {t.icon}
          </span>
          <h3
            class="mt-3 text-sm font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            {t.title}
          </h3>
          <p class="mt-1.5 text-[13px]" style="color:var(--ui-text-muted)">
            {t.body}
          </p>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Related cities + whole-trip handoff                                */
/* ------------------------------------------------------------------ */

const RelatedAndHandoff = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
    >
      Keep planning
    </h2>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      {/* Related car-rental cities */}
      <div>
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          Other rental cities
        </h3>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          {SAMPLE_RELATED_CAR_CITIES.map((city) => (
            <a
              key={city.city}
              href={city.href}
              class="group flex flex-col gap-1 p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
            >
              <div
                class="mb-2 h-14 w-full overflow-hidden"
                style="background-image:var(--ui-hero);border-radius:var(--ui-radius-sm)"
                role="img"
                aria-hidden="true"
              />
              <span
                class="text-sm font-bold transition group-hover:underline"
                style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
              >
                {city.city}
              </span>
              <span class="text-[12px]" style="color:var(--ui-text-muted)">
                {city.blurb}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Whole-trip handoff */}
      <div>
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          Finish the trip
        </h3>
        <div class="mt-3 flex flex-col gap-3">
          {SAMPLE_CAR_CITY_HANDOFF.map((item) => (
            <div
              key={item.title}
              class="flex items-center justify-between gap-3 p-4"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
            >
              <div class="min-w-0">
                <div
                  class="text-sm font-bold"
                  style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
                >
                  {item.title}
                </div>
                <div class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
                  {item.body}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                label={item.cta}
                href={item.href}
                ariaLabel={item.cta}
              />
            </div>
          ))}
        </div>
      </div>
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
          Cars in {c.city}
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          Per day from ${c.priceFrom} · illustrative
        </div>
      </div>
      <a
        href={cityHref}
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        See rentals
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Presentational search field                                        */
/* ------------------------------------------------------------------ */

const SearchField = component$((props: { label: string; placeholder: string }) => (
  <div>
    <div
      class="text-[10px] font-bold uppercase tracking-[0.1em]"
      style="color:var(--ui-text-muted)"
    >
      {props.label}
    </div>
    <div
      class="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
      style="border-color:var(--ui-border);background:var(--ui-surface-muted);color:var(--ui-text-muted)"
      aria-label={`${props.label} (presentational — the real picker is used in production)`}
    >
      {props.placeholder}
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Sample page composition                                            */
/* ------------------------------------------------------------------ */

export const CarsCitySample = component$(() => (
  <div
    style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)"
  >
    <CityHero />
    <FilterBar />
    <ResultsGrid />
    <PickupMap />
    <DrivingContext />
    <TrustSection />
    <RelatedAndHandoff />

    {/* Spacer for mobile sticky CTA */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
