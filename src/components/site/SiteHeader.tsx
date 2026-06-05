import { component$ } from "@builder.io/qwik";

const NAV = {
  primary: [
    { label: "Flights", href: "/flights" },
    { label: "Cars", href: "/car-rentals" },
    { label: "Trips", href: "/trips" },
    { label: "Explore", href: "/explore" },
  ],
  hotels: {
    actions: [
      { label: "Search hotels", href: "/hotels", hint: "Start a stay search" },
      { label: "Hotel cities", href: "/hotels/in", hint: "Indexable city guides" },
      { label: "Destinations", href: "/destinations", hint: "Plan the broader trip" },
    ],
    featured: [
      { label: "Miami", href: "/hotels/in/miami", hint: "Beach + nightlife" },
      { label: "Las Vegas", href: "/hotels/in/las-vegas", hint: "Resorts + shows" },
      { label: "New York", href: "/hotels/in/new-york", hint: "City stays" },
      { label: "Orlando", href: "/hotels/in/orlando", hint: "Theme parks" },
    ],
  },
  secondary: [{ label: "Destinations", href: "/destinations" }],
} as const;

const BRAND_LOGO_SRC =
  "/assets/logo/andacity-primary-color_mark-darkword_transparent.svg";

export const SiteHeader = component$(() => {
  return (
    <header
      class="sticky top-0 z-40"
      style="background: rgba(13,6,0,0.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(196,97,74,0.16); box-shadow: 0 2px 16px rgba(13,6,0,0.48)"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <div class="flex items-center gap-5">
          <a href="/" class="inline-flex items-center focus:outline-none" aria-label="Andacity home">
            <img src={BRAND_LOGO_SRC} class="h-8 w-auto brightness-0 invert opacity-90" width={160} height={48} alt="Andacity" />
          </a>

          {/* Desktop nav */}
          <nav class="hidden items-center gap-0 md:flex" aria-label="Primary navigation">
            {/* Hotels dropdown */}
            <div class="group relative">
              <a
                class="rounded px-4 py-2 text-sm font-medium transition hover:bg-white/06"
                style="color: rgba(239,230,214,0.72)"
                href="/hotels"
                aria-haspopup="menu"
              >
                Hotels
              </a>

              <div class="pointer-events-none absolute left-0 top-full mt-2 w-[500px] translate-y-1 opacity-0 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div
                  class="relative z-50 overflow-hidden rounded-2xl p-2"
                  style="background: rgba(26,14,6,0.97); border: 1px solid rgba(196,97,74,0.20); backdrop-filter: blur(20px); box-shadow: 0 20px 56px rgba(13,6,0,0.68)"
                >
                  <div
                    class="pointer-events-none absolute -top-1.5 left-6 size-3 rotate-45"
                    style="background: rgba(26,14,6,0.97); border-left: 1px solid rgba(196,97,74,0.20); border-top: 1px solid rgba(196,97,74,0.20)"
                  />

                  <div class="grid gap-2 sm:grid-cols-2">
                    {/* Left — terracotta column */}
                    <div class="rounded-xl p-3" style="background: rgba(196,97,74,0.07); border: 1px solid rgba(196,97,74,0.16)">
                      <div class="mb-2 flex items-center justify-between border-b pb-2" style="border-color: rgba(196,97,74,0.12)">
                        <span class="text-xs font-bold uppercase tracking-widest" style="color: #C4614A; letter-spacing: 0.08em">Hotels</span>
                        <a href="/hotels" class="text-xs transition hover:text-white/80" style="color: rgba(239,230,214,0.50)">All →</a>
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.actions.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-white/08"
                            >
                              <span class="mt-0.5" style="color: rgba(239,230,214,0.40)"><svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                              <span class="flex flex-col">
                                <span class="text-sm font-medium" style="color: #FBF4EA">{l.label}</span>
                                <span class="text-xs" style="color: rgba(239,230,214,0.50)">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div class="mt-2">
                        <a class="t-btn-primary w-full px-4 py-2 text-center text-sm" href="/hotels">Search hotels</a>
                      </div>
                    </div>

                    {/* Right — sage column */}
                    <div class="rounded-xl p-3" style="background: rgba(93,138,110,0.07); border: 1px solid rgba(93,138,110,0.18)">
                      <div class="mb-2 border-b pb-2 text-xs font-bold uppercase tracking-widest" style="border-color: rgba(93,138,110,0.14); color: #5D8A6E; letter-spacing: 0.08em">
                        Top cities
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.featured.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-white/08"
                            >
                              <span class="mt-0.5" style="color: rgba(239,230,214,0.40)"><svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true"><path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="2" /></svg></span>
                              <span class="flex flex-col">
                                <span class="text-sm font-medium" style="color: #FBF4EA">{l.label}</span>
                                <span class="text-xs" style="color: rgba(239,230,214,0.50)">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {NAV.primary.map((l) => (
              <a
                key={l.href}
                class="rounded px-4 py-2 text-sm font-medium transition hover:bg-white/06"
                style="color: rgba(239,230,214,0.72)"
                href={l.href}
              >
                {l.label}
              </a>
            ))}

            <span class="mx-2 h-4 w-px" style="background: rgba(196,97,74,0.22)" aria-hidden="true" />

            {NAV.secondary.map((l) => (
              <a
                key={l.href}
                class="rounded px-4 py-2 text-sm font-medium transition hover:bg-white/06"
                style="color: rgba(239,230,214,0.72)"
                href={l.href}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div class="hidden items-center gap-2 md:flex">
          <a class="t-btn-ghost px-4 py-2 text-sm" href="/my-trips">My Trips</a>
          <a class="t-btn-primary px-4 py-2 text-sm" href="/#global-search-entry">Search</a>
        </div>

        {/* Mobile */}
        <div class="md:hidden">
          <details class="group relative">
            <summary
              class="list-none rounded-lg p-2 [&::-webkit-details-marker]:hidden"
              style="border: 1px solid rgba(196,97,74,0.24); color: rgba(239,230,214,0.80)"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </summary>

            <div
              class="absolute right-0 top-full mt-2 w-[92vw] max-w-sm rounded-2xl p-2"
              style="background: rgba(26,14,6,0.97); border: 1px solid rgba(196,97,74,0.20); backdrop-filter: blur(20px); box-shadow: 0 20px 56px rgba(13,6,0,0.68)"
            >
              <div class="flex items-center justify-between px-3 py-2 mb-1"
                style="border-bottom: 1px solid rgba(196,97,74,0.12)"
              >
                <span class="text-sm font-semibold" style="color: #FBF4EA">Navigate</span>
                <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">Search</a>
              </div>

              {[
                { label: "Hotels", href: "/hotels" },
                ...NAV.primary.map(l => ({ label: l.label, href: l.href })),
                ...NAV.secondary.map(l => ({ label: l.label, href: l.href })),
              ].map((l) => (
                <a
                  key={l.href}
                  class="block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/06"
                  style="color: rgba(239,230,214,0.80)"
                  href={l.href}
                >
                  {l.label}
                </a>
              ))}

              <div class="mt-2 grid gap-2 px-1 pb-1 pt-2" style="border-top: 1px solid rgba(196,97,74,0.12)">
                <a class="t-btn-ghost px-4 py-2 text-center text-sm" href="/my-trips">My Trips</a>
                <a class="t-btn-primary px-4 py-2 text-center text-sm" href="/#global-search-entry">Search</a>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
});

