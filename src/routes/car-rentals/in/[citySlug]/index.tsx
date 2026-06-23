/**
 * CLAUDE-UI-020 — production car-rentals-by-city page.
 *
 * Promotes the CLAUDE-UI-019 direction into production, following the same
 * inline-component pattern established by CLAUDE-UI-012 (hotels-by-city).
 *
 * Preserved exactly from the previous implementation:
 *  - useCityCarRentals loader (city, paged results, facets, sort, pagination)
 *  - CarRentalsResultsAdapter (full sort/filter/pagination/save/compare/refresh)
 *  - head metadata, canonical, BreadcrumbList + ItemList JSON-LD
 *  - buildCityHref / buildCarRentalDetailHref
 *  - parseRentalParams / clampMaybeInt
 *
 * Changed:
 *  - Page shell: `Page` component replaced with `--ui-*` system (no new <main>)
 *  - Hero: `--ui-hero` band, breadcrumb, single H1, real CarRentalSearchCard
 *    (surface="plain" inside a --ui-* panel; inner controls preserved as-is)
 *  - Filler cards ("Why book here / Popular searches") removed
 *  - "SEO payload" placeholder copy removed; replaced with real driving context
 *  - Added: CSS-only pickup-area concept, trust/policy clarity, related cities,
 *    whole-trip handoff, mobile sticky CTA
 *  - head description updated from developer/SEO copy to traveller copy
 */
import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CarRentalsResultsAdapter } from "~/components/car-rentals/CarRentalsResultsAdapter";
import { CarRentalSearchCard } from "~/components/car-rentals/CarRentalSearchCard";
import { normalizeIsoDate } from "~/lib/date/validateDate";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { loadCarRentalCityBySlugFromDb } from "~/lib/queries/car-rentals-pages.server";
import {
  loadCarRentalResultsPageFromDb,
  toCarRentalsSearchStateFilters,
} from "~/lib/queries/car-rentals-search.server";

export const useCityCarRentals = routeLoader$(
  async ({ params, url, error }) => {
    const citySlug = String(params.citySlug || "")
      .trim()
      .toLowerCase();
    const active = parseRentalParams(url.searchParams);
    const city = await loadCarRentalCityBySlugFromDb(citySlug);
    if (!city) throw error(404, "Not found");

    const searchState = searchStateFromUrl(url, {
      query: city.name,
      location: { city: city.name },
      dates: {
        checkIn: active.pickupDate || undefined,
        checkOut: active.dropoffDate || undefined,
      },
      sort: "recommended",
      page: 1,
    });
    searchState.query = city.name;
    searchState.location = {
      ...(searchState.location || {}),
      city: city.name,
    };

    const source = await loadCarRentalResultsPageFromDb({
      citySlug,
      query: city.name,
      pickupDate: active.pickupDate,
      dropoffDate: active.dropoffDate,
      sort: String(searchState.sort || "recommended"),
      page: searchState.page || 1,
      pageSize: 6,
      filters: (searchState.filters || {}) as Record<string, unknown>,
    });

    searchState.page = source.page;
    searchState.sort = source.activeSort;
    searchState.filters = toCarRentalsSearchStateFilters(
      source.selectedFilters,
      (searchState.filters || {}) as Record<string, unknown>,
    );

    return {
      citySlug,
      city,
      page: source.page,
      items: source.results.map((result) => ({
        slug: result.slug,
        name: result.name,
      })),
      results: source.results,
      totalCount: source.totalCount,
      totalPages: source.totalPages,
      activeSort: source.activeSort,
      selectedFilters: source.selectedFilters,
      facets: source.facets,
      searchState,
      active,
    };
  },
);

/* ------------------------------------------------------------------ */
/* Static module-level constants                                      */
/* ------------------------------------------------------------------ */

const KNOWN_RENTAL_CITIES = [
  { city: "Las Vegas", blurb: "Strip & airport pickups", href: "/car-rentals/in/las-vegas" },
  { city: "Orlando", blurb: "Theme-park road trips", href: "/car-rentals/in/orlando" },
  { city: "New York", blurb: "City & airport pickups", href: "/car-rentals/in/new-york" },
  { city: "Miami", blurb: "Beach & airport pickups", href: "/car-rentals/in/miami" },
];

/** Illustrative % positions for the CSS map concept — not geocoded pins. */
const MAP_PIN_POSITIONS: [number, number][] = [
  [64, 70],
  [38, 40],
  [24, 64],
  [72, 34],
  [50, 20],
];

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

