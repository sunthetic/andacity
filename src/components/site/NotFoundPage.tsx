import { component$ } from '@builder.io/qwik'
import { Page } from '~/components/site/Page'

export const NotFoundPage = component$(() => {
  return (
    <Page>
      <div class="mx-auto max-w-2xl">
        <div
          class="p-7"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-card)"
        >
          <div class="text-sm font-semibold" style="color:var(--ui-text-muted)">
            404
          </div>
          <h1
            class="mt-2 text-balance text-3xl font-bold tracking-tight lg:text-4xl"
            style="color:var(--ui-text)"
          >
            Page not found
          </h1>
          <p class="mt-2 text-sm lg:text-base" style="color:var(--ui-text-muted)">
            The link may be outdated, or the page may have moved.
          </p>

          <div class="mt-6 flex flex-wrap gap-2">
            <a
              class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
              href="/"
            >
              Home
            </a>
            {NOT_FOUND_NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                class="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
})

const NOT_FOUND_NAV = [
  { label: 'Hotels', href: '/hotels' },
  { label: 'Flights', href: '/flights' },
  { label: 'Car Rentals', href: '/car-rentals' },
  { label: 'Destinations', href: '/destinations' },
] as const
