/**
 * CLAUDE-UI-011 — Hotels by City page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-hotels-city). A premium,
 * city-specific, search-forward hotel city landing page concept built on the
 * `--ui-*` foundation + CLAUDE-UI-002 primitives. Renders inside the production
 * global shell (SiteHeader/SiteFooter via the root layout); this component is
 * only the page body.
 *
 * All hotel content is ILLUSTRATIVE (see hotelsCitySampleData.ts) — fictional
 * properties and illustrative prices for the Miami sample. City-level data
 * (neighborhoods, amenity counts) is also illustrative but intentionally mirrors
 * the shape of real production HotelCity data so CLAUDE-UI-012 can swap in the
 * real loader without structural changes.
 *
 * Imagery: all hotel media tiles use the palette's --ui-hero gradient as a
 * safe local stand-in. No remote image dependencies.
 *
 * It does NOT replace src/routes/hotels/in/[citySlug]/index.tsx.
 * See docs/ui-redesign/samples/HOTELS_CITY_SAMPLE.md for what is illustrative
 * versus real and for the approval gate.
 */
import { component$ } from "@builder.io/qwik";
import { HotelCard } from "~/components/ui/HotelCard";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import {
  SAMPLE_CITY,
  SAMPLE_HOTELS,
  SAMPLE_QUICK_FILTERS,
  SAMPLE_MAP_PINS,
  SAMPLE_RELATED_CITIES,
} from "~/components/dev/hotels-city/hotelsCitySampleData";

const c = SAMPLE_CITY;

/* ------------------------------------------------------------------ */
/* City hero                                                          */
/* ------------------------------------------------------------------ */