/* ------------------------------------------------------------------ */
/* Page component                                                     */
/* ------------------------------------------------------------------ */

export default component$(() => {
  const data = useCityCarRentals().value;
  const { city, citySlug } = data;

  const driversSig = useSignal(
    data.active.drivers != null ? String(data.active.drivers) : "",
  );

  const relatedCities = KNOWN_RENTAL_CITIES.filter(
    (rc) => rc.href !== `/car-rentals/in/${citySlug}`,
  ).slice(0, 3);

  /* Unique pickup areas from results — for the map concept */
  const pickupAreas = Array.from(
    new Set(
      data.results
        .map((r) => r.pickupArea)
        .filter((a): a is string => Boolean(a))
        .slice(0, 4),
    ),
  );

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)">

      {/* ── City hero + real CarRentalSearchCard ──────────────── */}
      <section
        class="relative isolate"
        style="background-image:var(--ui-hero)"
        aria-label={`Car rentals in ${city.name} — search`}
      >
        <div
          class="absolute inset-0 -z-10"
          style="background-image:var(--ui-hero-scrim)"
          aria-hidden="true"
        />

        <div class="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" class="mb-4">
            <ol
              class="flex flex-wrap items-center gap-2 text-[12px]"
              style="color:rgba(255,255,255,0.7)"
            >
              <li class="flex items-center gap-2">
                <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li class="flex items-center gap-2">
                <a href="/car-rentals" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  Car Rentals
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">
                {city.name}
              </li>
            </ol>
          </nav>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
            {/* Left: heading + stats */}
            <div>
              {city.region && (
                <p
                  class="text-[11px] font-bold uppercase tracking-[0.2em]"
                  style="color:rgba(255,255,255,0.75)"
                >
                  {city.region}
                  {city.country ? ` · ${city.country}` : ""}
                </p>
              )}

              <h1
                class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
                style={`color:#fff;font-family:${HEADING_FONT}`}
              >
                Car rentals in {city.name}
              </h1>

              <p class="mt-3 max-w-[52ch] text-base" style="color:rgba(255,255,255,0.88)">
                {data.totalCount > 0
                  ? `${data.totalCount} rental${data.totalCount === 1 ? "" : "s"} available — compare vehicles, pickup types, and policy terms before you book.`
                  : `Compare pickup types, vehicle classes, and policy terms for your ${city.name} car rental.`}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                {[
                  data.totalCount > 0 ? `${data.totalCount} rentals` : "Airport & city pickup",
                  "Pickup & dropoff dates",
                  "Mileage & policy terms shown",
                ].map((pill) => (
                  <span
                    key={pill}
                    class="rounded-full px-3 py-1 text-[12px] font-semibold"
                    style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: real CarRentalSearchCard inside --ui-* panel */}
            <div
              id="car-search"
              class="scroll-mt-24 p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
            >
              <div
                class="text-sm font-bold"
                style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
              >
                Refine your {city.name} search
              </div>
              <div class="mt-3">
                <CarRentalSearchCard
                  variant="stacked"
                  surface="plain"
                  destinationValue={city.name}
                  pickupDate={data.active.pickupDate || ""}
                  dropoffDate={data.active.dropoffDate || ""}
                  drivers={driversSig.value}
                  submitLabel="See results"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vehicle results + facets/sort (real adapter) ──────── */}
      <section class="mx-auto max-w-6xl px-4 py-8" aria-label="Car rental results">
        <CarRentalsResultsAdapter
          results={data.results}
          totalCount={data.totalCount}
          page={data.page}
          totalPages={data.totalPages}
          activeSort={data.activeSort}
          selectedFilters={data.selectedFilters}
          filterFacets={data.facets}
          searchState={data.searchState}
          queryLabel={city.name}
          basePath={buildCityHref(citySlug)}
          urlOptions={{
            includeQueryParam: false,
            includeLocationParams: false,
            dateParamKeys: { checkIn: "pickupDate", checkOut: "dropoffDate" },
          }}
          emptyPrimaryAction={{
            label: "Search car rentals again",
            href: "/car-rentals",
          }}
          emptySecondaryAction={{
            label: "Browse rental cities",
            href: "/car-rentals/in",
          }}
        />
      </section>

      {/* ── Pickup context + CSS map concept ─────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            Where to pick up in {city.name}
          </h2>
          <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
            Collect at the airport on arrival or from a city desk closer to your
            stay. Confirm the exact pickup point on each rate before you book.
          </p>

          <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            {/* Pickup links */}
            <div class="flex flex-col gap-2">
              {[
                {
                  label: "Airport pickup",
                  note: "Most rentals offer on-airport or nearby collection",
                  href: `/car-rentals?q=${encodeURIComponent(city.name)}`,
                },
                {
                  label: "City centre pickup",
                  note: "Alternative desks closer to your accommodation",
                  href: `/car-rentals?q=${encodeURIComponent(city.name)}`,
                },
              ].map((p) => (
                <a
                  key={p.label}
                  href={p.href}
                  aria-label={`Search car rentals — ${p.label} in ${city.name}`}
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

            {/* CSS-only pickup-area map concept */}
            <div
              class="relative min-h-[20rem] overflow-hidden"
              style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              role="img"
              aria-label={`Layout concept showing approximate pickup areas in ${city.name} — not a geocoded map`}
            >
              {/* Road grid */}
              <div
                class="absolute inset-0 opacity-50"
                aria-hidden="true"
                style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
              />
              {/* Highway suggestion */}
              <div
                class="absolute inset-0"
                aria-hidden="true"
                style="background:linear-gradient(118deg,transparent 46%,color-mix(in srgb,var(--ui-primary) 14%,transparent) 47% 50%,transparent 51%)"
              />

              {/* Real pickup area names (from results) or generic labels */}
              {(pickupAreas.length > 0 ? pickupAreas : ["Airport area", "City centre", "Downtown", "North area"]).map(
                (area, i) => {
                  const [x, y] = MAP_PIN_POSITIONS[i] ?? [50, 50];
                  return (
                    <span
                      key={area}
                      class="absolute -translate-x-1/2 -translate-y-1/2 max-w-[8rem] truncate rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={`left:${x}%;top:${y}%;box-shadow:var(--ui-shadow-card);${
                        i === 0
                          ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                          : "background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)"
                      }`}
                      aria-hidden="true"
                    >
                      {area}
                    </span>
                  );
                },
              )}

              {/* Honest label */}
              <span
                class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
              >
                Pickup areas · concept
              </span>

              {/* City name centre pin */}
              <span
                class="absolute left-[35%] top-[32%] -translate-x-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[12px] font-bold"
                style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
                aria-hidden="true"
              >
                {city.name}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Local driving context ─────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            Renting a car in {city.name}
          </h2>
          <p class="mt-1 max-w-[60ch] text-sm" style="color:var(--ui-text-muted)">
            Practical things to know before you collect your vehicle.
          </p>

          <div class="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "◎",
                title: "Confirm pickup details",
                body: `Each rate lists the exact pickup point. Airport and city-desk locations vary by supplier — check before you arrive in ${city.name}.`,
              },
              {
                icon: "≡",
                title: "Mileage & fuel terms",
                body: "Mileage limits and fuel policy are shown on each rate. Read them before you book so there are no surprises at the counter.",
              },
              {
                icon: "⛨",
                title: "Protection options",
                body: "Insurance and damage-waiver options appear with what they cover — you decide whether to add them before you reserve.",
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

          {/* Key city facts */}
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "City", value: city.name },
              { label: "Region", value: city.region || "—" },
              { label: "Country", value: city.country || "—" },
              { label: "Rentals available", value: data.totalCount > 0 ? String(data.totalCount) : "Search to see" },
              { label: "Pickup types", value: "Airport & city desk" },
              { label: "Cancellation", value: "Terms shown before booking" },
            ].map((fact) => (
              <div
                key={fact.label}
                class="p-3"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
              >
                <div
                  class="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style="color:var(--ui-text-muted)"
                >
                  {fact.label}
                </div>
                <div class="mt-0.5 text-sm font-semibold" style="color:var(--ui-text)">
                  {fact.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / policy clarity ────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            Booking you can read
          </h2>

          <div class="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "◎",
                title: "Total price, up front",
                body: "Taxes and mandatory fees are included in every total you compare — the number you see is what you pay.",
              },
              {
                icon: "↻",
                title: "Cancellation, when offered",
                body: "When a rate offers free cancellation, the deadline is shown on the rate before you book — not at checkout.",
              },
              {
                icon: "❏",
                title: "No surprise add-ons",
                body: "What's included and what's optional is stated clearly on each rate, so there are no late counter charges.",
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
        </div>
      </section>

      {/* ── Related cities ────────────────────────────────────── */}
      {relatedCities.length > 0 && (
        <section style="border-top:1px solid var(--ui-divider)">
          <div class="mx-auto max-w-6xl px-4 py-8">
            <h2
              class="text-xl font-bold"
              style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
            >
              Other top rental cities
            </h2>
            <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
              Explore rental options in other popular destinations.
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ...relatedCities,
                {
                  city: "All rental cities",
                  blurb: "Browse every city hub",
                  href: "/car-rentals/in",
                },
              ].map((rc) => (
                <a
                  key={rc.city}
                  href={rc.href}
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
                    {rc.city}
                  </span>
                  <span class="text-[12px]" style="color:var(--ui-text-muted)">
                    {rc.blurb}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Whole-trip handoff ────────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
          >
            Plan the rest of the trip
          </h2>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: "✈",
                title: `Flights to ${city.name}`,
                body: "Line up your car pickup with your arrival.",
                cta: "Search flights",
                href: "/flights",
              },
              {
                icon: "⌂",
                title: `Hotels in ${city.name}`,
                body: "Stay near your pickup point.",
                cta: "Browse hotels",
                href: `/hotels/in/${encodeURIComponent(citySlug)}`,
              },
              {
                icon: "◎",
                title: "Plan what to do",
                body: "Map out drives and day trips in the area.",
                cta: "Explore destinations",
                href: "/destinations",
              },
            ].map((item) => (
              <div
                key={item.title}
                class="flex items-center justify-between gap-3 p-4"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              >
                <div class="min-w-0">
                  <div
                    class="flex items-center gap-2 text-sm font-bold"
                    style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
                  >
                    <span aria-hidden="true" style="color:var(--ui-accent)">{item.icon}</span>
                    {item.title}
                  </div>
                  <p class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
                    {item.body}
                  </p>
                </div>
                <a
                  href={item.href}
                  class="shrink-0 rounded-xl px-4 py-2 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                  aria-label={item.cta}
                >
                  {item.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer for mobile sticky CTA */}
      <div class="h-20 lg:hidden" />

      {/* ── Mobile sticky CTA ─────────────────────────────────── */}
      <div
        class="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:0 -8px 24px rgba(8,12,22,0.12)"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div class="min-w-0">
            <div class="text-sm font-semibold" style="color:var(--ui-text)">
              Cars in {city.name}
            </div>
            <div class="text-[12px]" style="color:var(--ui-text-muted)">
              {data.totalCount > 0 ? `${data.totalCount} rental${data.totalCount === 1 ? "" : "s"} available` : "Search to compare rates"}
            </div>
          </div>
          <a
            href="#car-search"
            class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
          >
            Refine search
          </a>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* head metadata                                                      */
/* ------------------------------------------------------------------ */

export const head: DocumentHead = ({ resolveValue, params, url }) => {
  const data = resolveValue(useCityCarRentals);

  const cityName = data.city.name;
  const title = `Car rentals in ${cityName} | Andacity Travel`;
  const description =
    `Compare car rental options in ${cityName}. Search by pickup date, choose your vehicle class, and see mileage and policy terms on every rate before you book.`;

  const canonicalHref = new URL(buildCityHref(params.citySlug), url.origin).href;

  const listCap = 24;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Car Rentals",
            item: new URL("/car-rentals", url.origin).href,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Cities",
            item: new URL("/car-rentals/in", url.origin).href,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Car rentals in ${cityName}`,
            item: canonicalHref,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: `Andacity car rentals in ${cityName}`,
        itemListElement: data.items.slice(0, listCap).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: new URL(buildCarRentalDetailHref(c.slug), url.origin).href,
          numberOfItems: data.totalCount,
        })),
      },
    ],
  });

  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
    scripts: [
      {
        key: "ld-car-rentals-city",
        props: { type: "application/ld+json" },
        script: jsonLd,
      },
    ],
  };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const buildCityHref = (citySlug: string) => {
  return `/car-rentals/in/${encodeURIComponent(citySlug)}`;
};

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`;
};

const parseRentalParams = (sp: URLSearchParams): RentalParams => {
  const pickupDate = normalizeIsoDate(sp.get("pickupDate"));
  const dropoffDate = normalizeIsoDate(sp.get("dropoffDate"));
  const drivers = clampMaybeInt(sp.get("drivers"), 1, 6);
  return { pickupDate, dropoffDate, drivers };
};

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

type RentalParams = {
  pickupDate: string | null;
  dropoffDate: string | null;
  drivers: number | null;
};
