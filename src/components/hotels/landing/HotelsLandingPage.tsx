/**
 * CLAUDE-UI-008 — Hotels landing page implementation: production composition.
 *
 * Promoted from the approved CLAUDE-UI-007 sample (src/components/dev/hotels/
 * HotelsSample.tsx). Renders inside the production global shell
 * (SiteHeader/SiteFooter via src/routes/layout.tsx); this component is the
 * `/hotels` route body. Built on the `--ui-*` foundation + CLAUDE-UI-002
 * primitives.
 *
 * Functional differences from the sample (all motivated by avoiding
 * unsupported claims on a live, indexable page):
 *   - The search module mounts the REAL HotelSearchCard (surface="plain",
 *     submitBehavior="canonical-route") instead of presentational fields.
 *   - The "results/filter preview" section renders REAL DB-backed top stays
 *     (DestinationTopStay[] from loadTopDestinationStaysFromDb) instead of
 *     fictional Lisbon properties. The section is omitted entirely if no
 *     real stays are available (graceful degradation, same pattern as the
 *     existing SearchEmptyState behavior).
 *   - The static map's price pins use the same real stay prices; their
 *     positions remain decorative/non-geocoded, so the panel keeps the
 *     "Map preview · concept" label rather than implying real geolocation.
 *   - "Popular hotel destinations" is the full DB-backed city list (the
 *     page's existing indexable internal-linking surface), restyled to
 *     `--ui-*` rather than replaced with a curated subset.
 *
 * Imagery: hero, featured-destination, and any stay without a real DB image
 * use the palette's `--ui-hero` gradient as a placeholder (see
 * docs/ui-redesign/HOTELS_LANDING_IMPLEMENTATION.md "Photography/image
 * strategy" for the documented real-photo follow-up).
 */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { DestinationCard } from "~/components/ui/DestinationCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { FilterRail } from "~/components/ui/FilterRail";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";
import {
  HOTELS_FEATURED_CITIES,
  HOTELS_FILTER_PREVIEW_GROUPS,
  HOTELS_HERO_TRUST,
  HOTELS_QUICK_FILTER_PREVIEW,
  HOTELS_SEARCH_SUGGESTIONS,
  HOTELS_TRUST,
} from "~/components/hotels/landing/hotelsLandingContent";
import { formatMoney } from "~/lib/pricing/price-display";
import type { DestinationTopStay } from "~/lib/queries/hotels-pages.server";
import type { HotelCity } from "~/data/hotel-cities";
import type { CanonicalLocation } from "~/types/location";

/** Existing demo fallback path the shared loader uses; it has no asset on
 * disk, so it's treated as "no real image" here rather than rendered. */
const NO_REAL_IMAGE_SENTINEL = "/img/demo/hotel-1.jpg";

type HotelsLandingPageProps = {
  cities: HotelCity[];
  featuredStays: DestinationTopStay[];
  search: {
    initialDestination: string;
    initialDestinationLocation: CanonicalLocation | null;
    initialCheckIn: string;
    initialCheckOut: string;
    initialGuests: string;
  };
};

/* ------------------------------------------------------------------ */
/* Hero + search module                                                */
/* ------------------------------------------------------------------ */

