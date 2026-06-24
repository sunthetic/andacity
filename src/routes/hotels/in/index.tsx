import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { loadHotelCitiesFromDb } from '~/lib/queries/hotels-pages.server'

export const useHotelCitiesPage = routeLoader$(async () => {
  const items = await loadHotelCitiesFromDb()
  return { items }
})

export default component$(() => {
  const { items } = useHotelCitiesPage().value

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text)">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        class="relative isolate z-10"
        style="background-image:var(--ui-hero)"
        aria-label="Hotel destinations directory"
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
                  href="/hotels"
                  class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Hotels
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">
                City guides
              </li>
            </ol>
          </nav>

          <div class="max-w-2xl">
            <h1
              class="text-balance text-4xl font-bold leading-[1.05] md:text-5xl"
              style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)"
            >
              Hotel destinations by city
            </h1>

            <p
              class="mt-3 max-w-[52ch] text-base"
              style="color:rgba(255,255,255,0.88)"
            >
              Browse hotel guides for popular cities. Compare options with
              transparent totals and clear cancellation policies before you
              book.
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
                href={buildHotelsInCityHref(c.slug)}
                class="group relative block transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              >
                <div
                  class="h-1.5 w-full"
                  style={`background-image:var(--ui-hero);border-radius:var(--ui-radius) var(--ui-radius) 0 0`}
                  aria-hidden="true"
                />
                <div class="p-5">
                  <div
                    class="text-sm font-bold transition group-hover:underline"
                    style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
                  >
                    {c.city}
                  </div>
                  <div class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
                    {c.region} · {c.country}
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style="background:var(--ui-accent-soft);color:var(--ui-accent)"
                    >
                      From {formatMoney(c.priceFrom, 'USD')}/night
                    </span>
                    <span class="text-[12px]" style="color:var(--ui-text-muted)">
                      {c.hotelSlugs.length} hotel{c.hotelSlugs.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {c.topNeighborhoods.length > 0 && (
                    <div
                      class="mt-3 text-[12px] leading-snug"
                      style="color:var(--ui-text-muted)"
                    >
                      {c.topNeighborhoods
                        .slice(0, 3)
                        .map((n) => n.name)
                        .join(' · ')}
                    </div>
                  )}

                  <div
                    class="mt-3 flex items-center gap-1 text-[13px] font-semibold"
                    style="color:var(--ui-primary)"
                  >
                    View hotels <span aria-hidden="true">→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-2">
            <SearchEmptyState
              title="No hotel cities are available right now"
              description="Try returning to the Hotels hub and starting a new search."
              primaryAction={{ label: 'Go to Hotels', href: '/hotels' }}
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
            Search by dates, browse by theme, or get an overview of a destination.
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
  const { items } = resolveValue(useHotelCitiesPage)
  const title = 'Hotel Destinations | Andacity Travel'
  const description =
    'Browse hotel city guides by destination. Find hotels in popular cities and compare rates, cancellation policies, and totals before you book.'

  const canonicalHref = new URL('/hotels/in', url.origin).href
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
            name: 'Hotels',
            item: new URL('/hotels', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'City guides',
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity hotel destinations by city',
        itemListElement: items.slice(0, listCap).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.city,
          url: new URL(buildHotelsInCityHref(c.slug), url.origin).href,
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
        key: 'ld-hotel-cities',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const buildHotelsInCityHref = (citySlug: string) =>
  `/hotels/in/${encodeURIComponent(citySlug)}`

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const HANDOFF_LINKS = [
  {
    label: 'Search hotels',
    blurb: 'Enter dates and compare rates by destination',
    href: '/hotels',
  },
  {
    label: 'Explore by theme',
    blurb: 'Browse destinations by travel style',
    href: '/explore',
  },
  {
    label: 'Destinations',
    blurb: 'Get an overview of a city or region',
    href: '/destinations',
  },
] as const
