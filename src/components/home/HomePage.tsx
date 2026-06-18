/**
 * CLAUDE-UI-006 — Home page implementation: production composition.
 *
 * Promoted from the approved CLAUDE-UI-005 sample (src/components/dev/home/
 * HomeSample.tsx). Renders inside the production global shell
 * (SiteHeader/SiteFooter via src/routes/layout.tsx); this component is the
 * `/` route body. Built entirely on the `--ui-*` foundation + CLAUDE-UI-002
 * primitives so it re-skins across every palette + light/dark.
 *
 * Imagery: hero + editorial media use the palette's `--ui-hero` atmosphere
 * gradient as the placeholder treatment (approved direction — see
 * docs/ui-redesign/HOME_PAGE_IMPLEMENTATION.md "Photography/image strategy"
 * for the documented real-photo follow-up).
 */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { DestinationCard } from "~/components/ui/DestinationCard";
import { ResponsiveSection } from "~/components/ui/ResponsiveSection";
import { HomeSearchModule } from "~/components/home/HomeSearchModule";
import {
  HOME_DESTINATIONS,
  HOME_EDITORIAL,
  HOME_POPULAR_ROUTES,
  HOME_VALUE_PROPS,
  HOME_VERTICAL_ENTRIES,
} from "~/components/home/homeContent";
import { FOOTER_TRUST } from "~/components/site/siteNav";

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

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
          Flights · Hotels · Cars · Destinations
        </p>
        <h1
          class="mt-3 text-balance text-4xl font-bold leading-[1.05] md:text-6xl"
          style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
        >
          Your whole trip, beautifully simple.
        </h1>
        <p
          class="mt-4 max-w-[48ch] text-base md:text-lg"
          style="color:rgba(255,255,255,0.9)"
        >
          From a spark of inspiration to a booked itinerary — search every part
          of the journey in one calm, fast place.
        </p>
      </div>

      {/* One obvious search module */}
      <div class="mt-8 max-w-5xl">
        <HomeSearchModule id="global-search-entry" />
      </div>

      {/* Quiet trust row */}
      <ul class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        {FOOTER_TRUST.map((t) => (
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
/* Multi-vertical intent                                              */
/* ------------------------------------------------------------------ */

const VerticalEntries = component$(() => (
  <ResponsiveSection
    eyebrow="Start anywhere"
    title="Every part of the trip is a first-class start"
    description="Book transport, lock in a stay, reserve a car, or explore places before you commit."
  >
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_VERTICAL_ENTRIES.map((v) => (
        <a
          key={v.id}
          href={v.href}
          class="group flex flex-col overflow-hidden transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div
            class="relative h-24 overflow-hidden"
            style="background-image:var(--ui-hero)"
            aria-hidden="true"
          >
            <div
              class="absolute inset-0"
              style="background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.35))"
            />
          </div>
          <div class="flex flex-1 flex-col p-4">
            <h3
              class="text-base font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              {v.title}
            </h3>
            <p class="mt-1 text-[13px]" style="color:var(--ui-text-muted)">
              {v.description}
            </p>
            <span
              class="mt-3 text-[13px] font-semibold"
              style="color:var(--ui-primary)"
            >
              {v.cta} →
            </span>
          </div>
        </a>
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Destination discovery                                              */
/* ------------------------------------------------------------------ */

const Discovery = component$(() => (
  <ResponsiveSection
    eyebrow="Discover"
    title="Where to next"
    description="Start with a place, then branch into flights, stays, and cars."
  >
    <div q:slot="action">
      <Button
        variant="secondary"
        size="sm"
        href="/destinations"
        label="Browse all destinations"
      />
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_DESTINATIONS.map((d) => (
        <DestinationCard
          key={d.name}
          model={{ name: d.name, meta: d.meta, tag: d.tag, href: d.href }}
        />
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Popular routes                                                     */
/* ------------------------------------------------------------------ */

const PopularRoutes = component$(() => (
  <ResponsiveSection
    eyebrow="Popular right now"
    title="Routes travelers are searching"
    description="Jump into a fare search for a trending city pair."
  >
    <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {HOME_POPULAR_ROUTES.map((r) => (
        <a
          key={`${r.from}-${r.to}`}
          href={r.href}
          class="flex items-center justify-between gap-3 px-4 py-3 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <span
            class="flex min-w-0 items-center gap-2 text-sm font-semibold"
            style="color:var(--ui-text)"
          >
            <span class="truncate">{r.from}</span>
            <span aria-hidden="true" style="color:var(--ui-primary)">
              →
            </span>
            <span class="truncate">{r.to}</span>
          </span>
          <span
            class="shrink-0 text-[12px] font-medium"
            style="color:var(--ui-text-muted)"
          >
            View fares
          </span>
        </a>
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Price clarity (honest, illustrative — no live quotes)             */
/* ------------------------------------------------------------------ */

const PriceClarity = component$(() => (
  <ResponsiveSection container={false} class="mx-auto max-w-6xl px-4">
    <div
      class="grid gap-6 overflow-hidden p-6 md:grid-cols-2 md:items-center md:p-8"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-card)"
    >
      <div>
        <p
          class="text-[11px] font-bold uppercase tracking-[0.14em]"
          style="color:var(--ui-text-muted)"
        >
          Price clarity
        </p>
        <h2
          class="mt-1 text-2xl font-bold md:text-3xl"
          style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
        >
          Clarity, not pressure
        </h2>
        <p class="mt-2 text-sm md:text-base" style="color:var(--ui-text-muted)">
          We show the total price up front — taxes and fees included — and state
          cancellation terms before you book. No countdown timers, no “1 left!”
          nudges.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Badge tone="success" label="Total price up front" />
          <Badge tone="success" label="Taxes & fees included" />
          <Badge tone="neutral" label="Cancellation shown first" />
        </div>
      </div>

      {/* Illustrative price-range visual — explicitly not a live quote, and
          deliberately not tied to a specific real route to avoid implying
          live fare data for any particular city pair. */}
      <div class="rounded-2xl p-5" style="background:var(--ui-surface-muted)">
        <div class="flex items-baseline justify-between">
          <span
            class="text-[12px] font-semibold"
            style="color:var(--ui-text-secondary)"
          >
            Example round-trip price range
          </span>
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
          >
            Illustrative — not a live quote
          </span>
        </div>
        <div
          class="mt-4 h-2 w-full rounded-full"
          style="background:var(--ui-surface-strong)"
          aria-hidden="true"
        >
          <div
            class="h-2 rounded-full"
            style="width:62%;background:var(--ui-primary)"
          />
        </div>
        <div
          class="mt-2 flex justify-between text-[12px]"
          style="color:var(--ui-text-muted)"
        >
          <span>$420</span>
          <span style="color:var(--ui-price)">many trips land near $610</span>
          <span>$880</span>
        </div>
        <p class="mt-4 text-[11px]" style="color:var(--ui-text-muted)">
          Example only — not tied to a specific route. Real prices come from a
          live search.
        </p>
      </div>
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Why Andacity                                                       */
/* ------------------------------------------------------------------ */

const WhyAndacity = component$(() => (
  <ResponsiveSection
    eyebrow="Why Andacity"
    title="A calmer way to plan the whole trip"
  >
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_VALUE_PROPS.map((v) => (
        <div
          key={v.title}
          class="flex flex-col p-5"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <span
            class="grid size-9 place-items-center rounded-full text-base"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            {v.icon}
          </span>
          <h3
            class="mt-3 text-[15px] font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            {v.title}
          </h3>
          <p class="mt-1 text-[13px]" style="color:var(--ui-text-muted)">
            {v.body}
          </p>
        </div>
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Editorial inspiration                                              */
/* ------------------------------------------------------------------ */

const Editorial = component$(() => (
  <ResponsiveSection eyebrow="The Andacity edit" title="Inspiration, not noise">
    <div q:slot="action">
      <Button variant="ghost" size="sm" href="/explore" label="More stories" />
    </div>
    <div class="grid gap-3 md:grid-cols-3">
      {HOME_EDITORIAL.map((e, i) => (
        <a
          key={e.title}
          href={e.href}
          class={[
            "group relative flex flex-col justify-end overflow-hidden p-5 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
            i === 0
              ? "md:col-span-2 md:row-span-2 min-h-[18rem]"
              : "min-h-[12rem]",
          ]}
          style="border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-card)"
        >
          <span
            class="absolute inset-0"
            style="background-image:var(--ui-hero)"
            aria-hidden="true"
          />
          <span
            class="absolute inset-0"
            style="background:linear-gradient(180deg,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.66) 100%)"
            aria-hidden="true"
          />
          <span class="relative">
            <span
              class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
              style="background:rgba(255,255,255,0.18);color:#fff"
            >
              {e.kicker}
            </span>
            <span
              class={[
                "mt-2 block font-bold text-white",
                i === 0 ? "text-2xl md:text-3xl" : "text-lg",
              ]}
              style="font-family:'Lexend Variable',var(--system-font-family)"
            >
              {e.title}
            </span>
            <span class="mt-1 block max-w-[46ch] text-[13px] text-white/85">
              {e.excerpt}
            </span>
          </span>
        </a>
      ))}
    </div>
  </ResponsiveSection>
));

/* ------------------------------------------------------------------ */
/* Final CTA → footer handoff                                         */
/* ------------------------------------------------------------------ */

const FinalCta = component$(() => (
  <section class="mx-auto max-w-6xl px-4 pb-14 pt-2">
    <div
      class="relative isolate overflow-hidden px-6 py-12 text-center md:px-10 md:py-16"
      style="background-image:var(--ui-hero);border-radius:var(--ui-radius-lg)"
    >
      <div
        class="absolute inset-0 -z-10"
        style="background-image:var(--ui-hero-scrim)"
        aria-hidden="true"
      />
      <h2
        class="text-balance text-3xl font-bold md:text-4xl"
        style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
      >
        Ready when you are.
      </h2>
      <p
        class="mx-auto mt-3 max-w-[44ch] text-sm md:text-base"
        style="color:rgba(255,255,255,0.9)"
      >
        Start with a search or a little inspiration — Andacity keeps the whole
        trip together.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#global-search-entry"
          class="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-primary);color:var(--ui-on-primary)"
        >
          Start a search
        </a>
        <a
          href="/explore"
          class="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style="border:1px solid rgba(255,255,255,0.5)"
        >
          Explore destinations
        </a>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export const HomePage = component$(() => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <Hero />
    <VerticalEntries />
    <Discovery />
    <PopularRoutes />
    <PriceClarity />
    <WhyAndacity />
    <Editorial />
    <FinalCta />
  </div>
));
