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
      {
        label: "Destinations",
        href: "/destinations",
        hint: "Plan the broader trip",
      },
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
      class="sticky top-0 z-40 border-b-2 border-[#0A0A08] bg-[#0A0A08]"
      style="box-shadow: 0 3px 0 #0A0A08"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <div class="flex items-center gap-6">
          <a
            href="/"
            class="inline-flex items-center gap-2 focus:outline-none"
            aria-label="Andacity home"
          >
            <img
              src={BRAND_LOGO_SRC}
              class="h-8 w-auto brightness-0 invert"
              width={160}
              height={48}
              alt="Andacity"
            />
          </a>

          {/* Desktop nav */}
          <nav
            class="hidden items-center gap-0 md:flex"
            aria-label="Primary navigation"
          >
            {/* Hotels hover dropdown */}
            <div class="group relative">
              <a
                class="inline-flex items-center px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#C8C8B8] transition hover:bg-[#1A1A10] hover:text-[#F8F8F5]"
                href="/hotels"
                aria-haspopup="menu"
              >
                Hotels
              </a>

              <div class="pointer-events-none absolute left-0 top-full mt-0 w-[520px] translate-y-1 opacity-0 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div class="relative z-50 overflow-hidden border-2 border-[#0A0A08] bg-white p-2"
                  style="box-shadow: 4px 4px 0 #0A0A08"
                >
                  {/* caret */}
                  <div
                    class="pointer-events-none absolute -top-2 left-6 size-4 rotate-45 border-l-2 border-t-2 border-[#0A0A08] bg-white"
                  />

                  <div class="grid gap-2 sm:grid-cols-2">
                    {/* Left column: actions — blue tinted */}
                    <div class="border-2 border-[#0A0A08] p-3" style="border-top: 4px solid #0050FF">
                      <div class="flex items-center justify-between gap-2 border-b border-[#0A0A08] pb-2 mb-2">
                        <div class="text-xs font-black uppercase tracking-widest text-[#050502]">
                          Hotels
                        </div>
                        <a
                          href="/hotels"
                          class="text-xs font-bold uppercase tracking-wide text-[#787870] hover:text-[#050502]"
                        >
                          All →
                        </a>
                      </div>

                      <ul class="grid gap-1" role="menu" aria-label="Hotels actions">
                        {NAV.hotels.actions.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 px-2 py-2 hover:bg-[#F0F4FF] focus:outline-none"
                            >
                              <span class="mt-0.5 text-[#787870] group-hover/item:text-[#0050FF]">
                                <IconBolt />
                              </span>
                              <span class="flex min-w-0 flex-col">
                                <span class="text-sm font-bold text-[#050502]">
                                  {l.label}
                                </span>
                                <span class="text-xs text-[#787870]">
                                  {l.hint}
                                </span>
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

                    {/* Right column: destinations — red tinted */}
                    <div class="border-2 border-[#0A0A08] p-3" style="border-top: 4px solid #FF3B30">
                      <div class="text-xs font-black uppercase tracking-widest text-[#050502] border-b border-[#0A0A08] pb-2 mb-2">
                        Featured
                      </div>

                      <ul class="grid gap-1" role="menu" aria-label="Featured hotel destinations">
                        {NAV.hotels.featured.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 px-2 py-2 hover:bg-[#FFF5F0] focus:outline-none"
                            >
                              <span class="mt-0.5 text-[#787870] group-hover/item:text-[#FF3B30]">
                                <IconPin />
                              </span>
                              <span class="flex min-w-0 flex-col">
                                <span class="text-sm font-bold text-[#050502]">
                                  {l.label}
                                </span>
                                <span class="text-xs text-[#787870]">
                                  {l.hint}
                                </span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>

                      <a
                        href="/hotels/in"
                        class="mt-3 block border border-[#0A0A08] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#050502] hover:bg-[#AAFF00]"
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
                class="inline-flex items-center px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#C8C8B8] transition hover:bg-[#1A1A10] hover:text-[#F8F8F5]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}

            <span class="mx-2 h-5 w-px bg-[#3A3A2A]" aria-hidden="true" />

            {NAV.secondary.map((l) => (
              <a
                key={l.href}
                class="inline-flex items-center px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#C8C8B8] transition hover:bg-[#1A1A10] hover:text-[#F8F8F5]"
                href={l.href}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right side actions */}
        <div class="hidden items-center gap-2 md:flex">
          <a
            class="inline-flex items-center border border-[#3A3A2A] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#C8C8B8] transition hover:border-[#AAFF00] hover:text-[#AAFF00]"
            href="/my-trips"
          >
            My Trips
          </a>
          <a
            class="t-btn-primary px-4 py-2 text-sm"
            href="/#global-search-entry"
          >
            Search
          </a>
        </div>

        {/* Mobile menu */}
        <div class="md:hidden">
          <details class="group relative">
            <summary
              class="list-none border border-[#3A3A2A] p-2 text-[#F8F8F5] [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <span class="sr-only">Menu</span>
              <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </summary>

            <div class="absolute right-0 top-full mt-1 w-[92vw] max-w-sm border-2 border-[#0A0A08] bg-white p-2"
              style="box-shadow: 4px 4px 0 #0A0A08"
            >
              <div class="flex items-center justify-between gap-2 border-b-2 border-[#0A0A08] px-2 py-2 mb-2">
                <div>
                  <div class="text-sm font-black uppercase text-[#050502]">Andacity</div>
                  <div class="text-xs font-medium uppercase tracking-wide text-[#787870]">Navigate</div>
                </div>
                <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">
                  Search
                </a>
              </div>

              <a class="block px-3 py-2 font-bold uppercase tracking-wide text-[#050502] hover:bg-[#AAFF00]" href="/hotels">
                Hotels
              </a>

              <div class="grid gap-0 border-l-2 border-[#0A0A08] ml-3 mb-1">
                {NAV.hotels.actions.map((l) => (
                  <a key={l.href} class="block px-3 py-2 text-sm font-medium text-[#4A4A3E] hover:bg-[#F0F4FF] hover:text-[#050502]" href={l.href}>
                    {l.label}
                  </a>
                ))}
                <div class="border-t border-[#0A0A08] my-1" />
                {NAV.hotels.featured.map((l) => (
                  <a key={l.href} class="block px-3 py-2 text-sm font-medium text-[#4A4A3E] hover:bg-[#F0F4FF] hover:text-[#050502]" href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>

              <div class="border-t-2 border-[#0A0A08] my-1 pt-1">
                {NAV.primary.map((l) => (
                  <a key={l.href} class="block px-3 py-2 font-bold uppercase tracking-wide text-[#050502] hover:bg-[#AAFF00]" href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>

              <div class="border-t-2 border-[#0A0A08] my-1 pt-1">
                {NAV.secondary.map((l) => (
                  <a key={l.href} class="block px-3 py-2 font-bold uppercase tracking-wide text-[#050502] hover:bg-[#AAFF00]" href={l.href}>
                    {l.label}
                  </a>
                ))}
              </div>

              <div class="mt-2 grid gap-2 border-t-2 border-[#0A0A08] px-2 pt-2 pb-1">
                <a class="t-btn-ghost px-4 py-2 text-center text-sm" href="/my-trips">
                  My Trips
                </a>
                <a class="t-btn-primary px-4 py-2 text-center text-sm" href="/#global-search-entry">
                  Search
                </a>
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
    <path
      d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <path
      d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <path
      d="M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      stroke="currentColor"
      stroke-width="2"
    />
  </svg>
);
