import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { HeroBackground } from '~/components/hero/HeroBackground'

export default component$(() => {
  return (
    <>
      <section class="relative overflow-hidden">
        <HeroBackground imageUrl="/images/hero/home.svg" overlay="strong">
          <div class="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:py-20">
            <div class="mx-auto max-w-4xl text-center">
              <p class="text-sm font-medium text-[color:var(--color-text-on-hero-muted)]">
                Andacity Travel Platform
              </p>
              <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-on-hero)] md:text-5xl">
                Plan the whole trip in one place
              </h1>
              <p class="mt-3 text-sm text-[color:var(--color-text-on-hero-muted)] md:text-base">
                Search flights, stays, and car rentals together, or explore new destinations when you don't know where to start.
              </p>
              <p class="mt-2 text-sm text-[color:var(--color-text-on-hero-muted)] md:text-base">
                One platform. Less friction. Better trips.
              </p>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a class="t-btn-primary px-5 text-center" href="/hotels">
                  Start a trip search
                </a>
                <a
                  class="rounded-xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                  href="#verticals"
                >
                  Choose a travel mode
                </a>
              </div>
              <div class="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
                <a class="rounded-full border border-white/30 bg-white/8 px-3 py-1.5 text-white/90" href="/flights">
                  Flights
                </a>
                <a class="rounded-full border border-white/30 bg-white/8 px-3 py-1.5 text-white/90" href="/hotels">
                  Hotels
                </a>
                <a class="rounded-full border border-white/30 bg-white/8 px-3 py-1.5 text-white/90" href="/car-rentals">
                  Car Rentals
                </a>
                <a class="rounded-full border border-white/30 bg-white/8 px-3 py-1.5 text-white/90" href="/explore">
                  Explore
                </a>
              </div>
            </div>
          </div>
        </HeroBackground>
      </section>

      <main class="mx-auto max-w-6xl px-4 pt-10 pb-10 md:pb-12.5 lg:pb-16">
        <section id="verticals">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                Start from any part of the trip
              </h2>
              <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
                Every entry point is first-class: book transport, lock in stays, reserve wheels, or explore places before choosing.
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a class="t-card block p-5 transition hover:-translate-y-px hover:bg-white" href="/flights">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-600)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M2 16.5v-2l8-1.5V6a1 1 0 0 1 2 0v6.5l8 2v2l-8-1v4l2 1v1.5L11 22l-3 0.5V21l2-1v-4z" />
                </svg>
              </div>
              <div class="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">Flights</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Compare routes and traveler preferences with a focused search flow.
              </div>
              <div class="mt-4 text-sm text-[color:var(--color-action)]">Search flights →</div>
            </a>

            <a class="t-card block p-5 transition hover:-translate-y-px hover:bg-white" href="/hotels">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-secondary-50)] text-[color:var(--color-secondary-700)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M3 21v-9a2 2 0 0 1 2-2h2V6a3 3 0 0 1 6 0v4h6a2 2 0 0 1 2 2v9h-2v-3H5v3H3zm10-11V6a1 1 0 1 0-2 0v4h2z" />
                </svg>
              </div>
              <div class="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">Hotels</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Search stays by destination, dates, and guests, or browse city hubs.
              </div>
              <div class="mt-4 text-sm text-[color:var(--color-action)]">Search hotels →</div>
            </a>

            <a class="t-card block p-5 transition hover:-translate-y-px hover:bg-white" href="/car-rentals">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-tertiary-50)] text-[color:var(--color-tertiary-700)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4 14l1.2-4.2A3 3 0 0 1 8.1 7.5h7.8a3 3 0 0 1 2.9 2.3L20 14v5h-2v-1H6v1H4v-5zm2.3-1h11.4l-.8-2.6a1 1 0 0 0-1-.7H8.1a1 1 0 0 0-1 .7L6.3 13zM8 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                </svg>
              </div>
              <div class="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">Car Rentals</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Find pickup-friendly rentals with city-by-city availability and policies.
              </div>
              <div class="mt-4 text-sm text-[color:var(--color-action)]">Search car rentals →</div>
            </a>

            <a class="t-card block p-5 transition hover:-translate-y-px hover:bg-white" href="/explore">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-primary-50)] text-[color:var(--color-primary-700)]">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
              </div>
              <div class="mt-3 text-base font-semibold text-[color:var(--color-text-strong)]">Explore destinations</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Discover places to go by season, mood, or budget when you're not starting with a fixed plan.
              </div>
              <div class="mt-4 text-sm text-[color:var(--color-action)]">Start exploring →</div>
            </a>
          </div>
        </section>

        <section class="mt-10 t-card p-6">
          <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Why Andacity
          </h2>
          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Unified planning</div>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Move from flights to stays to transportation without restarting your workflow.
              </p>
            </div>
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Search + discovery</div>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Pair direct booking flows with destination context so decisions happen faster.
              </p>
            </div>
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Clean surfaces</div>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Consistent, readable UI patterns across every travel vertical.
              </p>
            </div>
          </div>
        </section>

        <section class="mt-10">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                Popular destinations
              </h2>
              <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
                Start with city guides, then branch into flights, hotels, and rentals.
              </p>
            </div>
            <a class="t-btn-primary px-5 text-center" href="/destinations">
              Browse all destinations
            </a>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a class="t-card block p-4 hover:bg-white" href="/destinations/miami">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Miami</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">Beach stays and nonstop routes</div>
            </a>
            <a class="t-card block p-4 hover:bg-white" href="/destinations/san-diego">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">San Diego</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">Coastal neighborhoods and easy drives</div>
            </a>
            <a class="t-card block p-4 hover:bg-white" href="/hotels/in/new-york">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">New York</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">Dense hotel inventory and city transit</div>
            </a>
            <a class="t-card block p-4 hover:bg-white" href="/car-rentals/in/orlando">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Orlando</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">Rental-friendly planning for park trips</div>
            </a>
          </div>
        </section>
      </main>
    </>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Andacity | Flights, Hotels, Car Rentals, and Discovery'
  const description = 'Plan the whole trip in one place with Andacity: search flights, hotels, car rentals, and explore destinations.'
  const canonicalHref = new URL('/', url.origin).href
  const ogImage = new URL('/og/home.png', url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
