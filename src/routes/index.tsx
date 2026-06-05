import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO — BOLD DEPARTURE BOARD STYLE ─────────────── */}
      <section class="border-b-2 border-[#0A0A08] bg-[#F8F8F5]">
        <div class="mx-auto max-w-6xl px-4 pt-12 pb-0">
          {/* Grid: big text left, search right */}
          <div class="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
            {/* Left — departure board type headline */}
            <div class="pt-4">
              <div class="mb-6 inline-flex items-center gap-3 border-2 border-[#0A0A08] bg-[#AAFF00] px-4 py-2 shadow-[2px_2px_0_#0A0A08]">
                <span
                  class="h-2 w-2 border border-[#0A0A08]"
                  style="background:#0A0A08"
                />
                <span class="text-xs font-black uppercase tracking-widest text-[#050502]">
                  Andacity · Travel Platform
                </span>
              </div>

              <h1
                class="text-7xl font-black uppercase text-[#050502] md:text-8xl lg:text-9xl"
                style="line-height: 0.92; letter-spacing: -0.04em"
              >
                WHERE
                <br />
                <span style="color: #0050FF">TO?</span>
              </h1>

              <p class="mt-6 max-w-sm border-l-4 border-[#0A0A08] pl-4 text-sm font-semibold uppercase tracking-wide text-[#4A4A3E]">
                Flights · Hotels · Cars · Exploration
                <br />
                All in one platform. Zero friction.
              </p>

              {/* Quick action tiles */}
              <div class="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {[
                  { label: "FLIGHTS", href: "/flights", bg: "#0050FF", color: "#F8F8F5" },
                  { label: "HOTELS", href: "/hotels", bg: "#FF3B30", color: "#F8F8F5" },
                  { label: "CARS", href: "/car-rentals", bg: "#AAFF00", color: "#050502" },
                  { label: "EXPLORE", href: "/explore", bg: "#F8F8F5", color: "#050502" },
                ].map((v) => (
                  <a
                    key={v.href}
                    href={v.href}
                    class="flex items-center justify-between border-2 border-[#0A0A08] px-4 py-3 font-black uppercase tracking-tight transition hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    style={`background: ${v.bg}; color: ${v.color}; font-size: 0.8rem; box-shadow: 3px 3px 0 #0A0A08; letter-spacing: -0.01em`}
                  >
                    {v.label}
                    <span class="text-lg leading-none">↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Right — search form in bordered card */}
            <div
              class="border-2 border-[#0A0A08] bg-white p-6"
              style="box-shadow: 4px 4px 0 #0A0A08; margin-top: 0"
            >
              <div class="mb-4 flex items-center justify-between border-b-2 border-[#0A0A08] pb-3">
                <span class="text-sm font-black uppercase tracking-widest text-[#050502]">
                  Search
                </span>
                <span class="text-xs font-bold uppercase tracking-wide text-[#787870]">
                  All verticals
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

        {/* Ticker strip */}
        <div
          class="mt-8 border-y-2 border-[#0A0A08] bg-[#0A0A08] px-4 py-2"
          aria-hidden="true"
        >
          <div class="flex items-center gap-6 overflow-hidden text-xs font-bold uppercase tracking-widest text-[#AAFF00]">
            {["JFK → LAX", "ORD → MIA", "SFO → SEA", "BOS → DFW", "NYC HOTELS", "ORLANDO CARS", "LAS VEGAS STAYS", "MIAMI BEACH", "JFK → LAX"].map((item, i) => (
              <span key={i} class="shrink-0 whitespace-nowrap">
                {item} <span class="text-[#787870]">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN ───────────────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-12">
        {/* ── VERTICALS GRID ──────────────────────────────── */}
        <section id="verticals">
          <div class="mb-6 flex items-center justify-between gap-4">
            <h2
              class="text-3xl font-black uppercase text-[#050502] md:text-4xl"
              style="letter-spacing: -0.03em"
            >
              Book anything
            </h2>
            <div class="h-1 flex-1 bg-[#0A0A08]" />
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "FLIGHTS",
                href: "/flights",
                desc: "Compare routes and schedules.",
                num: "01",
                accent: "#0050FF",
                textOnAccent: "#F8F8F5",
              },
              {
                label: "HOTELS",
                href: "/hotels",
                desc: "Search stays by destination and dates.",
                num: "02",
                accent: "#FF3B30",
                textOnAccent: "#F8F8F5",
              },
              {
                label: "CAR RENTALS",
                href: "/car-rentals",
                desc: "City-by-city rental availability.",
                num: "03",
                accent: "#AAFF00",
                textOnAccent: "#050502",
              },
              {
                label: "EXPLORE",
                href: "/explore",
                desc: "Find destinations by mood or budget.",
                num: "04",
                accent: "#F8F8F5",
                textOnAccent: "#050502",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group block border-2 border-[#0A0A08] bg-white p-5 transition"
                style="box-shadow: 3px 3px 0 #0A0A08"
              >
                <div
                  class="mb-4 inline-flex items-center gap-2 border border-[#0A0A08] px-2 py-0.5"
                  style={`background: ${v.accent}; color: ${v.textOnAccent}`}
                >
                  <span class="font-mono text-xs font-black">{v.num}</span>
                  <span class="text-xs font-black uppercase tracking-tight">{v.label}</span>
                </div>
                <p class="text-sm font-medium text-[#4A4A3E]">{v.desc}</p>
                <div class="mt-4 text-lg font-black text-[#0A0A08] transition group-hover:translate-x-1">
                  →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── WHY ANDACITY — DATA TABLE STYLE ──────────────── */}
        <section class="mt-12">
          <div
            class="border-2 border-[#0A0A08]"
            style="box-shadow: 4px 4px 0 #0A0A08"
          >
            <div class="border-b-2 border-[#0A0A08] bg-[#0A0A08] px-5 py-3">
              <h2 class="text-sm font-black uppercase tracking-widest text-[#AAFF00]">
                Why Andacity
              </h2>
            </div>

            <div class="grid divide-y-2 divide-[#0A0A08] bg-white md:grid-cols-3 md:divide-x-2 md:divide-y-0">
              {[
                {
                  title: "Unified Planning",
                  body: "Flights, stays, and transport — planned together without re-entering your trip context.",
                  tag: "CORE",
                },
                {
                  title: "Search + Discovery",
                  body: "Live search paired with destination guides so you can book with complete information.",
                  tag: "UX",
                },
                {
                  title: "One Trip View",
                  body: "All bookings assembled into a single shareable itinerary with every detail in one place.",
                  tag: "TRIPS",
                },
              ].map((item) => (
                <div key={item.title} class="p-5">
                  <div class="mb-3 inline-block border border-[#0A0A08] bg-[#AAFF00] px-2 py-0.5 text-xs font-black uppercase tracking-wide text-[#050502]">
                    {item.tag}
                  </div>
                  <div class="text-base font-black uppercase tracking-tight text-[#050502]">
                    {item.title}
                  </div>
                  <p class="mt-2 text-sm text-[#4A4A3E]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── POPULAR ROUTES — DEPARTURE BOARD STYLE ────────── */}
        <section class="mt-12">
          <div class="mb-4 flex items-center gap-4">
            <h2
              class="text-3xl font-black uppercase text-[#050502] md:text-4xl"
              style="letter-spacing: -0.03em"
            >
              Popular
            </h2>
            <div class="h-1 flex-1 bg-[#0A0A08]" />
            <a
              class="t-btn-ghost px-4 py-2 text-xs"
              href="/destinations"
            >
              All →
            </a>
          </div>

          <div
            class="border-2 border-[#0A0A08]"
            style="box-shadow: 4px 4px 0 #0A0A08"
          >
            {/* Header row */}
            <div class="grid grid-cols-[1fr_auto] border-b-2 border-[#0A0A08] bg-[#0A0A08] px-4 py-2 md:grid-cols-[1fr_auto_auto]">
              <span class="text-xs font-black uppercase tracking-widest text-[#AAFF00]">Destination</span>
              <span class="hidden text-xs font-black uppercase tracking-widest text-[#AAFF00] md:block">Type</span>
              <span class="text-xs font-black uppercase tracking-widest text-[#AAFF00]">Go</span>
            </div>

            {[
              { city: "Miami", note: "Beach stays · nonstop routes", type: "HOTEL", href: "/destinations/miami" },
              { city: "New York", note: "Dense inventory · city transit", type: "HOTEL", href: "/hotels/in/new-york" },
              { city: "San Diego", note: "Coastal neighborhoods · drives", type: "CITY", href: "/destinations/san-diego" },
              { city: "Orlando", note: "Rental-friendly · theme parks", type: "CAR", href: "/car-rentals/in/orlando" },
            ].map((d, i) => (
              <a
                key={d.city}
                href={d.href}
                class="group grid grid-cols-[1fr_auto] items-center border-b border-[#0A0A08] bg-white px-4 py-4 last:border-b-0 hover:bg-[#AAFF00] md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <div class="font-black uppercase tracking-tight text-[#050502]">{d.city}</div>
                  <div class="text-xs text-[#787870]">{d.note}</div>
                </div>
                <div class="hidden md:block">
                  <span class="border border-[#0A0A08] bg-[#F8F8F5] px-2 py-0.5 text-xs font-black uppercase tracking-wide">
                    {d.type}
                  </span>
                </div>
                <div class="text-lg font-black text-[#0A0A08] transition group-hover:translate-x-1">→</div>
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
