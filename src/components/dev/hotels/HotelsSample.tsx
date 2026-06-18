/**
 * CLAUDE-UI-007 — Hotels landing page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-hotels). A premium, calm,
 * photography-first, search-forward hotels landing concept built entirely on
 * the `--ui-*` foundation + CLAUDE-UI-002 primitives. Renders inside the
 * production global shell (SiteHeader/SiteFooter via the root layout); this
 * component is only the page body. It does NOT replace src/routes/hotels/index.tsx.
 *
 * Imagery: hero, featured, and result media use the palette's `--ui-hero`
 * gradient as a safe local stand-in (no remote image dependency). See
 * docs/ui-redesign/samples/HOTELS_SAMPLE.md for the real-photo plan.
 */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { DestinationCard } from "~/components/ui/DestinationCard";
import { FilterRail } from "~/components/ui/FilterRail";
import { HotelCard } from "~/components/ui/HotelCard";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { ResultToolbar } from "~/components/ui/ResultToolbar";
import { HotelsSearchModule } from "~/components/dev/hotels/HotelsSearchModule";
import {
  HOTELS_FEATURED_CITIES,
  HOTELS_FEATURED_STAYS,
  HOTELS_FILTER_GROUPS,
  HOTELS_MAP_PINS,
  HOTELS_POPULAR_DESTINATIONS,
  HOTELS_QUICK_FILTERS,
  HOTELS_SAMPLE_RESULTS,
  HOTELS_TRUST,
  type SampleHotelResult,
} from "~/components/dev/hotels/hotelsSampleData";

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

const HERO_TRUST = [
  "Total price up front",
  "Free cancellation marked",
  "Policies before payment",
];

