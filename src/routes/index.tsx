import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO — Dense SaaS / Command Center ────────────── */}
      <section
        style="background: linear-gradient(165deg, #071828 0%, #0F2D4A 45%, #1A4A72 70%, #0F2D4A 100%)"
      >
        {/* Top utility bar */}
        <div class="border-b border-white/10">
          <div class="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-4">
            <div class="flex items-center gap-4 text-xs text-white/50">
              <span class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full bg-green-400" />
                Live rates active
              </span>
              <span>·</span>
              <span>Flights · Hotels · Cars</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-white/50">
              <a href="/my-trips" class="hover:text-white/80 transition">My Trips</a>
              <a href="/account" class="hover:text-white/80 transition">Account</a>
            </div>
          </div>
        </div>

        <div class="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div class="mb-4 flex items-center gap-3">
            <span
              class="rounded px-2 py-0.5 text-xs font-semibold tracking-wide"
              style="background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.30)"
            >
              All verticals
            </span>
            <span class="text-xs text-white/50 font-mono">Search · Compare · Book</span>
          </div>

          <h1
            class="text-4xl font-bold text-white md:text-5xl"
            style="letter-spacing: -0.02em; line-height: 1.12"
          >
            Compare everything.
            <br />
            <span style="color: #F59E0B">Book once.</span>
          </h1>

          <p class="mt-3 max-w-lg text-sm text-white/60 md:text-base" style="line-height: 1.6">
            Flight routes, hotel inventory, and car availability — all
            searchable from a single entry point.
          </p>

          {/* Search box */}
          <div
            class="mt-8 rounded-xl border border-white/10 bg-white p-5"
            style="box-shadow: 0 20px 48px rgba(7,24,40,0.40)"
          >
            <div class="mb-3 flex items-center justify-between border-b border-[rgba(15,23,42,0.08)] pb-3">
              <span class="text-sm font-semibold text-[#020617]">Search</span>
              <span class="text-xs text-[#64748B]">Flights · Hotels · Cars</span>
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
      </section>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 py-10">

        {/* Quick-access vertical strip */}
        <section>
          <div class="mb-4 flex items-center gap-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-[#475569]">
              Booking categories
            </h2>
            <div class="flex-1 border-t border-[rgba(15,23,42,0.08)]" />
          </div>

          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Flights",
                href: "/flights",
                desc: "Routes, fares, and schedules",
                accent: "#0F2D4A",
                accentSoft: "#F0F4F8",
              },
              {
                label: "Hotels",
                href: "/hotels",
                desc: "Destination, dates, guests",
                accent: "#F59E0B",
                accentSoft: "#FFFBEB",
              },
              {
                label: "Car Rentals",
                href: "/car-rentals",
                desc: "City pickup, daily rates",
                accent: "#0F2D4A",
                accentSoft: "#F0F4F8",
              },
              {
                label: "Explore",
                href: "/explore",
                desc: "Discover destinations",
                accent: "#475569",
                accentSoft: "#F1F5F9",
              },
            ].map((v) => (
              <a
                key={v.href}
                href={v.href}
                class="group flex items-center gap-3 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition hover:border-[rgba(15,23,42,0.20)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.10)]"
              >
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={`background: ${v.accentSoft}; color: ${v.accent}`}
                >
                  →
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-[#0F172A]">{v.label}</div>
                  <div class="truncate text-xs text-[#64748B]">{v.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Feature table */}
        <section class="mt-10">
          <div class="mb-4 flex items-center gap-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-[#475569]">Platform</h2>
            <div class="flex-1 border-t border-[rgba(15,23,42,0.08)]" />
          </div>

          <div class="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.10)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {[
              {
                label: "Unified search",
                desc: "Flights, hotels, and cars from one entry without context switching.",
                tag: "Core",
              },
              {
                label: "Live availability",
                desc: "Real-time inventory across all booking verticals.",
                tag: "Data",
              },
              {
                label: "Trip assembly",
                desc: "All bookings linked in a single shareable trip view.",
                tag: "Trips",
              },
            ].map((row, i) => (
              <div
                key={row.label}
                class={`flex items-center gap-4 px-5 py-4 ${i < 2 ? "border-b border-[rgba(15,23,42,0.08)]" : ""}`}
              >
                <div
                  class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                  style="background: #F0F4F8; color: #0F2D4A; border: 1px solid rgba(15,45,74,0.16)"
                >
                  {row.tag}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-[#0F172A]">{row.label}</div>
                  <div class="mt-0.5 text-xs text-[#64748B]">{row.desc}</div>
                </div>
                <div class="shrink-0 text-[#F59E0B]">✓</div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular destinations — compact list */}
        <section class="mt-10">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-[#475569]">Popular</h2>
              <div class="w-16 border-t border-[rgba(15,23,42,0.08)]" />
            </div>
            <a class="t-btn-ghost px-4 py-1.5 text-xs" href="/destinations">All destinations</a>
          </div>

          <div class="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.10)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {[
              { city: "Miami", meta: "Beach stays · Nonstop routes", tag: "HOT" },
              { city: "New York", meta: "City hotels · Dense inventory", tag: "CITY" },
              { city: "San Diego", meta: "Coastal drives · Car friendly", tag: "DRIVE" },
              { city: "Orlando", meta: "Theme parks · Rentals", tag: "FAM" },
            ].map((d, i) => (
              <a
                key={d.city}
                href={`/destinations/${d.city.toLowerCase().replace(" ", "-")}`}
                class={`group flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] ${i < 3 ? "border-b border-[rgba(15,23,42,0.08)]" : ""}`}
              >
                <div
                  class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style="background: #FFFBEB; color: #92400E; border: 1px solid rgba(245,158,11,0.30)"
                >
                  {d.tag}
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-semibold text-[#0F172A]">{d.city}</span>
                  <span class="ml-2 text-xs text-[#64748B]">{d.meta}</span>
                </div>
                <span class="shrink-0 text-sm text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#0F2D4A]">→</span>
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
