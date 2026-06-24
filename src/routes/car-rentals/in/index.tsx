import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { loadCarRentalCitiesFromDb } from '~/lib/queries/car-rentals-pages.server'

export const useCarRentalCitiesPage = routeLoader$(async () => {
  const items = await loadCarRentalCitiesFromDb()
  return { items }
})

export default component$(() => {
  const { items } = useCarRentalCitiesPage().value

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text)">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        class="relative isolate z-10"
        style="background-image:var(--ui-hero)"
        aria-label="Car rental destinations directory"
      >
        <div
          class="absolute inset-0 -z-10"
          style="background-image:var(--ui-hero-scrim)"
          aria-hidden="true"
        />

        <div class="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <nav aria-label="Breadcrumb" class="mb-4">
            <ol
              class="flex flex-wrap items-center gap-2 text-[12px]"
              style="color:rgba(255,255,255,0.7)"
            >
              <li class="flex items-center gap-2">
                <a
                  href="/"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li class="flex items-center gap-2">
                <a
                  href="/car-rentals"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Car Rentals
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">
                Cities
              </li>
            </ol>
          </nav>

          <div class="max-w-2xl">
            <h1
              class="text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
              style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
            >
              Car rental destinations by city
            </h1>

            <p
              class="mt-3 max-w-[52ch] text-base"
              style="color:rgba(255,255,255,0.88)"
            >
              Browse car rental guides for popular cities. Compare vehicles,
              pickup types, and policy terms before you book.
            </p>

            {items.length > 0 && (
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  class="rounded-full px-3 py-1 text-[12px] font-semibold"
                  style="background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.25)"
                >
                  {items.length} {items.length === 1 ? 'city' : 'cities'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── City directory ──────────────────────────────────── */}
      <div class="mx-auto max-w-6xl px-4 py-8">
        {items.length ? (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <a
                key={c.slug}
                href={buildCityHref(c.slug)}
                class="group relative block transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              >
                <div
                  class="h-1.5 w-full"
                  style="background-image:var(--ui-hero);border-radius:var(--ui-radius) var(--ui-radius) 0 0"
                  aria-hidden="true"
                />
                <div class="p-5">
                  <div
                    class="text-sm font-bold transition group-hover:underline"
                    style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
                  >
                    {c.name}
                  </div>
                  <div class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
                    {c.region} · {c.country}
                  </div>

                  <div
                    class="mt-3 flex items-center gap-1 text-[13px] font-semibold"
                    style="color:var(--ui-primary)"
                  >
                    Browse rentals <span aria-hidden="true">→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-2">
            <SearchEmptyState
              title="No rental cities are available right now"
              description="Try returning to the Car Rentals hub and starting a new search."
              primaryAction={{ label: 'Go to Car Rentals', href: '/car-rentals' }}
            />
          </div>
        )}
      </div>

      {/* ── Handoff section ─────────────────────────────────── */}
      <section style="border-top:1px solid var(--ui-divider)">
        <div class="mx-auto max-w-6xl px-4 py-8">
          <h2
            class="text-xl font-bold"
            style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
          >
            Where to next
          </h2>
          <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
            Search by dates, browse hotel guides, or explore your destination.
          </p>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            {HANDOFF_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                class="group flex flex-col gap-1 p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              >
                <span
                  class="text-sm font-bold transition group-hover:underline"
                  style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
                >
                  {link.label}
                </span>
                <span class="text-[12px]" style="color:var(--ui-text-muted)">
                  {link.blurb}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const { items } = resolveValue(useCarRentalCitiesPage)
  const title = 'Car Rental Destinations | Andacity Travel'
  const description =
    'Browse car rental city guides by destination. Compare vehicles and pickup types in popular cities before you book.'

  const canonicalHref = new URL('/car-rentals/in', url.origin).href
  const listCap = 48

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Car Rentals',
            item: new URL('/car-rentals', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Car rental cities',
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity car rental destinations by city',
        itemListElement: items.slice(0, listCap).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: new URL(buildCityHref(c.slug), url.origin).href,
        })),
      },
    ],
  })

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
    scripts: [
      {
        key: 'ld-car-rentals-cities',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const buildCityHref = (citySlug: string) =>
  `/car-rentals/in/${encodeURIComponent(citySlug)}`

const HANDOFF_LINKS = [
  {
    label: 'Search car rentals',
    blurb: 'Enter pickup dates and compare vehicles',
    href: '/car-rentals',
  },
  {
    label: 'Hotel city guides',
    blurb: 'Browse hotels in popular destinations',
    href: '/hotels/in',
  },
  {
    label: 'Destinations',
    blurb: 'Get an overview of a city or region',
    href: '/destinations',
  },
] as const
