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
      class="sticky top-0 z-40"
      style="background: rgba(250,252,251,0.94); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(27,45,66,0.08); box-shadow: 0 2px 12px rgba(27,45,66,0.06)"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <div class="flex items-center gap-4">
          <a href="/" class="inline-flex items-center focus:outline-none" aria-label="Andacity home">
            <img src={BRAND_LOGO_SRC} class="h-8 w-auto" width={160} height={48} alt="Andacity" />
          </a>

          {/* Desktop nav */}
          <nav class="hidden items-center gap-0.5 md:flex" aria-label="Primary navigation">
            {/* Hotels dropdown */}
            <div class="group relative">
              <a
                class="rounded-full px-4 py-2 text-sm font-medium text-[#4A6272] transition hover:bg-[#F0FAFA] hover:text-[#047A6E]"
                href="/hotels"
                aria-haspopup="menu"
              >
                Hotels
              </a>

              <div class="pointer-events-none absolute left-0 top-full mt-2 w-[500px] translate-y-1 opacity-0 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div
                  class="relative z-50 overflow-hidden rounded-2xl bg-white p-2"
                  style="border: 1px solid rgba(27,45,66,0.10); box-shadow: 0 16px 48px rgba(27,45,66,0.18)"
                >
                  <div
                    class="pointer-events-none absolute -top-1.5 left-6 size-3 rotate-45 bg-white"
                    style="border-left: 1px solid rgba(27,45,66,0.10); border-top: 1px solid rgba(27,45,66,0.10)"
                  />

                  <div class="grid gap-2 p-1 sm:grid-cols-2">
                    {/* Left: actions */}
                    <div class="rounded-xl bg-[#F0FAFA] p-3">
                      <div class="flex items-center justify-between gap-2 border-b border-[rgba(27,45,66,0.08)] pb-2 mb-2">
                        <div class="text-xs font-semibold uppercase tracking-wide text-[#047A6E]">Hotels</div>
                        <a href="/hotels" class="text-xs text-[#4A6272] hover:text-[#047A6E]">View all</a>
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.actions.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-white"
                            >
                              <span class="mt-0.5 text-[#7A9098] group-hover/item:text-[#047A6E]"><IconBolt /></span>
                              <span class="flex flex-col">
                                <span class="text-sm font-medium text-[#0E1E2E]">{l.label}</span>
                                <span class="text-xs text-[#4A6272]">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div class="mt-3">
                        <a class="t-btn-primary w-full px-4 py-2 text-center text-sm" href="/hotels">
                          Search hotels
                        </a>
                      </div>
                    </div>

                    {/* Right: featured */}
                    <div class="rounded-xl bg-[#FFF0EC] p-3">
                      <div class="text-xs font-semibold uppercase tracking-wide text-[#C24020] border-b border-[rgba(249,123,92,0.20)] pb-2 mb-2">
                        Featured
                      </div>
                      <ul class="grid gap-0.5" role="menu">
                        {NAV.hotels.featured.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-white"
                            >
                              <span class="mt-0.5 text-[#7A9098] group-hover/item:text-[#F97B5C]"><IconPin /></span>
                              <span class="flex flex-col">
                                <span class="text-sm font-medium text-[#0E1E2E]">{l.label}</span>
                                <span class="text-xs text-[#4A6272]">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <a
                        href="/hotels/in"
                        class="mt-3 block text-center text-xs font-semibold text-[#F97B5C] hover:underline"
                      >
                        Browse all hotel cities →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {NAV.primary.map((l) => (
              <a
                key={l.href}
                class="rounded-full px-4 py-2 text-sm font-medium text-[#4A6272] transition hover:bg-[#F0FAFA] hover:text-[#047A6E]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}

            <span class="mx-1 h-4 w-px bg-[rgba(27,45,66,0.15)]" aria-hidden="true" />

            {NAV.secondary.map((l) => (
              <a
                key={l.href}
                class="rounded-full px-4 py-2 text-sm font-medium text-[#4A6272] transition hover:bg-[#F0FAFA] hover:text-[#047A6E]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div class="hidden items-center gap-2 md:flex">
          <a class="t-btn-ghost px-4 py-2 text-sm" href="/my-trips">My Trips</a>
          <a class="t-btn-primary px-4 py-2 text-sm" href="/#global-search-entry">Search</a>
        </div>

        {/* Mobile */}
        <div class="md:hidden">
          <details class="group relative">
            <summary
              class="list-none rounded-full border border-[rgba(27,45,66,0.15)] p-2 text-[#4A6272] [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </summary>

            <div
              class="absolute right-0 top-full mt-2 w-[92vw] max-w-sm rounded-2xl bg-white p-2"
              style="border: 1px solid rgba(27,45,66,0.10); box-shadow: 0 20px 48px rgba(27,45,66,0.14)"
            >
              <div class="flex items-center justify-between px-3 py-2 mb-1">
                <div class="text-sm font-semibold text-[#0E1E2E]">Navigate</div>
                <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">Search</a>
              </div>

              <div class="border-t border-[rgba(27,45,66,0.08)] pt-1">
                <a class="block rounded-xl px-3 py-2 text-sm font-medium text-[#0E1E2E] hover:bg-[#F0FAFA]" href="/hotels">Hotels</a>
                <div class="pl-3">
                  {[...NAV.hotels.actions, ...NAV.hotels.featured].map((l) => (
                    <a key={l.href} class="block rounded-xl px-3 py-1.5 text-sm text-[#4A6272] hover:bg-[#F0FAFA] hover:text-[#047A6E]" href={l.href}>
                      {l.label}
                    </a>
                  ))}
                </div>
                <div class="my-1 border-t border-[rgba(27,45,66,0.08)]" />
                {NAV.primary.map((l) => (
                  <a key={l.href} class="block rounded-xl px-3 py-2 text-sm font-medium text-[#0E1E2E] hover:bg-[#F0FAFA]" href={l.href}>
                    {l.label}
                  </a>
                ))}
                <div class="mt-2 grid gap-2 px-2 pb-2 pt-1">
                  <a class="t-btn-ghost px-4 py-2 text-center text-sm" href="/my-trips">My Trips</a>
                  <a class="t-btn-primary px-4 py-2 text-center text-sm" href="/#global-search-entry">Search</a>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
});

const IconBolt = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <path d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
    <path d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="2" />
  </svg>
);
