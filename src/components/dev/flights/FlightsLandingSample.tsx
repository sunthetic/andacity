/**
 * CLAUDE-UI-013 — Flights landing page sample composition.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-flights). A premium,
 * flight-native landing page concept built on the `--ui-*` foundation +
 * CLAUDE-UI-002 primitives. Renders inside the production global shell
 * (SiteHeader/SiteFooter via the root layout); this component is only the page
 * body.
 *
 * The search module embeds the REAL production `FlightsSearchCard` (surface
 * "plain") inside a `--ui-*` frame, so the sample submits through the genuine
 * canonical flight search flow — no broken or fake submissions. Geolocation
 * auto-fill is disabled here to avoid a permission prompt in the preview.
 *
 * Everything else (popular routes, flexible-date strip, cabin comparison, fare
 * cards) is ILLUSTRATIVE — see flightsSampleData.ts. No live fares, no real
 * airline names, no availability or urgency claims. Popular-route tiles prefill
 * the real /flights form (from/to text only) and never auto-submit.
 *
 * It does NOT replace src/routes/flights/index.tsx.
 * See docs/ui-redesign/samples/FLIGHTS_SAMPLE.md for the approval gate.
 */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";
import { FlightCard } from "~/components/ui/FlightCard";
import { FlightsSearchCard } from "~/components/flights/search/FlightsSearchCard";
import {
  SAMPLE_POPULAR_ROUTES,
  SAMPLE_FLEX_WEEK,
  SAMPLE_FLEX_ENTRIES,
  SAMPLE_CABIN_COMPARISON,
  SAMPLE_FARE_CARDS,
  SAMPLE_TRIP_HANDOFF,
  sampleRouteHref,
  sampleRouteLabel,
} from "~/components/dev/flights/flightsSampleData";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* Flight hero + real search module                                   */
/* ------------------------------------------------------------------ */

