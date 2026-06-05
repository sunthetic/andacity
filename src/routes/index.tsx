import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO — Rich Sunset Dusk ─────────────────────────── */}
      <section
        class="relative overflow-hidden"
        style="background: linear-gradient(145deg, #0C0116 0%, #1C0A2E 30%, #2D1040 52%, #1A0830 70%, #0E0120 100%); min-height: 660px"
      >
        {/* Warm glow nodes */}
        <div
          class="pointer-events-none absolute inset-0"
          style="background: radial-gradient(48% 56% at 80% 8%, rgba(200,56,96,0.28) 0%, transparent 70%), radial-gradient(36% 42% at 16% 88%, rgba(245,200,66,0.14) 0%, transparent 65%), radial-gradient(32% 38% at 92% 80%, rgba(91,31,175,0.20) 0%, transparent 65%)"
        />

        {/* Soft noise texture */}
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.03]"
          style="background-image: url('data:image/svg+xml,<svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"1\"/></svg>'); background-size: 200px"
        />

        <div class="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div class="grid gap-12 lg:grid-cols-[1fr_460px] lg:items-center">
            {/* Left — luxurious headline */}
            <div>
              <div
                class="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2"
                style="border: 1px solid rgba(245,200,66,0.30); background: rgba(245,200,66,0.08)"
              >
                <span class="h-1.5 w-1.5 rounded-full" style="background: #F5C842" />
                <span class="text-xs font-semibold tracking-wide" style="color: #F5C842">
                  Premium Travel Platform
                </span>
              </div>

              <h1
                class="text-5xl font-bold md:text-6xl lg:text-7xl"
                style="line-height: 1.08; letter-spacing: -0.025em; color: #FFF8F0"
              >
                Travel in
                <br />
                <span
                  style="background: linear-gradient(135deg, #F5C842 0%, #E8728A 55%, #C070FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text"
                >
                  golden light.
                </span>
              </h1>

              <p
                class="mt-5 max-w-md text-base md:text-lg"
                style="color: rgba(240,232,216,0.68); line-height: 1.6"
              >
                Flights, hotels, and car rentals — curated into one seamless
                experience. Find where you want to go, and how to get there.
              </p>

              <div class="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "Flights", href: "/flights" },
                  { label: "Hotels", href: "/hotels" },
                  { label: "Cars", href: "/car-rentals" },
                  { label: "Explore", href: "/explore" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    class="rounded-full px-4 py-2 text-sm font-medium transition"
                    style="border: 1px solid rgba(200,160,255,0.24); color: rgba(240,232,216,0.75); background: rgba(255,255,255,0.06); backdrop-filter: blur(8px)"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right — search card — frosted dark glass */}
            <div
              class="rounded-2xl p-6"
              style="background: rgba(255,255,255,0.08); border: 1px solid rgba(200,160,255,0.20); backdrop-filter: blur(20px); box-shadow: 0 24px 64px rgba(22,1,32,0.60), inset 0 1px 0 rgba(245,200,66,0.12)"
            >
              <div
                class="mb-4 flex items-center justify-between border-b pb-3"
                style="border-color: rgba(200,160,255,0.14)"
              >
                <span class="text-sm font-semibold" style="color: #FFF8F0">Where to?</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style="background: rgba(245,200,66,0.14); color: #F5C842; border: 1px solid rgba(245,200,66,0.28)"
                >
                  All
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

        {/* Gradient fade to body */}
        <div
          class="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style="background: linear-gradient(180deg, transparent, #160120)"
        />
      </section>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-14">

        {/* Verticals — rich dark cards */}
        <section>
          <h2
            class="mb-2 text-2xl font-bold md:text-3xl"
            style="color: #FFF8F0; letter-spacing: -0.02em"
          >
            Book your journey
          </h2>
          <p class="mb-8 text-sm" style="color: rgba(240,232,216,0.60); line-height: 1.6">
            Every part of the trip, handled in one place.
          </p>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Flights",
                href: "/flights",
                desc: "Search routes, compare fares, and book with ease.",
                accentColor: "#9080FF",
                glow: "rgba(144,128,255,0.20)",
              },
              {
                label: "Hotels",
                href: "/hotels",
                desc: "Find the perfect stay at your destination.",
                accentColor: "#E8728A",
                glow: "rgba(232,114,138,0.20)",
              },
              {
                label: "Car Rentals",
                href: "/car-rentals",
                desc: "Pick up wheels and explore at your own pace.",
                accentColor: "#F5C842",
                glow: "rgba(245,200,66,0.16)",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group block rounded-2xl p-6 transition"
                style={`background: rgba(255,255,255,0.07); border: 1px solid rgba(200,160,255,0.14); box-shadow: 0 8px 32px rgba(22,1,32,0.40)`}
              >
                <div
                  class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={`background: ${v.glow}; border: 1px solid rgba(200,160,255,0.16)`}
                >
                  <span style={`color: ${v.accentColor}`}>→</span>
                </div>
                <div
                  class="mb-2 text-lg font-semibold"
                  style="color: #FFF8F0; letter-spacing: -0.02em"
                >
                  {v.label}
                </div>
                <p class="text-sm" style="color: rgba(240,232,216,0.60); line-height: 1.6">
                  {v.desc}
                </p>
                <div
                  class="mt-4 text-sm font-semibold transition group-hover:translate-x-1"
                  style={`color: ${v.accentColor}`}
                >
                  Search {v.label.toLowerCase()} →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Why Andacity — rich gradient strip */}
        <section class="mt-14">
          <div
            class="overflow-hidden rounded-2xl p-px"
            style="background: linear-gradient(135deg, rgba(245,200,66,0.40), rgba(232,114,138,0.30), rgba(144,128,255,0.30))"
          >
            <div
              class="overflow-hidden rounded-2xl"
              style="background: linear-gradient(145deg, rgba(28,10,44,0.96), rgba(22,1,32,0.98))"
            >
              <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
                style="divide-color: rgba(200,160,255,0.12)"
              >
                {[
                  { stat: "All in one", label: "Flights, hotels, and cars planned without switching platforms.", accent: "#F5C842" },
                  { stat: "Live data", label: "Real-time availability and pricing across all verticals.", accent: "#E8728A" },
                  { stat: "One view", label: "Every booking assembled into a single shareable trip.", accent: "#9080FF" },
                ].map((item) => (
                  <div key={item.stat} class="px-8 py-7">
                    <div class="text-2xl font-bold" style={`color: ${item.accent}; letter-spacing: -0.02em`}>
                      {item.stat}
                    </div>
                    <p class="mt-2 text-sm" style="color: rgba(240,232,216,0.58); line-height: 1.6">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular destinations */}
        <section class="mt-14">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold md:text-3xl" style="color: #FFF8F0; letter-spacing: -0.02em">
              Popular destinations
            </h2>
            <a class="t-btn-ghost px-5 py-2.5 text-sm" href="/destinations">Explore all</a>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { city: "Miami", label: "Beach stays", color: "#E8728A" },
              { city: "New York", label: "City hotels", color: "#9080FF" },
              { city: "San Diego", label: "Coastal trips", color: "#E8728A" },
              { city: "Orlando", label: "Car rentals", color: "#F5C842" },
            ].map((d) => (
              <a
                key={d.city}
                href={`/destinations/${d.city.toLowerCase().replace(" ", "-")}`}
                class="group rounded-2xl p-5 transition"
                style="background: rgba(255,255,255,0.06); border: 1px solid rgba(200,160,255,0.14)"
              >
                <div class="mb-1 text-xs font-semibold uppercase tracking-wide" style={`color: ${d.color}`}>
                  {d.label}
                </div>
                <div class="text-base font-semibold" style="color: #FFF8F0">{d.city}</div>
                <div class="mt-3 text-sm font-medium transition group-hover:translate-x-1" style={`color: ${d.color}`}>
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
