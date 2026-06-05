import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO — Photography-Forward Ocean Gradient ─────── */}
      <section
        class="relative overflow-hidden"
        style="background: linear-gradient(145deg, #0A2A26 0%, #0D3E38 35%, #1A5048 55%, #0F7065 75%, #047A6E 100%); min-height: 620px"
      >
        <div
          class="pointer-events-none absolute inset-0"
          style="background: radial-gradient(52% 60% at 92% 10%, rgba(249,123,92,0.22) 0%, transparent 70%), radial-gradient(40% 40% at 5% 80%, rgba(4,122,110,0.30) 0%, transparent 70%)"
        />
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.04]"
          style="background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 48px 48px"
        />

        <div class="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div class="grid gap-10 lg:grid-cols-[1fr_480px] lg:items-center">
            {/* Left — editorial headline */}
            <div>
              <div
                class="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
                style="border-color: rgba(249,123,92,0.50); background: rgba(249,123,92,0.10)"
              >
                <span class="h-1.5 w-1.5 rounded-full" style="background: #F97B5C" />
                <span class="text-xs font-semibold tracking-wide text-white/80">
                  Travel Planning, Simplified
                </span>
              </div>

              <h1
                class="text-5xl font-bold text-white md:text-6xl lg:text-7xl"
                style="line-height: 1.08; letter-spacing: -0.025em"
              >
                Find your
                <br />
                <span style="color: #F97B5C">next escape.</span>
              </h1>

              <p class="mt-5 max-w-md text-base text-white/70 md:text-lg" style="line-height: 1.6">
                Flights, hotels, and car rentals — all in one place. Start
                with a destination, or let the map inspire you.
              </p>

              <div class="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "Search flights", href: "/flights" },
                  { label: "Browse hotels", href: "/hotels" },
                  { label: "Rent a car", href: "/car-rentals" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    class="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-white/40 hover:text-white hover:bg-white/10"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right — search card */}
            <div
              class="rounded-3xl bg-white p-6"
              style="box-shadow: 0 24px 64px rgba(14,30,46,0.30); border: 1px solid rgba(27,45,66,0.08)"
            >
              <div class="mb-4 flex items-center justify-between">
                <span class="text-sm font-semibold text-[#0E1E2E]">Where are you going?</span>
                <span class="rounded-full bg-[#F0FAFA] px-2.5 py-0.5 text-xs font-medium text-[#047A6E]">
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

        <div
          class="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style="background: linear-gradient(180deg, transparent, #FAFCFB)"
        />
      </section>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-14">

        {/* Verticals */}
        <section>
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-[#0E1E2E] md:text-4xl" style="letter-spacing: -0.02em">
              Plan every part
            </h2>
            <p class="mt-2 text-[#4A6272]">Book the flight, choose the stay, grab the keys.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Flights",
                href: "/flights",
                desc: "Compare routes and find the best fares to any destination.",
                accent: "#047A6E",
                accentSoft: "#F0FAFA",
                icon: "✈",
              },
              {
                label: "Hotels",
                href: "/hotels",
                desc: "Search stays by destination, dates, and number of guests.",
                accent: "#F97B5C",
                accentSoft: "#FFF0EC",
                icon: "🏨",
              },
              {
                label: "Car Rentals",
                href: "/car-rentals",
                desc: "Pick up a rental at your destination and explore on your terms.",
                accent: "#047A6E",
                accentSoft: "#F0FAFA",
                icon: "🚗",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group block rounded-3xl border border-[rgba(27,45,66,0.08)] bg-white p-6 shadow-[0_4px_20px_rgba(27,45,66,0.08)] transition hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(27,45,66,0.14)]"
              >
                <div
                  class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                  style={`background: ${v.accentSoft}`}
                >
                  {v.icon}
                </div>
                <div class="text-lg font-semibold text-[#0E1E2E]" style="letter-spacing: -0.02em">
                  {v.label}
                </div>
                <p class="mt-2 text-sm text-[#4A6272]" style="line-height: 1.6">{v.desc}</p>
                <div
                  class="mt-4 text-sm font-semibold transition group-hover:translate-x-1"
                  style={`color: ${v.accent}`}
                >
                  Search {v.label.toLowerCase()} →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Why Andacity — ocean gradient strip */}
        <section class="mt-14">
          <div
            class="overflow-hidden rounded-3xl"
            style="background: linear-gradient(145deg, #0A2A26, #047A6E)"
          >
            <div class="grid sm:grid-cols-3 divide-y divide-white/10 sm:divide-y-0 sm:divide-x">
              {[
                { stat: "All in one", label: "Plan flights, hotels, and cars without switching apps." },
                { stat: "Live search", label: "Real-time availability across all booking categories." },
                { stat: "Trip view", label: "Every booking in a single shareable trip itinerary." },
              ].map((item) => (
                <div key={item.stat} class="px-8 py-8">
                  <div class="text-2xl font-bold text-white" style="letter-spacing: -0.02em">
                    {item.stat}
                  </div>
                  <p class="mt-2 text-sm text-white/65" style="line-height: 1.6">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular destinations */}
        <section class="mt-14">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-[#0E1E2E] md:text-3xl" style="letter-spacing: -0.02em">
              Popular destinations
            </h2>
            <a class="t-btn-ghost px-5 py-2.5 text-sm" href="/destinations">Explore all</a>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { city: "Miami", label: "Beach & Stays", href: "/destinations/miami", color: "#F97B5C" },
              { city: "New York", label: "City Hotels", href: "/hotels/in/new-york", color: "#047A6E" },
              { city: "San Diego", label: "Coastal Trips", href: "/destinations/san-diego", color: "#F97B5C" },
              { city: "Orlando", label: "Car Rentals", href: "/car-rentals/in/orlando", color: "#047A6E" },
            ].map((d) => (
              <a
                key={d.city}
                href={d.href}
                class="group rounded-2xl border border-[rgba(27,45,66,0.08)] bg-white p-5 shadow-[0_2px_8px_rgba(27,45,66,0.06)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(27,45,66,0.12)]"
              >
                <div class="mb-1 text-xs font-semibold uppercase tracking-wide" style={`color: ${d.color}`}>
                  {d.label}
                </div>
                <div class="text-base font-semibold text-[#0E1E2E]">{d.city}</div>
                <div
                  class="mt-3 text-sm font-medium transition group-hover:translate-x-1"
                  style={`color: ${d.color}`}
                >
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
