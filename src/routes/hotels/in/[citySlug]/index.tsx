import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { HotelsResultsAdapter } from "~/components/hotels/HotelsResultsAdapter";
import { DateField } from "~/components/ui/DateField";
import { normalizeIsoDate, getTodayIsoDate } from "~/lib/date/validateDate";
import { addDays } from "~/lib/trips/date-utils";
import { normalizeHotelSort } from "~/lib/search/hotels/hotel-sort-options";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import {
  loadHotelCityBySlugFromDb,
  loadHotelsForCityFromDb,
} from "~/lib/queries/hotels-pages.server";

export const useHotelCityPage = routeLoader$(async ({ params, url, error }) => {
  const slug = String(params.citySlug || "")
    .toLowerCase()
    .trim();
  if (!slug) throw error(404, "Not found");

  const city = await loadHotelCityBySlugFromDb(slug);
  if (!city) throw error(404, "Not found");

  const hotels = await loadHotelsForCityFromDb(slug);

  const active = parseStayParams(url.searchParams);

  const searchState = searchStateFromUrl(url, {
    query: city.city,
    location: { city: city.city },
    dates: {
      checkIn: active.checkIn || undefined,
      checkOut: active.checkOut || undefined,
    },
    sort: "recommended",
    page: 1,
  });
  searchState.query = city.city;
  searchState.location = {
    ...(searchState.location || {}),
    city: city.city,
  };
  searchState.sort = normalizeHotelSort(searchState.sort);

  const searchHref = buildSearchHotelsHref({
    query: city.query,
    page: 1,
    checkIn: active.checkIn,
    checkOut: active.checkOut,
    adults: active.adults,
    rooms: active.rooms,
  });

  return {
    slug,
    city,
    hotels,
    searchState,
    active,
    searchHref,
  };
});

/* ------------------------------------------------------------------ */
/* Static known-safe city links for the related cities section        */
/* ------------------------------------------------------------------ */

const KNOWN_CITY_LINKS = [
  { city: "New York", blurb: "Iconic city stays", href: "/hotels/in/new-york" },
  {
    city: "Las Vegas",
    blurb: "Strip resorts and suites",
    href: "/hotels/in/las-vegas",
  },
  {
    city: "Orlando",
    blurb: "Family resorts near parks",
    href: "/hotels/in/orlando",
  },
  { city: "Miami", blurb: "Beachfront and Art Deco", href: "/hotels/in/miami" },
];

/* ------------------------------------------------------------------ */
/* Shared input class for hero date/guest fields                      */
/* ------------------------------------------------------------------ */

