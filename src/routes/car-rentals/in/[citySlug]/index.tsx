import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { CAR_RENTALS } from '~/data/car-rentals'
import { getCarRentalCityBySlug } from '~/data/car-rental-cities'
import { ListingCardGrid } from '~/components/vertical/ListingCardGrid'
import { Breadcrumbs } from '~/components/site/Breadcrumbs'

export const useCityCarRentals = routeLoader$(({ params, error }) => {
  const citySlug = String(params.citySlug || '').trim().toLowerCase()
  const city = getCarRentalCityBySlug(citySlug)

  if (!city) throw error(404, 'Not found')

  const items = CAR_RENTALS.filter((c) => c.cityQuery === citySlug)

  return {
    citySlug,
    city,
    items,
  }
})

export default component$(() => {
  const data = useCityCarRentals().value
  const items = data.items

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Andacity Travel', href: '/' },
          { label: 'Car Rentals', href: '/car-rentals' },
          { label: 'Cities', href: '/car-rentals/in' },
          { label: data.city.name, href: buildCityHref(data.citySlug) },
        ]}
      />
      
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Car rentals in {data.city.name}
          </h1>
          <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Browse indexable car rental guides for {data.city.name}. Clear inclusions and policy summaries. Search pages stay
            noindex.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href={buildSearchHref(data.citySlug, 1)}>
              Search {data.city.name}
            </a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in">
              Browse cities
            </a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals">
              All car rentals
            </a>
          </div>
        </div>
      </div>

      {items.length ? (
        <ListingCardGrid variant="car-rentals" items={items} />
      ) : (
        <div class="mt-6 t-card p-5">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">No listings yet</div>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            We’re building out inventory for {data.city.name}. Try searching nearby or browse other city guides.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/orlando">Orlando</a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/las-vegas">Las Vegas</a>
            <a class="t-btn-primary px-4 text-center" href="/car-rentals/in/new-york-city">New York</a>
          </div>
        </div>
      )}
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, params, url }) => {
  const data = resolveValue(useCityCarRentals)

  const cityName = data.city.name
  const title = `Car rentals in ${cityName} | Andacity Travel`
  const description =
    `Browse indexable car rental guides for ${cityName} with clear inclusions and policy summaries. ` +
    'Search pages stay noindex; detail pages earn rankings.'

  const canonicalHref = new URL(buildCityHref(params.citySlug), url.origin).href

  const listCap = 24

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
            name: `Car rentals in ${cityName}`,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Andacity car rentals in ${cityName}`,
        itemListElement: data.items.slice(0, listCap).map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          url: new URL(buildCarRentalDetailHref(c.slug), url.origin).href,
          numberOfItems: data.items.length,
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
        key: 'ld-car-rentals-city',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildCityHref = (citySlug: string) => {
  return `/car-rentals/in/${encodeURIComponent(citySlug)}`
}

const buildSearchHref = (query: string, pageNumber: number) => {
  return `/search/car-rentals/${encodeURIComponent(query)}/${encodeURIComponent(String(pageNumber))}`
}

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`
}

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