const Hero = component$(
  (props: { search: HotelsLandingPageProps["search"] }) => (
    <section
      class="relative isolate z-10"
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
          <div
            class="w-full text-left"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
          >
            <div class="p-3 md:p-4">
              <HotelSearchCard
                surface="plain"
                submitBehavior="canonical-route"
                initialDestination={props.search.initialDestination}
                initialDestinationLocation={
                  props.search.initialDestinationLocation
                }
                initialCheckIn={props.search.initialCheckIn}
                initialCheckOut={props.search.initialCheckOut}
                initialGuests={props.search.initialGuests}
              />
              <div class="mt-3 flex flex-wrap items-center gap-2 px-1">
                <span
                  class="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style="color:var(--ui-text-muted)"
                >
                  Popular
                </span>
                {HOTELS_SEARCH_SUGGESTIONS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    class="rounded-full px-3 py-1 text-[12px] font-medium transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ul class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {HOTELS_HERO_TRUST.map((t) => (
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
  ),
);

/* ------------------------------------------------------------------ */
/* Featured destinations (curated, no price/availability claims)      */
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

/* ------------------------------------------------------------------ */
/* Real-stay results/filter preview                                   */
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

const RatingPill = component$((props: { rating: number; count: number }) => (
  <span class="inline-flex items-center gap-1.5">
    <span
      class="grid place-items-center rounded-lg px-2 py-1 text-[12px] font-extrabold"
      style="background:var(--ui-primary);color:var(--ui-on-primary)"
    >
      {props.rating.toFixed(1)}
    </span>
    <span class="text-[12px]" style="color:var(--ui-text-secondary)">
      {props.count.toLocaleString("en-US")} reviews
    </span>
  </span>
));

const FeaturedStayRow = component$((props: { stay: DestinationTopStay }) => {
  const s = props.stay;
  const hasRealImage = Boolean(s.image) && s.image !== NO_REAL_IMAGE_SENTINEL;
  const href = `/hotels/${encodeURIComponent(s.slug)}`;
  const policyLine = s.badges[0];
  const secondaryBadge = s.badges[1];

  return (
    <article
      class="grid overflow-hidden sm:grid-cols-[200px_minmax(0,1fr)]"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <a
        href={href}
        class="relative block min-h-[9rem]"
        style={
          hasRealImage
            ? `background-image:url(${s.image});background-size:cover;background-position:center`
            : "background-image:var(--ui-hero)"
        }
        aria-label={`${s.name} photo`}
      />

      <div class="flex flex-col gap-3 p-4 md:flex-row md:items-stretch md:justify-between">
        <div class="min-w-0 flex-1">
          <StarRow stars={s.stars} />
          <h3
            class="mt-1 text-base font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            <a
              href={href}
              class="focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            >
              {s.name}
            </a>
          </h3>
          <p class="text-[12px]" style="color:var(--ui-text-muted)">
            {s.area}
          </p>
          <div class="mt-2">
            <RatingPill rating={s.rating} count={s.reviewCount} />
          </div>
          {policyLine ? (
            <p
              class="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium"
              style="color:var(--ui-success)"
            >
              <span aria-hidden="true">✓</span> {policyLine}
            </p>
          ) : null}
          {secondaryBadge ? (
            <div class="mt-1.5">
              <Badge tone="neutral" label={secondaryBadge} />
            </div>
          ) : null}
        </div>

        <div class="flex shrink-0 flex-col items-start justify-end gap-1 md:items-end md:text-right">
          <div
            class="text-lg font-extrabold leading-none"
            style="color:var(--ui-price)"
          >
            {formatMoney(s.from, s.currency)}
          </div>
          <div class="text-[11px]" style="color:var(--ui-text-muted)">
            per night
          </div>
          <Button
            variant="primary"
            size="sm"
            href={href}
            label="View stay"
            class="mt-2"
            ariaLabel={`View ${s.name}`}
          />
        </div>
      </div>
    </article>
  );
});

/** Decorative, non-geocoded pin positions. Prices shown are real (from the
 * same stays rendered in the list); positions are illustrative only, which
 * is why the panel keeps the "Map preview · concept" label. */
const MAP_PIN_POSITIONS = [
  { x: 32, y: 38 },
  { x: 58, y: 30 },
  { x: 46, y: 58 },
  { x: 71, y: 64 },
  { x: 24, y: 70 },
];

const MapPanel = component$(
  (props: { stays: DestinationTopStay[]; class?: string }) => (
    <div
      class={["relative overflow-hidden", props.class]}
      style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card);min-height:18rem"
      role="img"
      aria-label="Map preview concept showing illustrative pin positions with real sample prices — not a geocoded map"
    >
      <div
        class="absolute inset-0 opacity-60"
        aria-hidden="true"
        style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
      />

      {props.stays.slice(0, MAP_PIN_POSITIONS.length).map((stay, i) => (
        <span
          key={stay.id}
          class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] font-bold shadow-[var(--ui-shadow-card)]"
          style={`left:${MAP_PIN_POSITIONS[i].x}%;top:${MAP_PIN_POSITIONS[i].y}%;${
            i === 0
              ? "background:var(--ui-primary);color:var(--ui-on-primary)"
              : "background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
          }`}
          aria-hidden="true"
        >
          {formatMoney(stay.from, stay.currency)}
        </span>
      ))}

      <span
        class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
        style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
      >
        Map preview · concept
      </span>
    </div>
  ),
);

