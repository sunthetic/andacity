import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { HOTEL_CITIES } from '~/data/hotel-cities'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'

export default component$(() => {
  const items = HOTEL_CITIES

  return (
    <Page breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Hotels', href: '/hotels' },
      { label: 'Cities' },
    ]}>

      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Hotel destinations by city
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Browse city guides. Indexable city guides that link into noindex search results. This is your scalable SEO layer.
          </p>
        </div>

        <a class="t-btn-primary px-5 text-center" href="/hotels">
          Browse hotels
        </a>
      </div>

      {items.length ? (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <a
              key={c.slug}
              class="t-card block overflow-hidden hover:bg-white"
              href={buildHotelsInCityHref(c.slug)}
            >
              <div class="p-5">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {c.city}
                    </div>
                    <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                      {c.region}, {c.country} · {c.hotelSlugs.length} hotels
                    </div>
                  </div>

                  <span class="t-badge">
                    From {formatMoney(c.priceFrom, 'USD')}
                    <span class="ml-1 text-[color:var(--color-text-muted)]">/night</span>
                  </span>
                </div>

                <div class="mt-4 text-xs text-[color:var(--color-text-muted)]">
                  Top areas:{' '}
                  <span class="text-[color:var(--color-text)]">
                    {c.topNeighborhoods.slice(0, 3).map((x) => x.name).join(' · ') || '—'}
                  </span>
                </div>

                <div class="mt-4 text-sm text-[color:var(--color-action)]">View city →</div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div class="mt-6">
          <SearchEmptyState
            title="No hotel cities are available right now"
            description="Try returning to the Hotels hub and starting a new search."
            primaryAction={{ label: 'Go to Hotels', href: '/hotels' }}
          />
        </div>
      )}
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Hotel Destinations | Andacity Travel'
  const description =
    'Browse indexable hotel city guides. Each city page links into noindex hotel search results while earning rankings.'

  // New canonical for the city index
  const canonicalHref = new URL('/hotels/in', url.origin).href

  const listCap = 48

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hotels', item: new URL('/hotels', url.origin).href },
          { '@type': 'ListItem', position: 2, name: 'Cities', item: canonicalHref },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity hotel cities',
        itemListElement: HOTEL_CITIES.slice(0, listCap).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.city,
          url: new URL(buildHotelsInCityHref(c.slug), url.origin).href,
          numberOfItems: HOTEL_CITIES.length,
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

      // Note: Meta JSON-LD is not ideal; we’ll convert to <script type="application/ld+json"> later if desired.
      { name: 'json-ld', content: jsonLd },
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

const buildHotelsInCityHref = (citySlug: string) => {
  return `/hotels/in/${encodeURIComponent(citySlug)}`
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
