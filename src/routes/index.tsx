import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── EDITORIAL HERO ──────────────────────────────── */}
      <section
        class="relative isolate overflow-hidden"
        style="background: linear-gradient(145deg, #3D2010 0%, #6B3320 45%, #4A2A1A 100%)"
      >
        {/* Warm photo-like texture layer */}
        <div
          class="absolute inset-0 -z-10 opacity-20"
          style="background: url('/images/hero/home.svg') center/cover no-repeat"
          aria-hidden="true"
        />
        {/* Warm gradient overlay */}
        <div
          class="absolute inset-0 -z-10"
          style="background: linear-gradient(to right, rgba(28,14,6,0.80) 0%, rgba(28,14,6,0.60) 50%, rgba(40,18,8,0.30) 100%)"
          aria-hidden="true"
        />

        <div class="mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-32">
          <div class="grid gap-12 lg:grid-cols-[1fr_400px] lg:items-center">
            {/* Left — editorial text */}
            <div>
              <div
                class="mb-6 inline-block rounded-sm border border-[rgba(212,151,58,0.50)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
                style="color: #F5D080; background: rgba(212,151,58,0.12)"
              >
                Andacity Travel Platform
              </div>

              <h1
                class="text-5xl font-bold text-[#FAF5EE] md:text-6xl lg:text-7xl"
                style="line-height: 1.08; letter-spacing: -0.03em"
              >
                Your next
                <br />
                chapter
                <br />
                <em
                  class="not-italic"
                  style="color: #E8AD70"
                >
                  starts here.
                </em>
              </h1>

              <p class="mt-6 max-w-lg text-base leading-7" style="color: rgba(250,240,225,0.80)">
                Flights, hotels, cars — planned together, booked in one place.
                Less friction between "I want to go" and "I'm going."
              </p>

              <div class="mt-8 flex flex-wrap gap-3">
                <a
                  href="/flights"
                  class="t-btn-primary px-6 py-3 text-sm"
                  style="background: linear-gradient(135deg, #C4614A, #B84D1A); box-shadow: 0 6px 20px rgba(196,97,74,0.40)"
                >
                  Search flights
                </a>
                <a
                  href="/explore"
                  class="rounded-lg border border-[rgba(250,240,225,0.28)] bg-[rgba(255,255,255,0.10)] px-6 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-[rgba(255,255,255,0.16)]"
                  style="color: rgba(250,240,225,0.90)"
                >
                  Explore destinations
                </a>
              </div>

              {/* Quick verticals */}
              <div class="mt-8 flex flex-wrap items-center gap-2">
                {[
                  { label: "Hotels", href: "/hotels" },
                  { label: "Car Rentals", href: "/car-rentals" },
                  { label: "My Trips", href: "/my-trips" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    class="rounded border border-[rgba(250,240,225,0.20)] px-3 py-1.5 text-xs font-medium transition hover:border-[rgba(212,151,58,0.50)] hover:bg-[rgba(212,151,58,0.12)]"
                    style="color: rgba(250,240,225,0.70)"
                  >
                    {l.label} →
                  </a>
                ))}
              </div>
            </div>

            {/* Right — search card */}
            <div>
              <div
                class="rounded-xl p-1"
                style="background: rgba(253,250,246,0.06); border: 1px solid rgba(212,151,58,0.26); backdrop-filter: blur(10px)"
              >
                <div
                  class="rounded-xl p-4"
                  style="background: rgba(247,241,232,0.96)"
                >
                  <p class="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-subtle)]">
                    Find your trip
                  </p>
                  <GlobalSearchEntry
                    id="global-search-entry"
                    class="text-left"
                    eyebrow="Search"
                    title="Start planning"
                    description="Search flights, hotels, or cars"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-14">
        {/* Verticals — editorial cards */}
        <section id="verticals">
          <div class="mb-8">
            <div
              class="mb-2 h-0.5 w-10"
              style="background: linear-gradient(90deg, #C4614A, #D4973A)"
            />
            <h2 class="text-2xl font-bold tracking-tight text-[color:var(--color-text-strong)] md:text-3xl">
              Plan the whole trip
            </h2>
            <p class="mt-2 max-w-[52ch] text-sm text-[color:var(--color-text-muted)]">
              Every entry point is first-class. Start from flights, stays, or wheels.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "✈",
                label: "Flights",
                href: "/flights",
                desc: "Compare routes and schedules with less noise.",
                accent: "#C4614A",
                soft: "rgba(196,97,74,0.08)",
                borderTop: "#C4614A",
              },
              {
                icon: "🏨",
                label: "Hotels",
                href: "/hotels",
                desc: "Search stays by destination, dates, and guests.",
                accent: "#9B4A8A",
                soft: "rgba(155,74,138,0.07)",
                borderTop: "#9B4A8A",
              },
              {
                icon: "🚗",
                label: "Car Rentals",
                href: "/car-rentals",
                desc: "Rentals with city-by-city availability.",
                accent: "#5D8A6E",
                soft: "rgba(93,138,110,0.07)",
                borderTop: "#5D8A6E",
              },
              {
                icon: "🧭",
                label: "Explore",
                href: "/explore",
                desc: "Find destinations by mood, season, or budget.",
                accent: "#D4973A",
                soft: "rgba(212,151,58,0.07)",
                borderTop: "#D4973A",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group block rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                style={`box-shadow: var(--shadow-sm); border-top: 3px solid ${v.borderTop}`}
              >
                <div
                  class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                  style={`background: ${v.soft}`}
                >
                  {v.icon}
                </div>
                <div class="text-base font-bold text-[color:var(--color-text-strong)]">
                  {v.label}
                </div>
                <p class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                  {v.desc}
                </p>
                <div
                  class="mt-4 text-sm font-semibold transition group-hover:underline"
                  style={`color: ${v.accent}`}
                >
                  Search {v.label.toLowerCase()} →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── WHY ANDACITY ─────────────────────────────── */}
        <section
          class="mt-14 rounded-xl p-8 md:p-10"
          style="background: linear-gradient(145deg, #F7F1E8, #EDE0CC); border: 1px solid rgba(122,88,67,0.20); border-left: 4px solid #C4614A; box-shadow: var(--shadow-md)"
        >
          <div class="grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Unified planning",
                body: "Move from flights to stays to transport without switching platforms or losing context.",
              },
              {
                num: "02",
                title: "Search + discovery",
                body: "Combine search with destination context so decisions happen faster and with confidence.",
              },
              {
                num: "03",
                title: "One trip, full view",
                body: "Everything assembled into a single shareable itinerary — no spreadsheets, no tabs.",
              },
            ].map((item) => (
              <div key={item.num}>
                <div
                  class="mb-3 text-3xl font-black"
                  style="color: rgba(196,97,74,0.22); font-variant-numeric: tabular-nums; letter-spacing: -0.04em"
                >
                  {item.num}
                </div>
                <div class="text-base font-bold text-[color:var(--color-text-strong)]">
                  {item.title}
                </div>
                <p class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── POPULAR DESTINATIONS ─────────────────────── */}
        <section class="mt-14">
          <div class="mb-6 flex items-end justify-between gap-4">
            <div>
              <div class="mb-2 h-0.5 w-8" style="background: #D4973A" />
              <h2 class="text-2xl font-bold tracking-tight text-[color:var(--color-text-strong)]">
                Popular destinations
              </h2>
              <p class="mt-1.5 text-sm text-[color:var(--color-text-muted)]">
                Start with city guides, then branch into flights, hotels, and rentals.
              </p>
            </div>
            <a
              class="t-btn-ghost px-4 py-2 text-sm"
              href="/destinations"
            >
              All destinations
            </a>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { city: "Miami", note: "Beach stays · nonstop routes", href: "/destinations/miami" },
              { city: "New York", note: "Hotels · city transit", href: "/hotels/in/new-york" },
              { city: "San Diego", note: "Coastal · easy drives", href: "/destinations/san-diego" },
              { city: "Orlando", note: "Rentals · theme parks", href: "/car-rentals/in/orlando" },
            ].map((d, i) => {
              const colors = ["#C4614A", "#9B4A8A", "#5D8A6E", "#D4973A"];
              return (
                <a
                  key={d.city}
                  href={d.href}
                  class="group block rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                  style={`box-shadow: var(--shadow-sm); border-top: 2px solid ${colors[i]}`}
                >
                  <div class="text-base font-bold text-[color:var(--color-text-strong)] transition group-hover:text-[color:var(--color-action)]">
                    {d.city}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {d.note}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
});

export const head: DocumentHead = ({ url }) => {
  const title = "Andacity | Flights, Hotels, Car Rentals, and Discovery";
  const description =
    "Plan the whole trip in one place with Andacity: search flights, hotels, car rentals, and explore destinations.";
  const canonicalHref = new URL("/", url.origin).href;
  const ogImage = new URL("/og/home.png", url.origin).href;

  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
