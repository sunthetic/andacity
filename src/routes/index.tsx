import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { HeroBackground } from "~/components/hero/HeroBackground";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO — Editorial Split (TERRA layout × ATLAS dark depth) ─── */}
      <section
        class="relative overflow-hidden"
        style="min-height: 580px"
      >
        {/* Deep dark warm background */}
        <div
          class="absolute inset-0"
          style="background: linear-gradient(130deg, #080300 0%, #120700 32%, #1C0E04 54%, #0D0600 100%)"
        />

        {/* Terracotta + amber glow nodes */}
        <div
          class="pointer-events-none absolute inset-0"
          style="background: radial-gradient(46% 52% at 4% 0%, rgba(196,97,74,0.22) 0%, transparent 65%), radial-gradient(30% 36% at 72% 90%, rgba(212,151,58,0.10) 0%, transparent 60%), radial-gradient(24% 30% at 96% 18%, rgba(93,138,110,0.08) 0%, transparent 60%)"
        />

        <div class="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          {/* TERRA-style editorial split */}
          <div class="grid gap-8 lg:grid-cols-[1fr_440px] lg:items-stretch">

            {/* Left — editorial dark column */}
            <div
              class="flex flex-col justify-center rounded-2xl p-8 md:p-10"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(196,97,74,0.16); backdrop-filter: blur(8px)"
            >
              {/* Stamp badge (from TERRA) */}
              <div class="mb-6 inline-flex w-fit items-center gap-2">
                <span
                  class="rounded px-2.5 py-1 text-xs font-bold uppercase tracking-widest"
                  style="border: 1.5px solid rgba(212,151,58,0.45); color: #D4973A; background: rgba(212,151,58,0.08); letter-spacing: 0.10em"
                >
                  Now available
                </span>
              </div>

              <h1
                class="text-4xl font-bold md:text-5xl lg:text-6xl"
                style="color: #FBF4EA; line-height: 1.08; letter-spacing: -0.025em"
              >
                Journey further,
                <br />
                <span style="color: #C4614A">plan smarter.</span>
              </h1>

              <p
                class="mt-5 max-w-sm text-base"
                style="color: rgba(239,230,214,0.65); line-height: 1.65"
              >
                Flights, hotels, and car rentals — all in one dark, thoughtful
                workspace built for travelers who know what they want.
              </p>

              {/* Editorial navigation links (from TERRA) */}
              <div class="mt-8 grid grid-cols-3 gap-2">
                {[
                  { label: "Flights", href: "/flights", color: "#C4614A" },
                  { label: "Hotels", href: "/hotels", color: "#5D8A6E" },
                  { label: "Cars", href: "/car-rentals", color: "#D4973A" },
                ].map((v) => (
                  <a
                    key={v.href}
                    href={v.href}
                    class="flex flex-col items-center gap-1.5 rounded-xl py-3 text-center transition hover:bg-white/06"
                    style={`border: 1px solid ${v.color}28; background: ${v.color}08`}
                  >
                    <span class="text-xs font-bold uppercase tracking-wider" style={`color: ${v.color}`}>
                      {v.label}
                    </span>
                  </a>
                ))}
              </div>

              <div class="mt-6">
                <a class="t-btn-primary px-6 py-3" href="/explore">
                  Start exploring →
                </a>
              </div>
            </div>

            {/* Right — search card (ATLAS glassmorphism) */}
            <div
              class="flex flex-col rounded-2xl p-6 md:p-8"
              style="background: rgba(255,255,255,0.07); border: 1px solid rgba(196,97,74,0.22); backdrop-filter: blur(20px); box-shadow: 0 24px 64px rgba(13,6,0,0.58), inset 0 1px 0 rgba(212,151,58,0.10)"
            >
              <div class="mb-4 border-b pb-3" style="border-color: rgba(196,97,74,0.14)">
                <span class="text-sm font-bold uppercase tracking-wide" style="color: rgba(239,230,214,0.55)">
                  Where are you going?
                </span>
              </div>

              <GlobalSearchEntry
                id="global-search-entry"
                class="text-left"
                eyebrow="Search"
                title="Find your trip"
                description="Flights, hotels, cars"
              />
            </div>
          </div>
        </div>

        {/* Gradient fade */}
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style="background: linear-gradient(180deg, transparent, #0D0600)"
        />
      </section>

      {/* ── MAIN ───────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-12">

        {/* Travel sections — editorial grid with terracotta/sage/amber accents */}
        <section>
          <div class="mb-2 flex items-center gap-3">
            <span class="h-px flex-1" style="background: rgba(196,97,74,0.18)" />
            <span class="text-xs font-bold uppercase tracking-widest" style="color: rgba(239,230,214,0.40)">Plan</span>
            <span class="h-px flex-1" style="background: rgba(196,97,74,0.18)" />
          </div>
          <h2
            class="mb-6 mt-3 text-2xl font-bold md:text-3xl"
            style="color: #FBF4EA; letter-spacing: -0.02em"
          >
            Every part of your trip
          </h2>

          <div class="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Flights",
                href: "/flights",
                desc: "Compare routes and book the right fare.",
                accent: "#C4614A",
                pill: "Flights",
              },
              {
                label: "Hotels",
                href: "/hotels",
                desc: "Browse properties that fit your stay.",
                accent: "#5D8A6E",
                pill: "Hotels",
              },
              {
                label: "Car Rentals",
                href: "/car-rentals",
                desc: "Pick up freedom at your destination.",
                accent: "#D4973A",
                pill: "Cars",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group block rounded-2xl p-6 transition"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(196,97,74,0.14); box-shadow: 0 4px 20px rgba(13,6,0,0.36)"
              >
                {/* Stamp pill */}
                <span
                  class="mb-4 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                  style={`border: 1.5px solid ${v.accent}38; color: ${v.accent}; background: ${v.accent}10; letter-spacing: 0.08em`}
                >
                  {v.pill}
                </span>
                <div class="mb-2 text-lg font-semibold" style="color: #FBF4EA; letter-spacing: -0.02em">
                  {v.label}
                </div>
                <p class="text-sm" style="color: rgba(239,230,214,0.58); line-height: 1.65">
                  {v.desc}
                </p>
                <div
                  class="mt-5 text-sm font-semibold transition group-hover:translate-x-0.5"
                  style={`color: ${v.accent}`}
                >
                  Search →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Why Andacity — editorial dark strip with column layout from TERRA */}
        <section class="mt-14">
          <div class="overflow-hidden rounded-2xl" style="border: 1px solid rgba(196,97,74,0.16)">
            <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
              style="divide-color: rgba(196,97,74,0.10); background: rgba(255,255,255,0.04)"
            >
              {[
                {
                  label: "One platform",
                  note: "Flights, hotels, and cars handled without switching tools.",
                  accent: "#C4614A",
                  tag: "Core",
                },
                {
                  label: "Live pricing",
                  note: "Up-to-date fares and availability across all verticals.",
                  accent: "#5D8A6E",
                  tag: "Data",
                },
                {
                  label: "Your trip, one view",
                  note: "Every booking assembled into a single shareable plan.",
                  accent: "#D4973A",
                  tag: "Trips",
                },
              ].map((item) => (
                <div key={item.label} class="px-7 py-6">
                  <div class="mb-3">
                    <span
                      class="rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                      style={`border: 1.5px solid ${item.accent}38; color: ${item.accent}; background: ${item.accent}10; letter-spacing: 0.08em`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <div class="text-base font-semibold" style="color: #FBF4EA; letter-spacing: -0.01em">
                    {item.label}
                  </div>
                  <p class="mt-1.5 text-sm" style="color: rgba(239,230,214,0.55); line-height: 1.65">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Destinations */}
        <section class="mt-14">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold" style="color: #FBF4EA; letter-spacing: -0.02em">
              Popular destinations
            </h2>
            <a class="t-btn-ghost px-5 py-2.5 text-sm" href="/destinations">All →</a>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { city: "Miami", type: "Beach hotels", color: "#C4614A" },
              { city: "New York", type: "City stays", color: "#5D8A6E" },
              { city: "Los Angeles", type: "Coastal trips", color: "#D4973A" },
              { city: "Las Vegas", type: "Resort stays", color: "#C4614A" },
            ].map((d) => (
              <a
                key={d.city}
                href={`/destinations/${d.city.toLowerCase().replace(" ", "-")}`}
                class="group rounded-2xl p-5 transition"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(196,97,74,0.14)"
              >
                <div class="mb-1 text-xs font-bold uppercase tracking-widest" style={`color: ${d.color}; letter-spacing: 0.08em`}>
                  {d.type}
                </div>
                <div class="text-base font-semibold" style="color: #FBF4EA">{d.city}</div>
                <div class="mt-3 text-sm font-semibold transition group-hover:translate-x-0.5" style={`color: ${d.color}`}>
                  Explore →
                </div>
              </a>
            ))}
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
