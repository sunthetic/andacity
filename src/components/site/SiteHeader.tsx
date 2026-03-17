import { component$ } from '@builder.io/qwik'

const NAV = {
  primary: [
    { label: 'Flights', href: '/flights' },
    { label: 'Cars', href: '/car-rentals' },
    { label: 'Trips', href: '/trips' },
    { label: 'Explore', href: '/explore' },
  ],
  hotels: {
    actions: [
      { label: 'Search hotels', href: '/hotels', hint: 'Start a stay search' },
      { label: 'Hotel cities', href: '/hotels/in', hint: 'Indexable guides' },
      { label: 'Destinations', href: '/destinations', hint: 'Plan the broader trip' },
    ],
    featured: [
      { label: 'Miami', href: '/hotels/in/miami', hint: 'Beach + nightlife' },
      { label: 'Las Vegas', href: '/hotels/in/las-vegas', hint: 'Resorts + shows' },
      { label: 'New York', href: '/hotels/in/new-york', hint: 'City stays' },
      { label: 'Orlando', href: '/hotels/in/orlando', hint: 'Theme parks' },
    ],
  },
  secondary: [
    { label: 'Destinations', href: '/destinations' },
  ],
} as const

const LINK_CLASS =
  'rounded-lg px-3 py-2 text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]'

const MOBILE_BUTTON_CLASS =
  'list-none rounded-lg p-2 border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] [&::-webkit-details-marker]:hidden'

const MOBILE_LINK_CLASS =
  'block rounded-xl px-3 py-2 text-sm text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]'

const MOBILE_SUB_LINK_CLASS =
  'block rounded-xl px-3 py-2 text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] hover:bg-[color:var(--color-surface-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]'

const BRAND_LOGO_SRC = '/assets/logo/andacity-primary-color_mark-darkword_transparent.svg'

