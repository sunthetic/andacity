import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { CAR_RENTAL_CITIES } from '~/data/car-rental-cities'
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs'

export default component$(() => {
  const items = CAR_RENTAL_CITIES

  return (
    <Page breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Car Rentals', href: '/car-rentals' },
      { label: 'Cities' },
    ]}>

      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Car rental cities
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Indexable city guides that link into noindex search results. This is your scalable SEO layer.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <a class="t-btn-primary px-4 text-center" href="/search/car-rentals/anywhere/1">
            Search car rentals
          </a>
          <a class="t-btn-primary px-4 text-center" href="/car-rentals">
            All car rentals
          </a>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <a
            key={c.slug}
            class="t-card block p-5 hover:bg-white"
            href={buildCityHref(c.slug)}
          >
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{c.name}</div>
            <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {c.region} · {c.country}
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="t-badge">City guide</span>
              <span class="t-badge">Search</span>
            </div>

            <div class="mt-4 text-sm text-[color:var(--color-action)]">Browse {c.name} →</div>
          </a>
        ))}
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Car rental cities | Andacity Travel'
  const description =
    'Browse indexable car rental city guides. City pages link into noindex search results; detail pages earn rankings.'

  const canonicalHref = new URL('/car-rentals/in', url.origin).href

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
        name: 'Andacity car rental cities',
        itemListElement: CAR_RENTAL_CITIES.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: new URL(buildCityHref(c.slug), url.origin).href,
          numberOfItems: CAR_RENTAL_CITIES.length,
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

const buildCityHref = (citySlug: string) => {
  return `/car-rentals/in/${encodeURIComponent(citySlug)}`
}
