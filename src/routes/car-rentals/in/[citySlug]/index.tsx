import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs'
import { ListingCardGrid } from '~/components/vertical/ListingCardGrid'
import { CAR_RENTALS } from '~/data/car-rentals'
import { getCarRentalCityBySlug } from '~/data/car-rental-cities'
import { CarRentalSearchCard } from '~/components/car-rentals/CarRentalSearchCard'

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
  const loc = useLocation()

  const pickupDate = String(loc.url.searchParams.get('pickupDate') || '').trim()
  const dropoffDate = String(loc.url.searchParams.get('dropoffDate') || '').trim()
  const drivers = String(loc.url.searchParams.get('drivers') || '').trim()

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Car Rentals', href: '/car-rentals' },
          { label: data.city.name },
        ]}
      />

      <div class="mt-4 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div class="flex flex-wrap gap-2">
            <span class="t-badge">
              {data.city.region}, {data.city.country}
            </span>
            <span class="t-badge">{items.length} rentals</span>
          </div>

          <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            Car rentals in {data.city.name}
          </h1>

          <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Browse indexable car rental guides for {data.city.name}. Clear inclusions and policy summaries.
            Search pages stay noindex.
          </p>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Why book here</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="t-badge">City guide</span>
                <span class="t-badge">Policy clarity</span>
                <span class="t-badge">Transparent totals</span>
              </div>
            </div>

            <div class="t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Popular searches</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="t-badge">Airport pickup</span>
                <span class="t-badge">SUV</span>
                <span class="t-badge">Free cancellation</span>
              </div>
            </div>
          </div>
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <CarRentalSearchCard
            title={`Search car rentals in ${data.city.name}`}
            destinationValue={data.city.name}
            pickupDate={pickupDate}
            dropoffDate={dropoffDate}
            drivers={drivers}
            submitLabel="See results"
            helperText="This city page is indexable. Search pages remain noindex."
          />
        </aside>
      </div>

      <section class="mt-8">
        <div class="flex items-end justify-between gap-3">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Featured rentals</h2>
          <a class="text-sm text-[color:var(--color-action)] hover:underline" href={buildSearchHref(data.city.name, 1)}>
            View all →
          </a>
        </div>

        {items.length ? (
          <ListingCardGrid variant="car-rentals" items={items} />
        ) : (
          <div class="mt-4 t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">No listings yet</div>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              We’re building out inventory for {data.city.name}. Try a nearby city or search broadly.
            </p>
          </div>
        )}
      </section>

      <section class="mt-8 t-card p-5">
        <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          Guide to renting a car in {data.city.name}
        </h2>
        <div class="mt-3 text-sm text-[color:var(--color-text-muted)]">
          This section is your SEO payload: airport pickup norms, common car classes, typical pricing ranges,
          and booking considerations for {data.city.name}.
        </div>
      </section>
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
            name: 'Cities',
            item: new URL('/car-rentals/in', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 3,
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