export const SiteHeader = component$(() => {
  return (
    <header
      class="sticky top-0 z-40 border-b border-[color:var(--color-border)]"
      style="
  background:
    var(--glass-highlight),
    var(--surface-glass-popover);
  backdrop-filter: var(--blur-glass-sm);
"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* Brand */}
        <div class="flex items-center gap-3">
          <a
            href="/"
            class="inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            aria-label="Andacity home"
          >
            <img
              src={BRAND_LOGO_SRC}
              class="h-9 w-auto"
              width={160}
              height={48}
              alt="Andacity"
            />
          </a>

          {/* Desktop nav */}
          <nav class="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {/* Hotels hover dropdown */}
            <div class="group relative">
              <a class={LINK_CLASS} href="/hotels" aria-haspopup="menu">
                Hotels
              </a>

              {/* IMPORTANT: keep this a literal class string so Tailwind extracts variants */}
              <div class="pointer-events-none absolute left-0 top-full mt-2 w-[520px] opacity-0 translate-y-1 transition duration-150 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <div
                  class="relative z-50 overflow-hidden rounded-2xl border border-[color:var(--border-glass)] p-2 shadow-[var(--shadow-surface-3)]"
                  style="
			background: var(--glass-highlight), var(--glass-bg-popover);
			backdrop-filter: var(--glass-blur-sm);
			-webkit-backdrop-filter: var(--glass-blur-sm);
		"
                >
                  {/* caret */}
                  <div
                    class="pointer-events-none absolute -top-2 left-6 size-4 rotate-45 border-l border-t border-[color:var(--border-glass)]"
                    style="background-color: var(--glass-bg-popover);"
                  />

                  <div class="grid gap-2 p-2 sm:grid-cols-2">
                    {/* Left column: actions */}
                    <div class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 p-3">
                      <div class="flex items-center justify-between gap-2">
                        <div class="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
                          Hotels
                        </div>
                        <a
                          href="/hotels"
                          class="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
                        >
                          View all
                        </a>
                      </div>

                      <ul class="mt-2 grid gap-1" role="menu" aria-label="Hotels actions">
                        {NAV.hotels.actions.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-[color:var(--color-panel)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]"
                            >
                              <span class="mt-0.5 text-[color:var(--color-text-muted)] group-hover/item:text-[color:var(--color-text-strong)]">
                                <IconBolt />
                              </span>
                              <span class="flex min-w-0 flex-col">
                                <span class="text-sm font-medium text-[color:var(--color-text-strong)]">
                                  {l.label}
                                </span>
                                <span class="text-xs text-[color:var(--color-text-muted)]">{l.hint}</span>
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

                    {/* Right column: featured destinations */}
                    <div class="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 p-3">
                      <div class="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
                        Featured destinations
                      </div>

                      <ul class="mt-2 grid gap-1" role="menu" aria-label="Featured hotel destinations">
                        {NAV.hotels.featured.map((l) => (
                          <li key={l.href} role="none">
                            <a
                              href={l.href}
                              role="menuitem"
                              class="group/item flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-[color:var(--color-panel)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]"
                            >
                              <span class="mt-0.5 text-[color:var(--color-text-muted)] group-hover/item:text-[color:var(--color-text-strong)]">
                                <IconPin />
                              </span>
                              <span class="flex min-w-0 flex-col">
                                <span class="text-sm font-medium text-[color:var(--color-text-strong)]">
                                  {l.label}
                                </span>
                                <span class="text-xs text-[color:var(--color-text-muted)]">{l.hint}</span>
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>

                      <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-3">
                        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                          City guides for search hubs
                        </div>
                        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                          Indexable destination pages that support discovery and lead into live search.
                        </p>
                        <a
                          href="/hotels/in"
                          class="mt-2 inline-flex text-xs font-semibold text-[color:var(--color-action)] hover:underline"
                        >
                          Browse hotel cities
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {NAV.primary.map((l) => (
              <a key={l.href} class={LINK_CLASS} href={l.href}>
                {l.label}
              </a>
            ))}

            <span class="mx-1 h-5 w-px bg-[color:var(--color-border)]" aria-hidden="true" />

            {NAV.secondary.map((l) => (
              <a key={l.href} class={LINK_CLASS} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Right side actions */}
        <div class="hidden items-center gap-2 md:flex">
          <a class="t-btn-ghost px-4 py-2 text-sm" href="/trips">
            Trips
          </a>
          <a class="t-btn-primary px-4 py-2 text-sm" href="/#global-search-entry">
            Search
          </a>
        </div>

        {/* Mobile menu */}
        <div class="md:hidden">
          <details class="group relative">
            <summary class={MOBILE_BUTTON_CLASS} aria-label="Open menu">
              <span class="sr-only">Menu</span>
              <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </summary>

            <div class="absolute right-0 top-full mt-2 w-[92vw] max-w-sm rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-0)] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.12),0_6px_14px_rgba(0,0,0,0.06)]">
              <div class="flex items-center justify-between gap-2 px-2 py-2">
                <div>
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Andacity</div>
                  <div class="text-xs text-[color:var(--color-text-muted)]">Navigate</div>
                </div>
                <a class="t-btn-primary px-3 py-1.5 text-sm" href="/#global-search-entry">
                  Search
                </a>
              </div>

              <div class="mt-1 border-t border-[color:var(--color-border)] pt-2">
                <a class={MOBILE_LINK_CLASS} href="/hotels">
                  Hotels
                </a>

                <div class="mt-1 grid gap-1 pl-2">
                  {NAV.hotels.actions.map((l) => (
                    <a key={l.href} class={MOBILE_SUB_LINK_CLASS} href={l.href}>
                      {l.label}
                    </a>
                  ))}

                  <div class="my-2 h-px bg-[color:var(--color-border)]" />

                  {NAV.hotels.featured.map((l) => (
                    <a key={l.href} class={MOBILE_SUB_LINK_CLASS} href={l.href}>
                      {l.label}
                    </a>
                  ))}
                </div>

                <div class="my-2 h-px bg-[color:var(--color-border)]" />

                {NAV.primary.map((l) => (
                  <a key={l.href} class={MOBILE_LINK_CLASS} href={l.href}>
                    {l.label}
                  </a>
                ))}

                <div class="my-2 h-px bg-[color:var(--color-border)]" />

                {NAV.secondary.map((l) => (
                  <a key={l.href} class={MOBILE_LINK_CLASS} href={l.href}>
                    {l.label}
                  </a>
                ))}

                <div class="mt-2 grid gap-2 px-2 pb-2">
                  <a class="t-btn-ghost px-4 py-2 text-center text-sm" href="/trips">
                    Trips
                  </a>
                  <a class="t-btn-primary px-4 py-2 text-center text-sm" href="/#global-search-entry">
                    Search
                  </a>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
})

const IconBolt = () => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <path
      d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
  </svg>
)

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
)