const CityHero = component$(() => (
  <section
    class="relative isolate overflow-hidden"
    style="background-image:var(--ui-hero)"
    aria-label={`Hotels in ${c.city} — hero section`}
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
            <a href="/hotels" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Hotels</a>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">{c.city}</li>
        </ol>
      </nav>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div>
          {/* Region context */}
          <p
            class="text-[11px] font-bold uppercase tracking-[0.2em]"
            style="color:rgba(255,255,255,0.75)"
          >
            {c.region} · {c.country}
          </p>

          {/* H1 — clear, single, city-specific */}
          <h1
            class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
            style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
          >
            Hotels in {c.city}
          </h1>

          <p class="mt-3 max-w-[52ch] text-base" style="color:rgba(255,255,255,0.88)">
            {c.hotelCount} hotels — transparent totals, clear cancellation policies,
            and fast filtering across every area of the city.
          </p>

          {/* Quick stat row */}
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              class="rounded-full px-3 py-1 text-[12px] font-semibold"
              style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
            >
              {c.hotelCount} hotels
            </span>
            <span
              class="rounded-full px-3 py-1 text-[12px] font-semibold"
              style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
            >
              From ${c.priceFrom}/night
            </span>
            <span
              class="rounded-full px-3 py-1 text-[12px] font-semibold"
              style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
            >
              {c.topNeighborhoods.length} areas
            </span>
          </div>
        </div>

        {/* Search card — presentational */}
        <div
          class="p-5"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
          aria-label="Search hotels in Miami"
        >
          <div
            class="text-sm font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            Search hotels in {c.city}
          </div>

          {/* Presentational form fields */}
          <div class="mt-4 grid gap-2">
            <div class="grid grid-cols-2 gap-2">
              <SearchField label="Check-in" placeholder="Add date" />
              <SearchField label="Check-out" placeholder="Add date" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <SearchField label="Adults" placeholder="2" />
              <SearchField label="Rooms" placeholder="1" />
            </div>
          </div>

          <div class="mt-3 grid gap-2">
            <a
              href={`/hotels/in/${c.citySlug}`}
              class="block w-full rounded-xl py-3 text-center text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
            >
              Search {c.city} hotels
            </a>
            <p class="text-[11px] text-center" style="color:var(--ui-text-muted)">
              This city page is indexable. Search results remain noindex.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Filter bar                                                         */
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
          <span>Recommended</span>
          <span aria-hidden="true" style="color:var(--ui-text-muted)">▾</span>
        </div>

        <div
          class="h-4 shrink-0"
          style="width:1px;background:var(--ui-divider)"
          aria-hidden="true"
        />

        {/* Quick filter chips */}
        {SAMPLE_QUICK_FILTERS.map((f) => (
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
/* Results grid                                                       */
/* ------------------------------------------------------------------ */

const ResultsGrid = component$(() => (
  <section class="mx-auto max-w-6xl px-4 py-8">
    {/* Results header */}
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2
          class="text-xl font-bold"
          style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
        >
          {c.hotelCount} hotels in {c.city}
        </h2>
        <p class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
          Illustrative · from ${c.priceFrom}/night
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Badge tone="neutral" label="Free cancellation" />
      </div>
    </div>

    {/* Hotel card grid */}
    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_HOTELS.map((hotel) => (
        <HotelCard key={hotel.name} model={hotel} />
      ))}
    </div>

    {/* Disclaimer + CTA */}
    <p class="mt-4 text-[11px]" style="color:var(--ui-text-muted)">
      Sample properties for illustration — real availability comes from a live search.
    </p>

    <div class="mt-6 text-center">
      <Button
        variant="secondary"
        label={`See all hotels in ${c.city}`}
        href={`/hotels/in/${c.citySlug}`}
        ariaLabel={`See all hotels in ${c.city}`}
      />
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Neighborhood explorer + CSS map concept                            */
/* ------------------------------------------------------------------ */

const NeighborhoodMap = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Explore by area
    </h2>
    <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
      {c.city} has {c.topNeighborhoods.length} distinct hotel neighborhoods.
    </p>

    <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      {/* Neighborhood list */}
      <div class="flex flex-col gap-2">
        {c.topNeighborhoods.map((n) => (
          <a
            key={n.name}
            href={`/hotels/in/${c.citySlug}`}
            class="group flex items-center justify-between gap-3 p-3 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
          >
            <div class="min-w-0">
              <div class="text-sm font-semibold" style="color:var(--ui-text)">
                {n.name}
              </div>
              <div class="text-[12px]" style="color:var(--ui-text-muted)">
                {n.blurb}
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background:var(--ui-accent-soft);color:var(--ui-accent)"
              >
                {n.count}
              </span>
              <span
                class="text-[12px] transition group-hover:translate-x-0.5"
                style="color:var(--ui-text-muted)"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* CSS-only map concept */}
      <div
        class="relative min-h-[22rem] overflow-hidden"
        style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        role="img"
        aria-label={`Map concept showing approximate hotel areas in ${c.city} — not a geocoded map`}
      >
        {/* Street grid */}
        <div
          class="absolute inset-0 opacity-50"
          aria-hidden="true"
          style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
        />
        {/* Radial water suggestion */}
        <div
          class="absolute inset-0"
          aria-hidden="true"
          style="background:radial-gradient(ellipse 60% 40% at 75% 80%, color-mix(in srgb, var(--ui-primary) 8%, transparent), transparent 70%)"
        />

        {/* Price pins */}
        {SAMPLE_MAP_PINS.map((pin) => (
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
            {pin.price}
          </span>
        ))}

        {/* Honest label */}
        <span
          class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
        >
          Map layout · concept
        </span>

        {/* City name pin */}
        <span
          class="absolute left-[35%] top-[32%] -translate-x-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[12px] font-bold"
          style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
          aria-hidden="true"
        >
          {c.city}
        </span>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* City guide / editorial section                                     */
/* ------------------------------------------------------------------ */

const CityGuide = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Staying in {c.city}
    </h2>

    <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Editorial copy */}
      <div class="flex flex-col gap-4">
        <p class="text-sm leading-relaxed" style="color:var(--ui-text-muted)">
          {c.city} spans a wide range of stay types — from beachfront resorts in
          South Beach to urban hotels in Brickell and boutique stays in Wynwood's
          arts district. Most visitors choose South Beach for its proximity to the
          beach and Art Deco architecture, while Brickell attracts business
          travelers looking for a walkable, well-connected base.
        </p>
        <p class="text-[12px]" style="color:var(--ui-text-muted)">
          Sample editorial — production copy would reflect actual city data.
        </p>

        {/* Key facts grid */}
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Hotels", value: String(c.hotelCount) },
            { label: "Starting from", value: `$${c.priceFrom}/night` },
            { label: "Top area", value: c.topNeighborhoods[0]?.name ?? c.city },
            { label: "Region", value: c.region },
            { label: "Country", value: c.country },
            {
              label: "Most popular amenity",
              value: c.topAmenities[0]?.name ?? "—",
            },
          ].map((fact) => (
            <div
              key={fact.label}
              class="p-3"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
            >
              <div class="text-[10px] font-bold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
                {fact.label}
              </div>
              <div class="mt-0.5 text-sm font-semibold" style="color:var(--ui-text)">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top areas + amenities panel */}
      <div class="flex flex-col gap-4">
        <div
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <h3 class="text-sm font-bold" style="color:var(--ui-text)">
            Top areas in {c.city}
          </h3>
          <ul class="mt-3 flex flex-col gap-1.5">
            {c.topNeighborhoods.slice(0, 5).map((n) => (
              <li
                key={n.name}
                class="flex items-center justify-between text-[13px]"
              >
                <a
                  href={`/hotels/in/${c.citySlug}`}
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="color:var(--ui-primary)"
                >
                  {n.name}
                </a>
                <span style="color:var(--ui-text-muted)">
                  {n.count} hotel{n.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          class="p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <h3 class="text-sm font-bold" style="color:var(--ui-text)">
            Popular amenities
          </h3>
          <div class="mt-3 flex flex-wrap gap-1.5">
            {c.topAmenities.slice(0, 6).map((a) => (
              <span
                key={a.name}
                class="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Related cities                                                     */
/* ------------------------------------------------------------------ */

const RelatedCities = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Other top destinations
    </h2>
    <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
      Compare city hub pages — each one is indexable with transparent totals.
    </p>

    <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {SAMPLE_RELATED_CITIES.map((city) => (
        <a
          key={city.city}
          href={city.href}
          class="group flex flex-col gap-1 p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          {/* Mini city image concept */}
          <div
            class="mb-2 h-16 w-full overflow-hidden"
            style="background-image:var(--ui-hero);border-radius:var(--ui-radius-sm)"
            role="img"
            aria-hidden="true"
          />
          <span
            class="text-sm font-bold transition group-hover:underline"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            {city.city}
          </span>
          <span class="text-[12px]" style="color:var(--ui-text-muted)">
            {city.blurb}
          </span>
        </a>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Trust section                                                      */
/* ------------------------------------------------------------------ */

const TrustSection = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-8"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2
      class="text-xl font-bold"
      style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    >
      Why compare on Andacity
    </h2>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {[
        {
          icon: "◎",
          title: "Total price, up front",
          body: "Taxes and property fees are included in every price you compare — no checkout surprises.",
        },
        {
          icon: "✓",
          title: "Free cancellation, clearly marked",
          body: "When a rate is refundable, the exact deadline is shown on the card before you book.",
        },
        {
          icon: "❏",
          title: "Policies before payment",
          body: "Cancellation, payment timing, and fees are stated up front, not buried after you choose.",
        },
      ].map((t) => (
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
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
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
          Hotels in {c.city}
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          From ${c.priceFrom}/night
        </div>
      </div>
      <a
        href={`/hotels/in/${c.citySlug}`}
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        Search hotels
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
      aria-label={`${props.label} (presentational — use the date picker in production)`}
    >
      {props.placeholder}
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Sample page composition                                            */
/* ------------------------------------------------------------------ */

export const HotelsCitySample = component$(() => (
  <div
    style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)"
  >
    <CityHero />
    <FilterBar />
    <ResultsGrid />
    <NeighborhoodMap />
    <CityGuide />
    <RelatedCities />
    <TrustSection />

    {/* Spacer for mobile sticky CTA */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
