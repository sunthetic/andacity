import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { DESTINATIONS } from '~/data/destinations'

export default component$(() => {
  const items = DESTINATIONS

  return (
    <Page>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Destinations
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Explore destinations with clean, indexable guides. Search results stay noindex. Destination pages
            earn rankings.
          </p>
        </div>

        <a class="t-btn-primary px-5 text-center" href="/search/hotels">
          Start with hotels
        </a>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <a
            key={d.slug}
            class="t-card block overflow-hidden hover:bg-white"
            href={`/destinations/${encodeURIComponent(d.slug)}`}
          >
            <div class="h-36 bg-[color:var(--color-neutral-50)]" />

            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {d.name}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {d.airportCode} · {d.bestFor.slice(0, 3).join(' · ')}
                  </div>
                </div>

                <span class="t-badge">
                  From {formatMoney(d.priceFrom, 'USD')}
                  <span class="ml-1 text-[color:var(--color-text-muted)]">/night</span>
                </span>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                {d.bestFor.slice(0, 3).map((b) => (
                  <span key={b} class="t-badge">{b}</span>
                ))}
              </div>

              <div class="mt-4 text-sm text-[color:var(--color-action)]">
                View guide →
              </div>
            </div>
          </a>
        ))}
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Destinations | Andacity Travel'
  const description =
    'Explore destinations with clean guides and transparent pricing context. Compare hotels with clarity and confidence.'

  const canonicalHref = new URL('/destinations', url.origin).href

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Destinations',
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Andacity destinations',
        itemListElement: DESTINATIONS.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: d.name,
          url: new URL(`/destinations/${encodeURIComponent(d.slug)}`, url.origin).href,
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

      { name: 'json-ld', content: jsonLd },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