const ResultsPreview = component$((props: { stays: DestinationTopStay[] }) => {
  if (!props.stays.length) return null;

  return (
    <ResponsiveSection
      eyebrow="A taste of what you’ll see"
      title="Compare stays with calm, not clutter"
      description="A quiet preview of the search experience: filters that stay out of the way, scannable cards, and a map you can glance at."
    >
      <div class="flex flex-wrap items-center gap-2">
        {HOTELS_QUICK_FILTER_PREVIEW.map((label) => (
          <Badge key={label} tone="neutral" label={label} />
        ))}
        <span class="text-[11px]" style="color:var(--ui-text-muted)">
          Preview only — available once you start a search
        </span>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <FilterRail
          class="hidden lg:block lg:sticky lg:top-20"
          groups={HOTELS_FILTER_PREVIEW_GROUPS}
        />

        <div class="min-w-0">
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px] xl:items-start">
            <div class="flex flex-col gap-3">
              {props.stays.map((stay) => (
                <FeaturedStayRow key={stay.id} stay={stay} />
              ))}
              <p class="px-1 text-[11px]" style="color:var(--ui-text-muted)">
                Real top-rated stays from today’s listings — not a live search
                of a specific destination or dates. Search above for full
                results.
              </p>
            </div>

            <MapPanel stays={props.stays} class="xl:sticky xl:top-20" />
          </div>
        </div>
      </div>
    </ResponsiveSection>
  );
});

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
/* Popular hotel destinations — full DB-backed city grid              */
/* ------------------------------------------------------------------ */

const PopularDestinations = component$((props: { cities: HotelCity[] }) => (
  <ResponsiveSection
    eyebrow="Discover"
    title="Popular hotel destinations"
    description="Indexable city pages that support discovery, planning, and internal linking across the Hotels vertical."
  >
    {props.cities.length ? (
      <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {props.cities.map((c) => (
          <a
            key={c.slug}
            href={`/hotels/in/${c.slug}`}
            class="flex items-center justify-between gap-3 px-4 py-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
          >
            <span class="min-w-0">
              <span
                class="block text-sm font-bold"
                style="color:var(--ui-text)"
              >
                {c.city}
              </span>
              <span
                class="block text-[12px]"
                style="color:var(--ui-text-muted)"
              >
                From {formatMoney(c.priceFrom, "USD")}/night
                {c.topAmenities[0]?.name ? ` · ${c.topAmenities[0].name}` : ""}
              </span>
            </span>
            <span aria-hidden="true" style="color:var(--ui-primary)">
              →
            </span>
          </a>
        ))}
      </div>
    ) : (
      <EmptyState
        icon="🏨"
        title="No hotel cities are available right now"
        description="Try searching hotels directly while city pages are refreshed."
        primary={{ label: "Search hotels again", href: "/hotels" }}
        secondary={{ label: "Browse hotel cities", href: "/hotels/in" }}
      />
    )}
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const HotelsLandingPage = component$((props: HotelsLandingPageProps) => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <Hero search={props.search} />
    <FeaturedDestinations />
    <ResultsPreview stays={props.featuredStays} />
    <TrustClarity />
    <PopularDestinations cities={props.cities} />
  </div>
));
