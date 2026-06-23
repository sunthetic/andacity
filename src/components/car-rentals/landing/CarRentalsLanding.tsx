/**
 * CLAUDE-UI-018 — Car rentals landing page (production).
 *
 * Premium, mobility-native /car-rentals landing built on the `--ui-*` system,
 * promoted from the CLAUDE-UI-017 sample. Renders inside the production global
 * shell (SiteHeader/SiteFooter via the root layout) — this component is only
 * the page body and intentionally does NOT add its own <main>.
 *
 * The real car rental search is injected via the `searchCard` prop (the route
 * wires the genuine CarRentalSearchCard with loader-prefilled values), so
 * submissions follow the real canonical car-rental search flow. The card's inner
 * controls keep their existing styling (shared with home/city pages); this
 * component supplies the `--ui-*` frame around it. See
 * docs/ui-redesign/CARS_LANDING_IMPLEMENTATION.md.
 *
 * All non-search content is static and fabrication-free
 * (carRentalsLandingData.ts): vehicle classes are structural only (no prices, no
 * inventory, no supplier names), airport tiles prefill the real form, city tiles
 * link to real /car-rentals/in/{slug} pages, and policy clarity uses conditional
 * phrasing throughout. No fake urgency, scarcity, insurance guarantees, unlimited-
 * mileage claims, or shuttle claims appear anywhere.
 */
import { component$, type JSXOutput } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";
import {
  VEHICLE_CLASSES,
  AIRPORT_PICKUP_TILES,
  CITY_PICKUP_TILES,
  COMPARE_ESSENTIALS,
  POLICY_CLARITY,
  CAR_TRIP_HANDOFF,
} from "~/components/car-rentals/landing/carRentalsLandingData";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* Car glyph (inline SVG — no remote images, no map tiles)            */
/* ------------------------------------------------------------------ */

const CarGlyph = component$(() => (
  <svg viewBox="0 0 48 24" width="44" height="22" aria-hidden="true">
    <path
      d="M4 16l2-6a4 4 0 0 1 3.7-2.6h11.2a4 4 0 0 1 3.3 1.8L31 14l9 1.6a3 3 0 0 1 2.5 3V20h-4M4 16v4h4M4 16h28M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm22 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      fill="none"
      stroke="var(--ui-accent)"
      stroke-width="1.6"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
));

/* ------------------------------------------------------------------ */
/* Hero + real search module                                          */
/* ------------------------------------------------------------------ */

