import { component$ } from '@builder.io/qwik'

const FOOTER_LINKS = {
  product: [
    { label: 'Flights', href: '/flights' },
    { label: 'Hotels', href: '/hotels' },
    { label: 'Car rentals', href: '/car-rentals' },
    { label: 'Trips', href: '/trips' },
  ],
  explore: [
    { label: 'Hotel city guides', href: '/hotels/in' },
    { label: 'Rental cities', href: '/car-rentals/in' },
    { label: 'Popular destinations', href: '/destinations' },
    { label: 'Explore', href: '/explore' },
  ],
  planning: [
    { label: 'Start search', href: '/#global-search-entry' },
    { label: 'View trips', href: '/trips' },
    { label: 'Browse flights', href: '/flights' },
    { label: 'Search hotels', href: '/hotels' },
  ],
  reference: [
    { label: 'Sitemap', href: '/sitemap.xml' },
    { label: 'Robots', href: '/robots.txt' },
    { label: 'Explore', href: '/explore' },
    { label: 'Destinations', href: '/destinations' },
  ],
} as const

export const SiteFooter = component$(() => {
  const year = new Date().getFullYear()

  return (
    <footer
      class="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-0)]"
      aria-label="Site footer"
    >
      <div class="mx-auto max-w-6xl px-4 py-12">
        <div class="grid gap-10 lg:grid-cols-12">
          {/* Brand / value prop */}
          <div class="lg:col-span-4">
            <a
              href="/"
              class="inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              aria-label="Andacity home"
            >
              {/* Swap this for your actual logo asset path */}
              <span
                class="grid size-10 place-items-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" class="size-5" fill="none">
                  <path
                    d="M3.5 14.5c4.5-7 12.5-7 17 0"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M12 4.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 4.5Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    opacity="0.25"
                  />
                </svg>
              </span>

              <span class="flex flex-col leading-tight">
                <span class="text-sm font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  Andacity
                </span>
                <span class="text-xs text-[color:var(--color-text-muted)]">
                  Find better trips. Book with confidence.
                </span>
              </span>
            </a>

            <p class="mt-4 max-w-[48ch] text-sm text-[color:var(--color-text-muted)]">
              City guides for discovery, fast search for planning, and a clean booking flow—built for
              travelers who want clarity and speed.
            </p>

            <div class="mt-5 flex flex-wrap gap-2">
              <a class="t-btn-primary px-4 py-2 text-sm" href="/hotels">
                Search hotels
              </a>
              <a
                class="t-btn-ghost px-4 py-2 text-sm"
                href="/explore"
                aria-label="Explore Andacity destinations"
              >
                Explore
              </a>
            </div>

            {/* Social (placeholder links) */}
            <div class="mt-6 flex items-center gap-3">
              <a
                href="https://x.com/"
                class="rounded-md p-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                aria-label="Andacity on X"
                rel="noreferrer"
                target="_blank"
              >
                <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 2H22l-6.8 7.8L23 22h-6.8l-5.3-6.9L4.9 22H2l7.3-8.5L1 2h7l4.8 6.2L18.9 2Zm-1.2 18h1.7L7.2 3.9H5.4L17.7 20Z" />
                </svg>
              </a>

              <a
                href="https://github.com/"
                class="rounded-md p-2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                aria-label="Andacity on GitHub"
                rel="noreferrer"
                target="_blank"
              >
                <svg viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.5-1.1-4.5-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.6s.8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1a3.6 3.6 0 0 1 .1 2.6 3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.5 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div class="lg:col-span-8">
            <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <FooterCol title="Product" links={FOOTER_LINKS.product} />
              <FooterCol title="Explore" links={FOOTER_LINKS.explore} />
              <FooterCol title="Planning" links={FOOTER_LINKS.planning} />
              <FooterCol title="Reference" links={FOOTER_LINKS.reference} />
            </div>

            {/* Trust / disclosure strip */}
            <div class="mt-10 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-[color:var(--color-text-muted)]">
                  Prices and availability can change. We may earn commission from select partners.
                </p>
                <div class="flex flex-wrap gap-2">
                  <a class="t-btn-ghost px-3 py-1.5 text-sm" href="/explore">
                    Explore trips
                  </a>
                  <a class="t-btn-ghost px-3 py-1.5 text-sm" href="/trips">
                    View trips
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div class="mt-12 flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-[color:var(--color-text-muted)]">
            © {year} Andacity, a <a href="https://sunthetic.media">Sunthetic Media</a> venture. All rights reserved.
          </p>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <a
              class="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
              href="/sitemap.xml"
            >
              Sitemap
            </a>
            <a
              class="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
              href="/hotels/in"
            >
              Hotel cities
            </a>
            <a
              class="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
              href="/trips"
            >
              Trips
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
})

export const FooterCol = component$((props: FooterColProps) => {
  return (
    <nav aria-label={props.title}>
      <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</h3>
      <ul class="mt-3 space-y-2">
        {props.links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              class="text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
})

type FooterLink = {
  label: string
  href: string
}

type FooterColProps = {
  title: string
  links: readonly FooterLink[]
}
