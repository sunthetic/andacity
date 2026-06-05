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
      { label: "Hotel cities", href: "/hotels/in", hint: "Indexable guides" },
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
      class="sticky top-0 z-40 border-b border-[rgba(15,23,42,0.12)] bg-white"
      style="box-shadow: 0 1px 3px rgba(15,23,42,0.06)"
    >
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <div class="flex items-center gap-4">
          <a href="/" class="inline-flex items-center focus:outline-none" aria-label="Andacity home">
            <img src={BRAND_LOGO_SRC} class="h-7 w-auto" width={160} height={48} alt="Andacity" />
          </a>

          {/* Desktop nav */}
          <nav class="hidden items-center gap-0 md:flex" aria-label="Primary navigation">
            {/* Hotels dropdown */}
            <div class="group relative">
              <a
                class="inline-flex items-center rounded px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                href="/hotels"
                aria-haspopup="menu"
              >
                Hotels
              </a>

              <div class="pointer-events-none absolute left-0 top-full mt-1 w-[480px] translate-y-1 opacity-0 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div
                  class="relative z-50 overflow-hidden rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-2"
                  style="box-shadow: 0 10px 28px rgba(15,23,42,0.14)"
                >
                  <div
                    class="pointer-events-none absolute -top-1.5 left-5 size-3 rotate-45 border-l border-t border-[rgba(15,23,42,0.10)] bg-white"
                  />
                  <div class="grid gap-1 sm:grid-cols-2">
                    {/* Left */}
                    <div class="rounded-lg bg-[#F0F4F8] p-3">
                      <div class="mb-2 flex items-center justify-between border-b border-[rgba(15,45,74,0.12)] pb-1.5">
                        <span class="text-xs font-semibold uppercase tracking-wide text-[#0F2D4A]">Hotels</span>
                        <a href="/hotels" class="text-xs text-[#64748B] hover:text-[#0F2D4A]">All →</a>
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.actions.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white"
                            >
                              <span class="mt-0.5 text-[#94A3B8]"><svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg></span>
                              <span class="flex flex-col">
                                <span class="font-medium text-[#0F172A]">{l.label}</span>
                                <span class="text-xs text-[#64748B]">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div class="mt-2 pt-1.5 border-t border-[rgba(15,45,74,0.10)]">
                        <a class="t-btn-primary w-full px-3 py-1.5 text-center text-sm" href="/hotels">
                          Search hotels
                        </a>
                      </div>
                    </div>

                    {/* Right */}
                    <div class="rounded-lg bg-[#FFFBEB] p-3">
                      <div class="mb-2 border-b border-[rgba(245,158,11,0.20)] pb-1.5 text-xs font-semibold uppercase tracking-wide text-[#92400E]">
                        Featured
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.featured.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white"
                            >
                              <span class="mt-0.5 text-[#94A3B8]"><svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true"><path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="2" /></svg></span>
                              <span class="flex flex-col">
                                <span class="font-medium text-[#0F172A]">{l.label}</span>
                                <span class="text-xs text-[#64748B]">{l.hint}</span>
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
                class="inline-flex items-center rounded px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}

            <span class="mx-1.5 h-4 w-px bg-[rgba(15,23,42,0.12)]" aria-hidden="true" />

            {NAV.secondary.map((l) => (
              <a
                key={l.href}
                class="inline-flex items-center rounded px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div class="hidden items-center gap-2 md:flex">
          <a class="t-btn-ghost px-3 py-1.5 text-sm" href="/my-trips">My Trips</a>
          <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">Search</a>
        </div>

        {/* Mobile */}
        <div class="md:hidden">
          <details class="group relative">
            <summary
              class="list-none rounded-lg border border-[rgba(15,23,42,0.12)] p-1.5 text-[#475569] [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </summary>

            <div
              class="absolute right-0 top-full mt-1 w-[92vw] max-w-sm rounded-xl border border-[rgba(15,23,42,0.12)] bg-white p-2"
              style="box-shadow: 0 16px 40px rgba(15,23,42,0.14)"
            >
              <div class="flex items-center justify-between px-2 py-2 mb-1 border-b border-[rgba(15,23,42,0.08)]">
                <span class="text-sm font-semibold text-[#0F172A]">Navigate</span>
                <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">Search</a>
              </div>

              <a class="block rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F1F5F9]" href="/hotels">Hotels</a>
              <div class="ml-2 border-l border-[rgba(15,23,42,0.08)]">
                {[...NAV.hotels.actions, ...NAV.hotels.featured].map((l) => (
                  <a key={l.href} class="block rounded-lg px-3 py-1.5 text-sm text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]" href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>
              <div class="my-1 border-t border-[rgba(15,23,42,0.08)]" />
              {NAV.primary.map((l) => (
                <a key={l.href} class="block rounded-lg px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F1F5F9]" href={l.href}>
                  {l.label}
                </a>
              ))}
              <div class="mt-2 grid gap-2 border-t border-[rgba(15,23,42,0.08)] px-1 pt-2 pb-1">
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