const FlightHero = component$(() => (
  <section
    class="relative isolate overflow-hidden"
    style="background-image:var(--ui-hero)"
    aria-label="Flight search hero"
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
          <li aria-current="page" style="color:rgba(255,255,255,0.95)">Flights</li>
        </ol>
      </nav>

      <div class="max-w-[60ch]">
        <p
          class="text-[11px] font-bold uppercase tracking-[0.2em]"
          style="color:rgba(255,255,255,0.78)"
        >
          Flights
        </p>
        <h1
          class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
          style={`color:#fff;font-family:${HEADING_FONT}`}
        >
          Find your flight. Plan the whole trip.
        </h1>
        <p class="mt-3 max-w-[52ch] text-base" style="color:rgba(255,255,255,0.9)">
          Search routes, compare the trip clearly, and move from a single flight
          to your whole itinerary — without the clutter.
        </p>

        {/* Value pills — no fabricated stats, just real capabilities */}
        <div class="mt-4 flex flex-wrap gap-2">
          {["Round-trip & one-way", "Compare by total price", "Flexible date views"].map((label) => (
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

      {/* Search module — REAL FlightsSearchCard inside a --ui-* frame */}
      <div
        id="flight-search"
        class="mt-7 scroll-mt-24 p-4 md:p-5"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-sm font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
            Search flights
          </h2>
          <span class="text-[11px]" style="color:var(--ui-text-muted)">
            Live prices &amp; schedules appear after you search
          </span>
        </div>

        <div class="mt-3">
          <FlightsSearchCard surface="plain" autoResolveOriginLocation={false} />
        </div>
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Popular routes                                                     */
/* ------------------------------------------------------------------ */

const PopularRoutes = component$(() => (
  <section class="mx-auto max-w-6xl px-4 py-9">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
          Popular routes
        </h2>
        <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
          Tap a route to pre-fill the search — pick your dates and compare live options.
        </p>
      </div>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLE_POPULAR_ROUTES.map((route) => (
        <a
          key={sampleRouteLabel(route)}
          href={sampleRouteHref(route)}
          aria-label={`Search flights from ${route.fromCity} to ${route.toCity}`}
          class="group flex items-center justify-between gap-3 p-4 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold"
              style="background:var(--ui-accent-soft);color:var(--ui-accent)"
              aria-hidden="true"
            >
              ✈
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 text-sm font-bold" style="color:var(--ui-text)">
                <span>{route.fromCode}</span>
                <span aria-hidden="true" style="color:var(--ui-text-muted)">→</span>
                <span>{route.toCode}</span>
              </div>
              <div class="truncate text-[12px]" style="color:var(--ui-text-muted)">
                {route.fromCity} to {route.toCity}
              </div>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
          >
            {route.tag}
          </span>
        </a>
      ))}
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Flexible travel                                                    */
/* ------------------------------------------------------------------ */

const FlexibleTravel = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
      Flexible on dates?
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Shift your trip a few days and the picture can change. These views help you
      compare timing before you commit to exact dates.
    </p>

    <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      {/* Flexible-date strip — relative bars only, clearly illustrative */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold" style="color:var(--ui-text)">
            A week at a glance
          </h3>
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
          >
            Illustrative
          </span>
        </div>

        <div
          class="mt-4 grid h-40 items-end gap-2"
          style="grid-template-columns:repeat(7,minmax(0,1fr))"
          role="img"
          aria-label="Illustrative relative-fare bars for a sample week — lower bars suggest cheaper days. Not live prices."
        >
          {SAMPLE_FLEX_WEEK.map((cell) => {
            const isLow = cell.relative <= 0.4;
            return (
              <div key={cell.day} class="flex h-full flex-col items-center justify-end gap-1.5">
                <div
                  class="w-full rounded-t-md"
                  style={`height:${Math.round(cell.relative * 100)}%;${
                    isLow
                      ? "background:var(--ui-primary)"
                      : "background:color-mix(in srgb, var(--ui-primary) 24%, transparent)"
                  }`}
                  aria-hidden="true"
                />
                <span class="text-[11px] font-medium" style="color:var(--ui-text-muted)">
                  {cell.day}
                </span>
              </div>
            );
          })}
        </div>
        <p class="mt-3 text-[11px]" style="color:var(--ui-text-muted)">
          Relative shape only — no amounts shown. Real fare trends load from a live
          search.
        </p>
      </div>

      {/* Flexible entry concepts */}
      <div class="flex flex-col gap-3">
        {SAMPLE_FLEX_ENTRIES.map((entry) => (
          <a
            key={entry.label}
            href="/flights"
            class="group flex items-center justify-between gap-3 p-4 transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
          >
            <div>
              <div class="text-sm font-bold" style="color:var(--ui-text)">
                {entry.label}
              </div>
              <div class="text-[12px]" style="color:var(--ui-text-muted)">
                {entry.hint}
              </div>
            </div>
            <span
              class="text-[13px] transition group-hover:translate-x-0.5"
              style="color:var(--ui-text-muted)"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
));

/* ------------------------------------------------------------------ */
/* Fare clarity / comparison concept                                  */
/* ------------------------------------------------------------------ */

const FareClarity = component$(() => (
  <section
    class="mx-auto max-w-6xl px-4 py-9"
    style="border-top:1px solid var(--ui-divider)"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold" style={`color:var(--ui-text);font-family:${HEADING_FONT}`}>
          Compare the whole price, not just the headline
        </h2>
        <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
          Every option shows the total you pay — taxes and carrier fees included —
          so cabins and times compare on equal footing.
        </p>
      </div>
      <span
        class="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
        style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
      >
        Illustrative
      </span>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      {/* Cabin comparison — relative bars, no axis values */}
      <div
        class="p-4"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <h3 class="text-sm font-bold" style="color:var(--ui-text)">
          Cabins, side by side
        </h3>
        <div class="mt-4 flex flex-col gap-3">
          {SAMPLE_CABIN_COMPARISON.map((row) => (
            <div key={row.cabin}>
              <div class="flex items-center justify-between text-[12px]">
                <span class="font-semibold" style="color:var(--ui-text)">{row.cabin}</span>
                <span style="color:var(--ui-text-muted)">{row.note}</span>
              </div>
              <div
                class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full"
                style="background:var(--ui-surface-muted)"
                aria-hidden="true"
              >
                <div
                  class="h-full rounded-full"
                  style={`width:${Math.round(row.relative * 100)}%;background:var(--ui-primary)`}
                />
              </div>
            </div>
          ))}
        </div>
        <p class="mt-4 text-[11px]" style="color:var(--ui-text-muted)">
          Bars show the typical gap between cabins, not real prices.
        </p>
      </div>

      {/* Illustrative fare cards using the FlightCard primitive */}
      <div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SAMPLE_FARE_CARDS.map((fare) => (
            <FlightCard
              key={fare.airline}
              model={{
                airline: fare.airline,
                duration: fare.duration,
                stops: fare.stops,
                departTime: fare.departTime,
                departCode: fare.departCode,
                arriveTime: fare.arriveTime,
                arriveCode: fare.arriveCode,
                price: fare.price,
                priceQualifier: fare.priceQualifier,
                href: "#flight-search",
              }}
            />
          ))}
        </div>
        <p class="mt-3 text-[11px]" style="color:var(--ui-text-muted)">
          Sample carriers and prices for layout only — not live fares, schedules,
          or airline partnerships. Real results come from a live search.
        </p>
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
      Got the flight? Build the rest.
    </h2>
    <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
      Flights are the start. Add a stay, a car, and a plan — all in one place.
    </p>

    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      {SAMPLE_TRIP_HANDOFF.map((item) => (
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
          body: "Taxes and carrier fees are in the price you compare — the number you see is the number you pay.",
        },
        {
          icon: "✓",
          title: "Change rules, clearly marked",
          body: "When a fare allows changes or refunds, the terms are shown before you book, not after.",
        },
        {
          icon: "❏",
          title: "No surprise fees at checkout",
          body: "What's included — and what's extra — is stated up front, so there are no late add-ons.",
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
          Find your flight
        </div>
        <div class="text-[12px]" style="color:var(--ui-text-muted)">
          Round-trip &amp; one-way
        </div>
      </div>
      <a
        href="#flight-search"
        class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
        style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
      >
        Search flights
      </a>
    </div>
  </div>
));

/* ------------------------------------------------------------------ */
/* Page composition                                                   */
/* ------------------------------------------------------------------ */

export const FlightsLandingSample = component$(() => (
  <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">
    <FlightHero />
    <PopularRoutes />
    <FlexibleTravel />
    <FareClarity />
    <WholeTripHandoff />
    <TrustSection />

    {/* Spacer for mobile sticky CTA */}
    <div class="h-20 lg:hidden" />
    <MobileStickyCta />
  </div>
));
