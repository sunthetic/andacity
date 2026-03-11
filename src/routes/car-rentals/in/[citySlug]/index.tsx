import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { CarRentalsResultsAdapter } from '~/components/car-rentals/CarRentalsResultsAdapter'
import { Page } from '~/components/site/Page'
import { CarRentalSearchCard } from '~/components/car-rentals/CarRentalSearchCard'
import { searchStateFromUrl } from '~/lib/search/url-to-state'
import { loadCarRentalCityBySlugFromDb } from '~/lib/queries/car-rentals-pages.server'
import {
  loadCarRentalResultsPageFromDb,
  toCarRentalsSearchStateFilters,
} from '~/lib/queries/car-rentals-search.server'

export const useCityCarRentals = routeLoader$(async ({ params, url, error }) => {
  const citySlug = String(params.citySlug || '').trim().toLowerCase()
  const active = parseRentalParams(url.searchParams)
  const city = await loadCarRentalCityBySlugFromDb(citySlug)
  if (!city) throw error(404, 'Not found')

  const searchState = searchStateFromUrl(url, {
    query: city.name,
    location: { city: city.name },
    dates: {
      checkIn: active.pickupDate || undefined,
      checkOut: active.dropoffDate || undefined,
    },
    sort: 'recommended',
    page: 1,
  })
  searchState.query = city.name
  searchState.location = {
    ...(searchState.location || {}),
    city: city.name,
  }

  const source = await loadCarRentalResultsPageFromDb({
    citySlug,
    query: city.name,
    pickupDate: active.pickupDate,
    dropoffDate: active.dropoffDate,
    sort: String(searchState.sort || 'recommended'),
    page: searchState.page || 1,
    pageSize: 6,
    filters: (searchState.filters || {}) as Record<string, unknown>,
  })

  searchState.page = source.page
  searchState.sort = source.activeSort
  searchState.filters = toCarRentalsSearchStateFilters(
    source.selectedFilters,
    (searchState.filters || {}) as Record<string, unknown>,
  )

  return {
    citySlug,
    city,
    page: source.page,
    items: source.results.map((result) => ({
      slug: result.slug,
      name: result.name,
    })),
    results: source.results,
    totalCount: source.totalCount,
    totalPages: source.totalPages,
    activeSort: source.activeSort,
    selectedFilters: source.selectedFilters,
    facets: source.facets,
    searchState,
    active,
  }
})

export default component$(() => {
  const data = useCityCarRentals().value

  return (
    <Page breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Car Rentals', href: '/car-rentals' },
      { label: data.city.name },
    ]}>

      <div class="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div class="flex flex-wrap gap-2">
            <span class="t-badge">
              {data.city.region}, {data.city.country}
            </span>
            <span class="t-badge">{data.totalCount} rentals</span>
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

        <aside
          class="lg:sticky lg:self-start"
          style={{ top: "var(--sticky-top-offset)" }}
        >
          <CarRentalSearchCard
            title={`Search car rentals in ${data.city.name}`}
            destinationValue={data.city.name}
            pickupDate={data.active.pickupDate || ''}
            dropoffDate={data.active.dropoffDate || ''}
            drivers={data.active.drivers != null ? String(data.active.drivers) : ''}
            submitLabel="See results"
            helperText="This city page is indexable. Search pages remain noindex."
          />
        </aside>
      </div>

      <section class="mt-8">
        <CarRentalsResultsAdapter
          results={data.results}
          totalCount={data.totalCount}
          page={data.page}
          totalPages={data.totalPages}
          activeSort={data.activeSort}
          selectedFilters={data.selectedFilters}
          filterFacets={data.facets}
          searchState={data.searchState}
          queryLabel={data.city.name}
          basePath={buildCityHref(data.citySlug)}
          urlOptions={{
            includeQueryParam: false,
            includeLocationParams: false,
            dateParamKeys: { checkIn: 'pickupDate', checkOut: 'dropoffDate' },
          }}
          emptyPrimaryAction={{ label: 'Search car rentals again', href: '/car-rentals' }}
          emptySecondaryAction={{ label: 'Browse rental cities', href: '/car-rentals/in' }}
        />
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
          numberOfItems: data.totalCount,
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

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`
}

const parseRentalParams = (sp: URLSearchParams): RentalParams => {
  const pickupDate = normalizeIsoDate(sp.get('pickupDate'))
  const dropoffDate = normalizeIsoDate(sp.get('dropoffDate'))
  const drivers = clampMaybeInt(sp.get('drivers'), 1, 6)
  return { pickupDate, dropoffDate, drivers }
}

const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null
  const s = String(raw).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  if (n < min) return min
  if (n > max) return max
  return n
}

type RentalParams = {
  pickupDate: string | null
  dropoffDate: string | null
  drivers: number | null
}
