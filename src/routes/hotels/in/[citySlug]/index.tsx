import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { HotelsResultsAdapter } from '~/components/hotels/HotelsResultsAdapter'
import { Page } from '~/components/site/Page'
import { HotelCitySearchCard } from '~/components/hotels/HotelCitySearchCard'
import { normalizeHotelSort } from '~/lib/search/hotels/hotel-sort-options'
import { searchStateFromUrl } from '~/lib/search/url-to-state'
import { loadHotelCityBySlugFromDb, loadHotelsForCityFromDb } from '~/lib/queries/hotels-pages.server'

export const useHotelCityPage = routeLoader$(async ({ params, url, error }) => {
  const slug = String(params.citySlug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')

  const city = await loadHotelCityBySlugFromDb(slug)
  if (!city) throw error(404, 'Not found')

  const hotels = await loadHotelsForCityFromDb(slug)

  const active = parseStayParams(url.searchParams)

  const searchState = searchStateFromUrl(url, {
    query: city.city,
    location: { city: city.city },
    dates: {
      checkIn: active.checkIn || undefined,
      checkOut: active.checkOut || undefined,
    },
    sort: 'recommended',
    page: 1,
  })
  searchState.query = city.city
  searchState.location = {
    ...(searchState.location || {}),
    city: city.city,
  }
  searchState.sort = normalizeHotelSort(searchState.sort)

  const searchHref = buildSearchHotelsHref({
    query: city.query,
    page: 1,
    checkIn: active.checkIn,
    checkOut: active.checkOut,
    adults: active.adults,
    rooms: active.rooms,
  })

  return {
    slug,
    city,
    hotels,
    searchState,
    active,
    searchHref,
  }
})

export default component$(() => {
  const data = useHotelCityPage().value
  const c = data.city

  return (
    <Page breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Hotels', href: '/hotels' },
      { label: c.city },
    ]}>

      {/* Header + sticky CTA card */}
      <div class="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div class="flex flex-wrap gap-2">
            <span class="t-badge">
              {c.region}, {c.country}
            </span>
            <span class="t-badge">{c.hotelSlugs.length} hotels</span>
            <span class="t-badge">
              From {formatMoney(c.priceFrom, 'USD')}/night
            </span>
          </div>

          <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            Hotels in {c.city}
          </h1>

          <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Clean city guide for {c.city}. Transparent totals, clear policies, and fast filtering — without
            indexing SERPs.
          </p>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Top areas</div>
              <div class="mt-3 flex flex-wrap gap-2">
                {c.topNeighborhoods.slice(0, 6).map((x) => (
                  <span key={x.name} class="t-badge">
                    {x.name}
                  </span>
                ))}
              </div>
            </div>

            <div class="t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Popular amenities
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                {c.topAmenities.slice(0, 6).map((x) => (
                  <span key={x.name} class="t-badge">
                    {x.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <HotelCitySearchCard
            title={`Search hotels in ${c.city}`}
            action={buildHotelsInCityHref(data.slug)}
            resultsHref={data.searchHref}
            checkIn={data.active.checkIn || ''}
            checkOut={data.active.checkOut || ''}
            adults={data.active.adults != null ? String(data.active.adults) : ''}
            rooms={data.active.rooms != null ? String(data.active.rooms) : ''}
            updateLabel="Update"
            resultsLabel="See hotel results"
            helperText="This city page is indexable. Search pages remain noindex."
          />
        </aside>
      </div>

      {/* Featured hotels grid */}
      <section class="mt-8">
        <HotelsResultsAdapter citySlug={data.slug} city={c} hotels={data.hotels} searchState={data.searchState} />
      </section>

      {/* Guide content (SEO) */}
      <section class="mt-8 t-card p-5">
        <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          Guide to staying in {c.city}
        </h2>
        <div class="prose prose-sm mt-3 max-w-none text-[color:var(--color-text)]">
          <p class="text-[color:var(--color-text-muted)]">
            This section is your long-tail SEO payload: best areas, pricing seasonality, airport access,
            transit, and what matters to different traveler types.
          </p>
          <ul class="text-[color:var(--color-text-muted)]">
            <li>Top areas: {c.topNeighborhoods.slice(0, 5).map((x) => x.name).join(', ')}</li>
            <li>Popular amenities: {c.topAmenities.slice(0, 5).map((x) => x.name).join(', ')}</li>
            <li>Typical from: {formatMoney(c.priceFrom, 'USD')}+/night</li>
          </ul>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Hotels in {c.city}</div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              From {formatMoney(c.priceFrom, 'USD')}/night
            </div>
          </div>
          <a class="t-btn-primary px-5" href={data.searchHref}>
            Results
          </a>
        </div>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelCityPage)
  const c = data.city

  const title = `Hotels in ${c.city} | Andacity Travel`
  const description = `Find hotels in ${c.city}. Explore top areas and amenities, and compare options with transparent totals and policies.`

  const canonicalHref = new URL(buildHotelsInCityHref(data.slug), url.origin).href

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hotels', item: new URL('/hotels', url.origin).href },
          { '@type': 'ListItem', position: 2, name: 'Cities', item: new URL('/hotels/in', url.origin).href },
          { '@type': 'ListItem', position: 3, name: c.city, item: canonicalHref },
        ],
      },
      {
        '@type': 'Place',
        name: c.city,
        address: { '@type': 'PostalAddress', addressRegion: c.region, addressCountry: c.country },
      },
      {
        '@type': 'ItemList',
        name: `Featured hotels in ${c.city}`,
        itemListElement: data.hotels.map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: h.name,
          url: new URL(buildHotelDetailHref(h.slug), url.origin).href,
        })),
      },
      {
        name: 'robots',
        content: 'index,follow,max-image-preview:large',
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
    scripts: [
      {
        key: `ld-city-${data.slug}`,
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildHotelsInCityHref = (citySlug: string) => {
  return `/hotels/in/${encodeURIComponent(citySlug)}`
}

const buildHotelDetailHref = (hotelSlug: string) => {
  return `/hotels/${encodeURIComponent(hotelSlug)}`
}

const parseStayParams = (sp: URLSearchParams): StayParams => {
  const checkIn = normalizeIsoDate(sp.get('checkIn'))
  const checkOut = normalizeIsoDate(sp.get('checkOut'))
  const adults = clampMaybeInt(sp.get('adults'), 1, 10)
  const rooms = clampMaybeInt(sp.get('rooms'), 1, 6)
  return { checkIn, checkOut, adults, rooms }
}

const buildSearchHotelsHref = (d: {
  query: string
  page: number
  checkIn: string | null
  checkOut: string | null
  adults: number | null
  rooms: number | null
}) => {
  const base = `/search/hotels/${encodeURIComponent(d.query)}/${d.page}`
  const sp = new URLSearchParams()

  if (d.checkIn) sp.set('checkIn', d.checkIn)
  if (d.checkOut) sp.set('checkOut', d.checkOut)
  if (d.adults != null) sp.set('adults', String(d.adults))
  if (d.rooms != null) sp.set('rooms', String(d.rooms))

  const qs = sp.toString()
  return qs ? `${base}?${qs}` : base
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

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

/* -----------------------------
   Types
----------------------------- */

type StayParams = {
  checkIn: string | null
  checkOut: string | null
  adults: number | null
  rooms: number | null
}