const HERO_DATE_INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-muted)] px-3 py-2 text-sm text-[color:var(--ui-text)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1";

const HERO_INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-muted)] px-3 py-2 text-sm text-[color:var(--ui-text)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1";

/* ------------------------------------------------------------------ */
/* Filter helpers (mirrors internal logic from HotelsResultsAdapter)  */
/* ------------------------------------------------------------------ */

const normalizeToken = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

/* Illustrative pin positions for the CSS map concept. */
const PIN_POSITIONS: [number, number][] = [
  [68, 72],
  [42, 38],
  [35, 22],
  [70, 48],
  [25, 62],
];

/* ------------------------------------------------------------------ */
/* Page component                                                     */
/* ------------------------------------------------------------------ */

export default component$(() => {
  const data = useHotelCityPage().value;
  const c = data.city;
  const location = useLocation();

  const checkIn = useSignal(data.active.checkIn || "");
  const checkOut = useSignal(data.active.checkOut || "");
  const todayIso = getTodayIsoDate();
  const tomorrowIso = addDays(todayIso, 1) || todayIso;
  const minCheckout =
    addDays(checkIn.value >= todayIso ? checkIn.value : todayIso, 1) ||
    tomorrowIso;

  const filters = data.searchState.filters || {};
  const activeStarsMin =
    typeof filters.starsMin === "number" ? filters.starsMin : null;
  const activeAmenities = toStringArray(filters.amenities).map(normalizeToken);
  const activeNeighborhoods = toStringArray(filters.neighborhoods).map(
    normalizeToken,
  );

  const buildFilterHref = (
    key: string,
    value: string,
    isActive: boolean,
  ): string => {
    const sp = new URLSearchParams(location.url.search);
    if (isActive) {
      sp.delete(key);
    } else {
      sp.set(key, value);
    }
    const qs = sp.toString();
    return qs ? `${location.url.pathname}?${qs}` : location.url.pathname;
  };

  const quickFilters = [
    {
      label: "4+ stars",
      isActive: activeStarsMin != null && activeStarsMin >= 4,
      href: buildFilterHref(
        "starsMin",
        "4",
        activeStarsMin != null && activeStarsMin >= 4,
      ),
    },
    ...c.topAmenities.slice(0, 3).map((a) => {
      const isActive = activeAmenities.includes(normalizeToken(a.name));
      return {
        label: a.name,
        isActive,
        href: buildFilterHref("amenities", a.name, isActive),
      };
    }),
  ];

  const relatedCities = KNOWN_CITY_LINKS.filter(
    (rc) => rc.href !== `/hotels/in/${data.slug}`,
  ).slice(0, 3);

  const hotelCount = c.hotelSlugs.length;

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text)">
      {/* ── City hero ──────────────────────────────────────────── */}
      <section
        class="relative isolate z-10"
        style="background-image:var(--ui-hero)"
        aria-label={`Hotels in ${c.city} — search and overview`}
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
                <a
                  href="/"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li class="flex items-center gap-2">
                <a
                  href="/hotels"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Hotels
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">
                {c.city}
              </li>
            </ol>
          </nav>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            {/* Left: heading + stats */}
            <div>
              <p
                class="text-[11px] font-bold uppercase tracking-[0.2em]"
                style="color:rgba(255,255,255,0.75)"
              >
                {c.region} · {c.country}
              </p>

              <h1
                class="mt-2 text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
                style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
              >
                Hotels in {c.city}
              </h1>

              <p
                class="mt-3 max-w-[52ch] text-base"
                style="color:rgba(255,255,255,0.88)"
              >
                {hotelCount} hotel{hotelCount === 1 ? "" : "s"} — transparent
                totals, clear cancellation policies, and fast filtering across
                every area of the city.
              </p>

              {/* Quick stat pills */}
              <div class="mt-4 flex flex-wrap gap-2">
                {[
                  `${hotelCount} hotel${hotelCount === 1 ? "" : "s"}`,
                  `From ${formatMoney(c.priceFrom, "USD")}/night`,
                  ...(c.topNeighborhoods.length > 0
                    ? [`${c.topNeighborhoods.length} area${c.topNeighborhoods.length === 1 ? "" : "s"}`]
                    : []),
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

            {/* Right: search form with real DateField */}
            <div
              class="p-5"
              style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
            >
              <div
                class="text-sm font-bold"
                style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
              >
                Search hotels in {c.city}
              </div>

              <form
                method="get"
                action={buildHotelsInCityHref(data.slug)}
                class="mt-4 grid gap-3"
              >
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      for="city-check-in"
                      class="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style="color:var(--ui-text-muted)"
                    >
                      Check-in
                    </label>
                    <DateField
                      id="city-check-in"
                      name="checkIn"
                      value={checkIn}
                      minValue={todayIso}
                      inputClass={HERO_DATE_INPUT_CLASS}
                      iconLabel="Open check-in date picker"
                      overlayLabel="Check-in date picker"
                    />
                  </div>
                  <div>
                    <label
                      for="city-check-out"
                      class="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style="color:var(--ui-text-muted)"
                    >
                      Check-out
                    </label>
                    <DateField
                      id="city-check-out"
                      name="checkOut"
                      value={checkOut}
                      minValue={minCheckout}
                      inputClass={HERO_DATE_INPUT_CLASS}
                      iconLabel="Open check-out date picker"
                      overlayLabel="Check-out date picker"
                      overlayPosition="right"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      for="city-adults"
                      class="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style="color:var(--ui-text-muted)"
                    >
                      Adults
                    </label>
                    <input
                      id="city-adults"
                      name="adults"
                      class={HERO_INPUT_CLASS}
                      placeholder="2"
                      value={
                        data.active.adults != null
                          ? String(data.active.adults)
                          : ""
                      }
                    />
                  </div>
                  <div>
                    <label
                      for="city-rooms"
                      class="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style="color:var(--ui-text-muted)"
                    >
                      Rooms
                    </label>
                    <input
                      id="city-rooms"
                      name="rooms"
                      class={HERO_INPUT_CLASS}
                      placeholder="1"
                      value={
                        data.active.rooms != null
                          ? String(data.active.rooms)
                          : ""
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  class="w-full rounded-xl py-3 text-center text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1"
                  style="background:var(--ui-primary);color:var(--ui-on-primary)"
                >
                  Search {c.city} hotels
                </button>
              </form>

            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky filter chip bar ─────────────────────────────── */}
      <div
        class="sticky top-[var(--sticky-top-offset,0)] z-30"
        style="background:var(--ui-surface);border-bottom:1px solid var(--ui-border)"
      >
        <div class="mx-auto max-w-6xl px-4">
          <div class="flex items-center gap-3 overflow-x-auto py-2.5 scrollbar-none">
            <div
              class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
            >
              <span>Recommended</span>
              <span aria-hidden="true" style="color:var(--ui-text-muted)">
                ▾
              </span>
            </div>

            <div
              class="h-4 w-px shrink-0"
              style="background:var(--ui-divider)"
              aria-hidden="true"
            />

            {quickFilters.map((f) => (
              <a
                key={f.label}
                href={f.href}
                aria-label={
                  f.isActive
                    ? `${f.label} — active filter, click to remove`
                    : `Filter by ${f.label}`
                }
                class="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style={
                  f.isActive
                    ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                    : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                }
              >
                {f.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hotel results ──────────────────────────────────────── */}
      <div class="mx-auto max-w-6xl px-4 py-8">
        <HotelsResultsAdapter
          citySlug={data.slug}
          city={c}
          hotels={data.hotels}
          searchState={data.searchState}
        />
      </div>

      {/* ── Neighborhood explorer + CSS map concept ─────────────── */}
      {c.topNeighborhoods.length > 0 && (
        <section style="border-top:1px solid var(--ui-divider)">
          <div class="mx-auto max-w-6xl px-4 py-8">
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Explore by area
            </h2>
            <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
              {c.city} has {c.topNeighborhoods.length} distinct hotel{" "}
              {c.topNeighborhoods.length === 1 ? "area" : "areas"}.
            </p>

            <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              {/* Neighborhood list */}
              <div class="flex flex-col gap-2">
                {c.topNeighborhoods.map((n) => {
                  const isActive = activeNeighborhoods.includes(
                    normalizeToken(n.name),
                  );
                  return (
                    <a
                      key={n.name}
                      href={buildFilterHref("neighborhoods", n.name, isActive)}
                      class="group flex items-center justify-between gap-3 p-3 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
                    >
                      <div class="min-w-0">
                        <div
                          class="text-sm font-semibold"
                          style="color:var(--ui-text)"
                        >
                          {n.name}
                        </div>
                        <div
                          class="text-[12px]"
                          style="color:var(--ui-text-muted)"
                        >
                          {n.count} hotel{n.count === 1 ? "" : "s"}
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
                  );
                })}
              </div>

              {/* CSS map concept */}
              <div
                class="relative min-h-[22rem] overflow-hidden"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
                role="img"
                aria-label={`Map concept showing approximate hotel areas in ${c.city} — not a geocoded map`}
              >
                {/* Street grid lines */}
                <div
                  class="absolute inset-0 opacity-50"
                  aria-hidden="true"
                  style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
                />
                {/* Radial gradient suggestion */}
                <div
                  class="absolute inset-0"
                  aria-hidden="true"
                  style="background:radial-gradient(ellipse 60% 40% at 75% 80%, color-mix(in srgb, var(--ui-primary) 8%, transparent), transparent 70%)"
                />

                {/* Neighborhood name pins at illustrative positions */}
                {c.topNeighborhoods.slice(0, 5).map((n, i) => {
                  const [x, y] = PIN_POSITIONS[i] ?? [50, 50];
                  return (
                    <span
                      key={n.name}
                      class="absolute -translate-x-1/2 -translate-y-1/2 max-w-[8rem] truncate rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={`left:${x}%;top:${y}%;box-shadow:var(--ui-shadow-card);background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border)`}
                      aria-hidden="true"
                    >
                      {n.name}
                    </span>
                  );
                })}

                {/* Honest concept label */}
                <span
                  class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                >
                  Map layout · concept
                </span>

                {/* City name center pin */}
                <span
                  class="absolute left-[35%] top-[32%] -translate-x-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-[12px] font-bold"
                  style="background:var(--ui-surface);color:var(--ui-text);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
                  aria-hidden="true"
                >
                  {c.city}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── City guide ─────────────────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            Staying in {c.city}
          </h2>

          <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* Editorial copy from real city data */}
            <div class="flex flex-col gap-4">
              <p
                class="text-sm leading-relaxed"
                style="color:var(--ui-text-muted)"
              >
                {c.city} offers {hotelCount} listed hotel
                {hotelCount === 1 ? "" : "s"}
                {c.topNeighborhoods.length > 0
                  ? ` across ${c.topNeighborhoods.length} distinct area${c.topNeighborhoods.length === 1 ? "" : "s"}`
                  : ""}
                {". "}
                {c.topNeighborhoods.length > 0 && (
                  <>
                    The most-listed areas include{" "}
                    {c.topNeighborhoods
                      .slice(0, 3)
                      .map((n) => n.name)
                      .join(", ")}
                    {". "}
                  </>
                )}
                {c.topAmenities.length > 0 && (
                  <>
                    Most properties offer{" "}
                    {c.topAmenities
                      .slice(0, 3)
                      .map((a) => a.name)
                      .join(", ")}
                    {". "}
                  </>
                )}
                Rates start from {formatMoney(c.priceFrom, "USD")} per night.
                All prices include taxes and fees.
              </p>

              {/* Key facts grid */}
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Hotels", value: String(hotelCount) },
                  {
                    label: "Starting from",
                    value: `${formatMoney(c.priceFrom, "USD")}/night`,
                  },
                  {
                    label: "Top area",
                    value: c.topNeighborhoods[0]?.name ?? c.city,
                  },
                  { label: "Region", value: c.region },
                  { label: "Country", value: c.country },
                  {
                    label: "Popular amenity",
                    value: c.topAmenities[0]?.name ?? "—",
                  },
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
                    <div
                      class="mt-0.5 text-sm font-semibold"
                      style="color:var(--ui-text)"
                    >
                      {fact.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top areas + amenities panel */}
            <div class="flex flex-col gap-4">
              {c.topNeighborhoods.length > 0 && (
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
                          href={`/hotels/in/${data.slug}?neighborhoods=${encodeURIComponent(n.name)}`}
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
              )}

              {c.topAmenities.length > 0 && (
                <div
                  class="p-4"
                  style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
                >
                  <h3 class="text-sm font-bold" style="color:var(--ui-text)">
                    Popular amenities
                  </h3>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    {c.topAmenities.slice(0, 6).map((a) => (
                      <a
                        key={a.name}
                        href={`/hotels/in/${data.slug}?amenities=${encodeURIComponent(a.name)}`}
                        class="rounded-full px-2.5 py-0.5 text-[12px] font-medium transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                        style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                      >
                        {a.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Related cities ─────────────────────────────────────── */}
      {relatedCities.length > 0 && (
        <section style="border-top:1px solid var(--ui-divider)">
          <div class="mx-auto max-w-6xl px-4 py-8">
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Other top destinations
            </h2>
            <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
              Explore hotels in other popular destinations.
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ...relatedCities,
                {
                  city: "All hotel cities",
                  blurb: "Browse every city hub",
                  href: "/hotels/in",
                },
              ].map((rc) => (
                <a
                  key={rc.city}
                  href={rc.href}
                  class="group flex flex-col gap-1 p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
                >
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

      {/* ── Trust section ──────────────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
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
                <p
                  class="mt-1.5 text-[13px]"
                  style="color:var(--ui-text-muted)"
                >
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer clears the mobile sticky CTA */}
      <div class="h-20 lg:hidden" />

      {/* ── Mobile sticky CTA ───────────────────────────────────── */}
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
              From {formatMoney(c.priceFrom, "USD")}/night
            </div>
          </div>
          <a
            href={data.searchHref}
            class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
          >
            Search hotels
          </a>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelCityPage);
  const c = data.city;

  const title = `Hotels in ${c.city} | Andacity Travel`;
  const description = `Find hotels in ${c.city}. Explore top areas and amenities, and compare options with transparent totals and policies.`;

  const canonicalHref = new URL(buildHotelsInCityHref(data.slug), url.origin)
    .href;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Hotels",
            item: new URL("/hotels", url.origin).href,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Cities",
            item: new URL("/hotels/in", url.origin).href,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: c.city,
            item: canonicalHref,
          },
        ],
      },
      {
        "@type": "Place",
        name: c.city,
        address: {
          "@type": "PostalAddress",
          addressRegion: c.region,
          addressCountry: c.country,
        },
      },
      {
        "@type": "ItemList",
        name: `Featured hotels in ${c.city}`,
        itemListElement: data.hotels.map((h, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: h.name,
          url: new URL(buildHotelDetailHref(h.slug), url.origin).href,
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

      { name: "json-ld", content: jsonLd },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
    scripts: [
      {
        key: `ld-city-${data.slug}`,
        props: { type: "application/ld+json" },
        script: jsonLd,
      },
    ],
  };
};

const buildHotelsInCityHref = (citySlug: string) => {
  return `/hotels/in/${encodeURIComponent(citySlug)}`;
};

const buildHotelDetailHref = (hotelSlug: string) => {
  return `/hotels/${encodeURIComponent(hotelSlug)}`;
};

const parseStayParams = (sp: URLSearchParams): StayParams => {
  const checkIn = normalizeIsoDate(sp.get("checkIn"));
  const checkOut = normalizeIsoDate(sp.get("checkOut"));
  const adults = clampMaybeInt(sp.get("adults"), 1, 10);
  const rooms = clampMaybeInt(sp.get("rooms"), 1, 6);
  return { checkIn, checkOut, adults, rooms };
};

const buildSearchHotelsHref = (d: {
  query: string;
  page: number;
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  rooms: number | null;
}) => {
  const base = `/search/hotels/${encodeURIComponent(d.query)}/${d.page}`;
  const sp = new URLSearchParams();

  if (d.checkIn) sp.set("checkIn", d.checkIn);
  if (d.checkOut) sp.set("checkOut", d.checkOut);
  if (d.adults != null) sp.set("adults", String(d.adults));
  if (d.rooms != null) sp.set("rooms", String(d.rooms));

  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} ${currency}`;
  }
};

/* -----------------------------
   Types
----------------------------- */

type StayParams = {
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  rooms: number | null;
};
