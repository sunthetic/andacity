import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { GlobalSearchEntry } from "~/components/search-entry/GlobalSearchEntry";

export default component$(() => {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section class="relative isolate overflow-hidden">
        {/* Gradient mesh background */}
        <div
          class="absolute inset-0 -z-10"
          style="background:
            radial-gradient(90rem 60rem at 20% -10%, rgba(75,145,250,0.18) 0%, transparent 55%),
            radial-gradient(70rem 50rem at 88% 20%, rgba(158,126,255,0.14) 0%, transparent 55%),
            radial-gradient(50rem 40rem at 50% 100%, rgba(52,211,153,0.06) 0%, transparent 50%),
            #080E1F;"
          aria-hidden="true"
        />
        {/* Subtle grid texture */}
        <div
          class="absolute inset-0 -z-10 opacity-[0.03]"
          style="background-image: linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 60px 60px;"
          aria-hidden="true"
        />

        <div class="mx-auto max-w-6xl px-4 pt-20 pb-6 md:pt-28 lg:pt-36">
          {/* Headline cluster */}
          <div class="mx-auto max-w-3xl text-center">
            <div class="inline-flex items-center gap-2 rounded-full border border-[rgba(75,145,250,0.28)] bg-[rgba(75,145,250,0.08)] px-4 py-1.5 text-xs font-medium text-[color:var(--color-text-muted)] backdrop-blur-sm">
              <span class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-action)] animate-pulse" />
              Andacity Travel Platform
            </div>

            <h1
              class="mt-6 text-5xl font-bold tracking-[-0.04em] text-[color:var(--color-text-strong)] md:text-7xl lg:text-8xl"
              style="line-height:1.04"
            >
              Every journey,{" "}
              <span
                style="background: linear-gradient(135deg, #4B91FA 0%, #9E7EFF 55%, #C47EFF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
              >
                one platform.
              </span>
            </h1>

            <p class="mt-6 text-base leading-7 text-[color:var(--color-text-muted)] md:text-lg md:leading-8">
              Search flights, book stays, reserve wheels — then bring it all
              together into a single trip. Less switching. Better planning.
            </p>
          </div>

          {/* Search entry */}
          <div class="mx-auto mt-10 max-w-5xl">
            <GlobalSearchEntry
              id="global-search-entry"
              class="text-left"
              eyebrow="Search everything"
              title="Start with flights, hotels, or cars"
              description="Every form routes into the full search flow"
            />
          </div>

          {/* Quick nav pills */}
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "✈ Flights", href: "/flights" },
              { label: "🏨 Hotels", href: "/hotels" },
              { label: "🚗 Car Rentals", href: "/car-rentals" },
              { label: "🧭 Explore", href: "/explore" },
              { label: "🗺 My Trips", href: "/my-trips" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                class="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-5 py-2 text-sm font-medium text-[color:var(--color-text-muted)] backdrop-blur-sm transition hover:border-[rgba(75,145,250,0.40)] hover:bg-[rgba(75,145,250,0.10)] hover:text-[color:var(--color-text-strong)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── VERTICALS ──────────────────────────────────────── */}
      <main class="mx-auto max-w-6xl px-4 pb-16 pt-14">
        <section id="verticals">
          <div class="mb-8 flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-action)] opacity-80">
                All travel, one place
              </p>
              <h2 class="mt-1.5 text-2xl font-bold tracking-tight text-[color:var(--color-text-strong)] md:text-3xl">
                Start from any angle
              </h2>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Flights */}
            <a
              href="/flights"
              class="group relative overflow-hidden rounded-2xl border border-[rgba(75,145,250,0.18)] bg-[rgba(75,145,250,0.05)] p-6 transition hover:border-[rgba(75,145,250,0.38)] hover:bg-[rgba(75,145,250,0.09)]"
              style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)"
            >
              <div
                class="absolute inset-x-0 top-0 h-px"
                style="background: linear-gradient(90deg, transparent, rgba(75,145,250,0.5), transparent)"
              />
              <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(75,145,250,0.14)] text-[color:var(--color-action)] ring-1 ring-[rgba(75,145,250,0.20)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M2 16.5v-2l8-1.5V6a1 1 0 0 1 2 0v6.5l8 2v2l-8-1v4l2 1v1.5L11 22l-3 0.5V21l2-1v-4z" />
                </svg>
              </div>
              <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                Flights
              </div>
              <div class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                Compare routes, stops, and cabin options with a focused search flow.
              </div>
              <div class="mt-5 text-sm font-semibold text-[color:var(--color-action)]">
                Search flights →
              </div>
            </a>

            {/* Hotels */}
            <a
              href="/hotels"
              class="group relative overflow-hidden rounded-2xl border border-[rgba(196,126,255,0.18)] bg-[rgba(158,126,255,0.05)] p-6 transition hover:border-[rgba(196,126,255,0.38)] hover:bg-[rgba(158,126,255,0.09)]"
              style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)"
            >
              <div
                class="absolute inset-x-0 top-0 h-px"
                style="background: linear-gradient(90deg, transparent, rgba(196,126,255,0.5), transparent)"
              />
              <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(158,126,255,0.14)] text-[#C47EFF] ring-1 ring-[rgba(158,126,255,0.20)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M3 21v-9a2 2 0 0 1 2-2h2V6a3 3 0 0 1 6 0v4h6a2 2 0 0 1 2 2v9h-2v-3H5v3H3zm10-11V6a1 1 0 1 0-2 0v4h2z" />
                </svg>
              </div>
              <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                Hotels
              </div>
              <div class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                Search stays by destination, dates, and guests, or browse city hubs.
              </div>
              <div class="mt-5 text-sm font-semibold text-[#C47EFF]">
                Search hotels →
              </div>
            </a>

            {/* Car Rentals */}
            <a
              href="/car-rentals"
              class="group relative overflow-hidden rounded-2xl border border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.05)] p-6 transition hover:border-[rgba(52,211,153,0.38)] hover:bg-[rgba(52,211,153,0.09)]"
              style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)"
            >
              <div
                class="absolute inset-x-0 top-0 h-px"
                style="background: linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)"
              />
              <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(52,211,153,0.14)] text-[#34D399] ring-1 ring-[rgba(52,211,153,0.20)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4 14l1.2-4.2A3 3 0 0 1 8.1 7.5h7.8a3 3 0 0 1 2.9 2.3L20 14v5h-2v-1H6v1H4v-5zm2.3-1h11.4l-.8-2.6a1 1 0 0 0-1-.7H8.1a1 1 0 0 0-1 .7L6.3 13zM8 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                </svg>
              </div>
              <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                Car Rentals
              </div>
              <div class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                Find pickup-friendly rentals with city-by-city availability.
              </div>
              <div class="mt-5 text-sm font-semibold text-[#34D399]">
                Search rentals →
              </div>
            </a>

            {/* Explore */}
            <a
              href="/explore"
              class="group relative overflow-hidden rounded-2xl border border-[rgba(255,184,0,0.18)] bg-[rgba(255,184,0,0.04)] p-6 transition hover:border-[rgba(255,184,0,0.38)] hover:bg-[rgba(255,184,0,0.08)]"
              style="box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)"
            >
              <div
                class="absolute inset-x-0 top-0 h-px"
                style="background: linear-gradient(90deg, transparent, rgba(255,184,0,0.5), transparent)"
              />
              <div class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(255,184,0,0.14)] text-[#FFB800] ring-1 ring-[rgba(255,184,0,0.20)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
              </div>
              <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                Explore
              </div>
              <div class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                Discover destinations by season, mood, or budget when you have no fixed plan.
              </div>
              <div class="mt-5 text-sm font-semibold text-[#FFB800]">
                Start exploring →
              </div>
            </a>
          </div>
        </section>

        {/* ── WHY ANDACITY ─────────────────────────────────── */}
        <section class="mt-14">
          <div
            class="relative overflow-hidden rounded-2xl p-8 md:p-10"
            style="background: linear-gradient(145deg, rgba(75,145,250,0.06), rgba(158,126,255,0.05), rgba(255,184,0,0.03)); border: 1px solid rgba(75,145,250,0.14); box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)"
          >
            <div
              class="absolute inset-x-0 top-0 h-px"
              style="background: linear-gradient(90deg, transparent, rgba(75,145,250,0.4), rgba(158,126,255,0.4), transparent)"
              aria-hidden="true"
            />
            <p class="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-text-subtle)]">
              Why Andacity
            </p>
            <h2 class="mt-2 text-xl font-bold tracking-tight text-[color:var(--color-text-strong)] md:text-2xl">
              Built to remove travel friction
            </h2>

            <div class="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Unified planning",
                  body: "Move from flights to stays to transportation without leaving or restarting.",
                  accent: "#4B91FA",
                },
                {
                  title: "Search + discovery",
                  body: "Direct booking flows with destination context so decisions happen faster.",
                  accent: "#9E7EFF",
                },
                {
                  title: "One trip view",
                  body: "Everything across verticals assembled into a single shareable itinerary.",
                  accent: "#34D399",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  class="rounded-xl p-4"
                  style={`background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid ${item.accent}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.03)`}
                >
                  <div class="text-sm font-bold text-[color:var(--color-text-strong)]">
                    {item.title}
                  </div>
                  <p class="mt-1.5 text-sm leading-5 text-[color:var(--color-text-muted)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── POPULAR DESTINATIONS ─────────────────────────── */}
        <section class="mt-14">
          <div class="mb-6 flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-highlight)] opacity-80">
                Popular destinations
              </p>
              <h2 class="mt-1.5 text-2xl font-bold tracking-tight text-[color:var(--color-text-strong)]">
                Where to next?
              </h2>
            </div>
            <a class="t-btn-ghost px-4 py-2 text-sm" href="/destinations">
              All destinations
            </a>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { city: "Miami", note: "Beach stays · nonstop routes", href: "/destinations/miami", color: "#4B91FA" },
              { city: "New York", note: "Dense hotel inventory · city transit", href: "/hotels/in/new-york", color: "#9E7EFF" },
              { city: "San Diego", note: "Coastal neighborhoods · easy drives", href: "/destinations/san-diego", color: "#34D399" },
              { city: "Orlando", note: "Rental-friendly · theme parks", href: "/car-rentals/in/orlando", color: "#FFB800" },
            ].map((d) => (
              <a
                key={d.city}
                href={d.href}
                class="group relative overflow-hidden rounded-2xl p-5 transition"
                style={`background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid ${d.color}40; box-shadow: 0 4px 16px rgba(0,0,0,0.25)`}
              >
                <div
                  class="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  style={`background: radial-gradient(40rem 20rem at 0% 50%, ${d.color}0A, transparent 60%)`}
                />
                <div
                  class="mb-2 h-0.5 w-8 rounded-full transition-all group-hover:w-12"
                  style={`background: ${d.color}`}
                />
                <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                  {d.city}
                </div>
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {d.note}
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