const Hero = component$(() => (
  <section
    class="relative isolate overflow-hidden"
    style="background-image:var(--ui-hero)"
  >
    <div
      class="absolute inset-0 -z-10"
      style="background-image:var(--ui-hero-scrim)"
      aria-hidden="true"
    />
    <div class="mx-auto max-w-6xl px-4 pt-14 pb-10 md:px-6 md:pt-20 md:pb-14">
      <div class="max-w-2xl">
        <p
          class="text-[11px] font-bold uppercase tracking-[0.2em]"
          style="color:rgba(255,255,255,0.82)"
        >
          Hotels
        </p>
        <h1
          class="mt-3 text-balance text-4xl font-bold leading-[1.05] md:text-6xl"
          style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
        >
          Find a stay you’ll look forward to.
        </h1>
        <p
          class="mt-4 max-w-[50ch] text-base md:text-lg"
          style="color:rgba(255,255,255,0.9)"
        >
          Search by destination, dates, and guests — then compare calmly, with
          clear policies and total prices up front.
        </p>
      </div>

      <div class="mt-8 max-w-5xl">
        <HotelsSearchModule id="hotels-search-entry" />
      </div>

      <ul class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {HERO_TRUST.map((t) => (
          <li
            key={t}
            class="flex items-center gap-1.5 text-[12px] md:text-[13px]"
            style="color:rgba(255,255,255,0.88)"
          >
            <span aria-hidden="true" style="color:rgba(255,255,255,0.95)">
              ✓
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Featured destinations + stays                                      */
/* ------------------------------------------------------------------ */

const FeaturedDestinations = component$(() => (
  <ResponsiveSection
    eyebrow="Where to stay"
    title="Featured hotel destinations"
    description="Start with a city hub, then narrow by neighborhood, dates, and budget."
  >
    <div q:slot="action">
      <Button
        variant="secondary"
        size="sm"
        href="/hotels/in"
        label="All hotel cities"
      />
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {HOTELS_FEATURED_CITIES.map((c) => (
        <DestinationCard
          key={c.name}
          model={{ name: c.name, meta: c.meta, tag: c.tag, href: c.href }}
        />
      ))}
    </div>
  </ResponsiveSection>
));

const FeaturedStays = component$(() => (
  <ResponsiveSection
    eyebrow="Inspiration"
    title="Stays travelers love this week"
    description="A calm shortlist to spark ideas — open any city to see live options."
  >
    <div q:slot="action">
      <span
        class="rounded-full px-2.5 py-1 text-[10px] font-bold"
        style="background:var(--ui-accent-soft);color:var(--ui-accent)"
      >
        Sample rates · illustrative
      </span>
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {HOTELS_FEATURED_STAYS.map((stay) => (
        <HotelCard key={stay.name} model={stay} />
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Results experience: toolbar + filters + list + map                 */
/* ------------------------------------------------------------------ */

const StarRow = component$((props: { stars: number }) => (
  <span
    class="text-[12px]"
    style="color:var(--ui-accent)"
    aria-label={`${props.stars} star`}
  >
    {"★".repeat(props.stars)}
  </span>
));

const RatingPill = component$(
  (props: { rating: number; label: string; count: number }) => (
    <span class="inline-flex items-center gap-1.5">
      <span
        class="grid place-items-center rounded-lg px-2 py-1 text-[12px] font-extrabold"
        style="background:var(--ui-primary);color:var(--ui-on-primary)"
      >
        {props.rating.toFixed(1)}
      </span>
      <span class="text-[12px]" style="color:var(--ui-text-secondary)">
        <span class="font-semibold" style="color:var(--ui-text)">
          {props.label}
        </span>
        {" · "}
        {props.count.toLocaleString("en-US")} reviews
      </span>
    </span>
  ),
);

const SampleResultRow = component$((props: { model: SampleHotelResult }) => {
  const m = props.model;
  return (
    <article
      class="grid overflow-hidden sm:grid-cols-[200px_minmax(0,1fr)]"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      {/* Media */}
      <a
        href={m.href}
        class="relative block min-h-[9rem]"
        style="background-image:var(--ui-hero)"
        aria-label={`${m.name} photos`}
      >
        {m.badge ? (
          <span
            class="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style="background:var(--ui-accent);color:#15110a"
          >
            {m.badge}
          </span>
        ) : null}
      </a>

      {/* Body */}
      <div class="flex flex-col gap-3 p-4 md:flex-row md:items-stretch md:justify-between">
        <div class="min-w-0 flex-1">
          <StarRow stars={m.stars} />
          <h3
            class="mt-1 text-base font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            <a
              href={m.href}
              class="focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            >
              {m.name}
            </a>
          </h3>
          <p class="text-[12px]" style="color:var(--ui-text-muted)">
            {m.area}
          </p>
          <div class="mt-2">
            <RatingPill
              rating={m.rating}
              label={m.reviewLabel}
              count={m.reviewCount}
            />
          </div>
          <p class="mt-2 text-[12px]" style="color:var(--ui-text-secondary)">
            {m.amenities.join(" · ")}
          </p>
          <p
            class="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium"
            style="color:var(--ui-success)"
          >
            <span aria-hidden="true">✓</span> {m.policy}
          </p>
        </div>

        {/* Price + action */}
        <div class="flex shrink-0 flex-col items-start justify-end gap-1 md:items-end md:text-right">
          <div
            class="text-lg font-extrabold leading-none"
            style="color:var(--ui-price)"
          >
            {m.priceFrom}
          </div>
          <div class="text-[11px]" style="color:var(--ui-text-muted)">
            {m.priceQualifier}
          </div>
          <Button
            variant="primary"
            size="sm"
            href={m.href}
            label="View stay"
            class="mt-2"
            ariaLabel={`View ${m.name}`}
          />
        </div>
      </div>
    </article>
  );
});

const MapPanel = component$((props: { class?: string }) => (
  <div
    class={["relative overflow-hidden", props.class]}
    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card);min-height:18rem"
    role="img"
    aria-label="Map preview showing approximate hotel locations and sample prices (concept)"
  >
    {/* Faux street grid */}
    <div
      class="absolute inset-0 opacity-60"
      aria-hidden="true"
      style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
    />
    <div
      class="absolute inset-0"
      aria-hidden="true"
      style="background:radial-gradient(120% 80% at 30% 20%,transparent,rgba(0,0,0,0.06))"
    />

    {HOTELS_MAP_PINS.map((pin) => (
      <span
        key={`${pin.x}-${pin.y}`}
        class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] font-bold shadow-[var(--ui-shadow-card)]"
        style={`left:${pin.x}%;top:${pin.y}%;${
          pin.active
            ? "background:var(--ui-primary);color:var(--ui-on-primary)"
            : "background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
        }`}
        aria-hidden="true"
      >
        {pin.price}
      </span>
    ))}

    <span
      class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
      style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
    >
      Map preview · concept
    </span>
  </div>
));

const ResultsExperience = component$(() => (
  <ResponsiveSection
    eyebrow="The search experience"
    title="Compare stays with calm, not clutter"
    description="A quiet results layout: filters that stay out of the way, scannable cards, and a map you can glance at — built to feel simpler than Expedia or Booking.com."
  >
    {/* Quick filter chips */}
    <div class="flex flex-wrap gap-2">
      {HOTELS_QUICK_FILTERS.map((chip, i) => (
        <button
          key={chip}
          type="button"
          aria-pressed={i === 0}
          class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style={
            i === 0
              ? "background:var(--ui-primary);color:var(--ui-on-primary)"
              : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
          }
        >
          {chip}
        </button>
      ))}
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      {/* Filter rail — desktop; production collapses to a drawer on mobile */}
      <FilterRail
        class="hidden lg:block lg:sticky lg:top-20"
        priceLabel="Price per night · up to $300"
        priceFill={0.62}
        groups={HOTELS_FILTER_GROUPS}
      />

      <div class="min-w-0">
        <ResultToolbar
          resultCount="248 stays in Lisbon"
          sortLabel="Best value"
          activeChips={["Free cancellation", "Very good 8+"]}
          showFiltersButton
        />

        <div class="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-start">
          <div class="flex flex-col gap-3">
            {HOTELS_SAMPLE_RESULTS.map((r) => (
              <SampleResultRow key={r.name} model={r} />
            ))}
            <p class="px-1 text-[11px]" style="color:var(--ui-text-muted)">
              Sample results for illustration only — real availability and
              prices come from a live search.
            </p>
          </div>

          <MapPanel class="xl:sticky xl:top-20" />
        </div>
      </div>
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Trust / policy clarity                                             */
/* ------------------------------------------------------------------ */

const TrustClarity = component$(() => (
  <ResponsiveSection container={false} class="mx-auto max-w-6xl px-4">
    <div
      class="overflow-hidden p-6 md:p-8"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-card)"
    >
      <p
        class="text-[11px] font-bold uppercase tracking-[0.14em]"
        style="color:var(--ui-text-muted)"
      >
        Book with confidence
      </p>
      <h2
        class="mt-1 text-2xl font-bold md:text-3xl"
        style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
      >
        Clear policies, calm pricing
      </h2>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        {HOTELS_TRUST.map((t) => (
          <div
            key={t.title}
            class="flex flex-col p-4"
            style="background:var(--ui-surface-muted);border-radius:var(--ui-radius)"
          >
            <span
              class="grid size-9 place-items-center rounded-full text-base"
              style="background:var(--ui-accent-soft);color:var(--ui-accent)"
              aria-hidden="true"
            >
              {t.icon}
            </span>
            <h3
              class="mt-3 text-[15px] font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              {t.title}
            </h3>
            <p class="mt-1 text-[13px]" style="color:var(--ui-text-muted)">
              {t.body}
            </p>
          </div>
        ))}
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <Badge tone="success" label="Taxes & fees included" />
        <Badge tone="neutral" label="No countdown timers" />
        <Badge tone="neutral" label="No “1 room left!” pressure" />
      </div>
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Popular destinations grid                                          */
/* ------------------------------------------------------------------ */

const PopularDestinations = component$(() => (
  <ResponsiveSection eyebrow="Discover" title="Popular hotel destinations">
    <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {HOTELS_POPULAR_DESTINATIONS.map((d) => (
        <a
          key={d.city}
          href={d.href}
          class="flex items-center justify-between gap-3 px-4 py-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <span class="min-w-0">
            <span class="block text-sm font-bold" style="color:var(--ui-text)">
              {d.city}
            </span>
            <span class="block text-[12px]" style="color:var(--ui-text-muted)">
              {d.blurb}
            </span>
          </span>
          <span aria-hidden="true" style="color:var(--ui-primary)">
            →
          </span>
        </a>
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export const HotelsSample = component$(() => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <Hero />
    <FeaturedDestinations />
    <ResultsExperience />
    <FeaturedStays />
    <TrustClarity />
    <PopularDestinations />
  </div>
));