const CarsHero = component$((props: { searchCard: JSXOutput }) => (
  <section
    class="relative isolate z-10"
    style="background-image:var(--ui-hero)"
    aria-label="Car rental search"
  >
    <div
      class="absolute inset-0 -z-10"
      style="background-image:var(--ui-hero-scrim)"
      aria-hidden="true"
    />

    <div class="mx-auto max-w-6xl px-4 pt-10 pb-9 md:pt-14 md:pb-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" class="mb-4">
        <ol class="flex flex-wrap items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.72)">
          <li class="flex items-center gap-2">
            <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Home</a>
            <span aria-hidden="true">/</span>
          </li>
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">Car Rentals</li>
        </ol>
      </nav>

      <div class="max-w-[60ch]">
        <p
          class="text-[11px] font-bold uppercase tracking-[0.2em]"
          style="color:rgba(255,255,255,0.78)"
        >
          Car Rentals
        </p>
        <h1
          class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
          style={`color:#fff;font-family:${HEADING_FONT}`}
        >
          Pick up the right car for the trip
        </h1>
        <p class="mt-3 max-w-[52ch] text-base" style="color:rgba(255,255,255,0.9)">
          Search airport and city pickups, set your dates, and compare the
          essentials clearly — then keep the rest of the journey connected.
        </p>

        {/* Value pills — real capabilities only, no fabricated stats */}
        <div class="mt-4 flex flex-wrap gap-2">
          {["Airport & city pickup", "Pickup & dropoff dates", "1–4 drivers"].map((label) => (
            <span
              key={label}
              class="rounded-full px-3 py-1 text-[12px] font-semibold"
              style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.26)"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Search module — REAL CarRentalSearchCard (injected) inside a --ui-* frame */}
      <div
        id="car-search"
        class="mt-7 scroll-mt-24 p-4 md:p-5"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
            Search car rentals
          </h2>
          <span class="text-[11px]" style="color:var(--ui-text-muted)">
            Live rates &amp; availability appear after you search
          </span>
        </div>

        <div class="mt-3">{props.searchCard}</div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Vehicle classes — structural only, no prices                       */
/* ------------------------------------------------------------------ */

const VehicleClasses = component$(() => (
  <section class="mx-auto max-w-6xl px-4 py-9">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
          Find the right class
        </h2>
        <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
          Pick a class to pre-fill the search — then compare live vehicles, rates,
          and pickup points for your dates.
        </p>
      </div>
    </div>

    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {VEHICLE_CLASSES.map((vehicle) => (
        <a
          key={vehicle.name}
          href={vehicle.href}
          aria-label={`Search ${vehicle.name} car rentals`}
          class="group flex flex-col p-4 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
              {vehicle.name}
            </h3>
            <span
              class="grid size-10 shrink-0 place-items-center rounded-full"
              style="background:var(--ui-accent-soft)"
            >
              <CarGlyph />
            </span>
          </div>
          <p class="mt-2 text-[13px]" style="color:var(--ui-text-muted)">
            {vehicle.blurb}
          </p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            {[vehicle.seats, vehicle.bags, vehicle.transmission].map((trait) => (
              <span
                key={trait}
                class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
              >
                {trait}
              </span>
            ))}
          </div>
          <div
            class="mt-3 flex items-center gap-1 text-[12px] font-semibold"
            style="color:var(--ui-primary)"
          >
            Search this class
            <span class="transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </div>
        </a>
      ))}
    </div>
    <p class="mt-3 text-[11px]" style="color:var(--ui-text-muted)">
      Seats, bags, and transmission describe each class in general — exact vehicles
      and rates come from a live search. No prices shown.
    </p>
  </section>
));

/* ------------------------------------------------------------------ */
/* Airport & city pickup                                              */
/* ------------------------------------------------------------------ */

const PickupLocations = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
      Pick up where it suits the trip
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Start at the airport on arrival, or from a city desk closer to your stay.
    </p>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      {/* Airport pickup — prefills the real search form */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          Airport pickup
        </h3>
        <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
          Tap an airport to pre-fill the search — pickup options load from a live search.
        </p>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          {AIRPORT_PICKUP_TILES.map((airport) => (
            <a
              key={airport.code}
              href={airport.href}
              aria-label={`Search car rentals near ${airport.city}`}
              class="group flex items-center gap-2.5 p-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius-sm)"
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                aria-hidden="true"
              >
                {airport.code}
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-bold" style="color:var(--ui-text)">{airport.city}</span>
                <span class="block text-[11px]" style="color:var(--ui-text-muted)">{airport.code} pickup</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* City pickup — links to real /car-rentals/in/{slug} pages */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          Browse by city
        </h3>
        <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
          Explore a city guide for pickups, neighbourhoods, and road-trip ideas.
        </p>
        <div class="mt-3 flex flex-col gap-2">
          {CITY_PICKUP_TILES.map((city) => (
            <a
              key={city.slug}
              href={`/car-rentals/in/${city.slug}`}
              class="group flex items-center justify-between gap-3 p-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius-sm)"
            >
              <span class="min-w-0">
                <span class="block text-sm font-bold" style="color:var(--ui-text)">{city.name}</span>
                <span class="block text-[11px]" style="color:var(--ui-text-muted)">{city.note}</span>
              </span>
              <span
                class="text-[13px] transition group-hover:translate-x-0.5"
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
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Comparison essentials + policy clarity                             */
/* ------------------------------------------------------------------ */

const ComparisonAndPolicy = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <div class="max-w-[60ch]">
      <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
        Compare the essentials, not the noise
      </h2>
      <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
        Every vehicle is easy to read on the things that matter — so classes and
        pickups compare on equal footing.
      </p>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      {/* Comparison essentials — guidance labels, not fabricated data */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          What you'll compare on each rate
        </h3>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          {COMPARE_ESSENTIALS.map((item) => (
            <div key={item.label} class="flex items-start gap-2.5">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full text-[14px]"
                style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <div>
                <div class="text-sm font-semibold" style="color:var(--ui-text)">{item.label}</div>
                <div class="text-[12px]" style="color:var(--ui-text-muted)">{item.hint}</div>
              </div>
            </div>
          ))}
        </div>
        <div class="mt-5">
          <Button
            variant="secondary"
            size="sm"
            label="Start a car search"
            href="#car-search"
            ariaLabel="Start a car rental search"
          />
        </div>
      </div>

      {/* Policy clarity — honest, conditional phrasing */}
      <div class="flex flex-col gap-3">
        {POLICY_CLARITY.map((policy) => (
          <div
            key={policy.title}
            class="p-4"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
          >
            <div class="flex items-center gap-2.5">
              <span
                class="grid size-8 shrink-0 place-items-center rounded-full text-[14px]"
                style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                aria-hidden="true"
              >
                {policy.icon}
              </span>
              <h3 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
                {policy.title}
              </h3>
            </div>
            <p class="mt-2 text-[13px]" style="color:var(--ui-text-muted)">
              {policy.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Whole-trip handoff                                                 */
/* ------------------------------------------------------------------ */

const WholeTripHandoff = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
      Got the car? Connect the trip.
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Line up your flight, your stay, and your plans — all in one place.
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {CAR_TRIP_HANDOFF.map((item) => (
        <div
          key={item.title}
          class="flex flex-col p-4"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div
            class="mb-3 h-20 w-full overflow-hidden"
            style="background-image:var(--ui-hero);border-radius:var(--ui-radius-sm)"
            role="img"
            aria-hidden="true"
          />
          <h3 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
            {item.title}
          </h3>
          <p class="mt-1.5 flex-1 text-[13px]" style="color:var(--ui-text-muted)">
            {item.body}
          </p>
          <div class="mt-3">
            <Button
              variant="secondary"
              size="sm"
              label={item.cta}
              href={item.href}
              ariaLabel={item.cta}
            />
          </div>
        </div>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Trust / conversion                                                 */
/* ------------------------------------------------------------------ */

const TrustSection = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
      Booking you can read
    </h2>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {[
        {
          icon: "◎",
          title: "Total price, up front",
          body: "Taxes and mandatory fees are in the total you compare — the number you see is the number you pay.",
        },
        {
          icon: "✓",
          title: "Policies before you book",
          body: "Cancellation, mileage, and fuel terms are shown on each rate, not after you've paid.",
        },
        {
          icon: "❏",
          title: "No surprise add-ons",
          body: "What's included — and what's optional — is stated clearly, so there are no late counter charges.",
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
          <h3 class="mt-3 text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
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
          Find your car
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          Airport &amp; city pickup
        </div>
      </div>
      <a
        href="#car-search"
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        Search cars
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Page composition                                                   */
/* ------------------------------------------------------------------ */

export const CarRentalsLanding = component$((props: { searchCard: JSXOutput }) => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <CarsHero searchCard={props.searchCard} />
    <VehicleClasses />
    <PickupLocations />
    <ComparisonAndPolicy />
    <WholeTripHandoff />
    <TrustSection />

    {/* Spacer for mobile sticky CTA */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
