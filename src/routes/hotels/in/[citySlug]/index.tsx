import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { getHotelCityBySlug } from '~/data/hotel-cities'
import { HOTELS_BY_SLUG } from '~/data/hotels'
import { ListingCardGrid } from "~/components/vertical/ListingCardGrid"
import { Breadcrumbs } from '~/components/site/Breadcrumbs'

export const useHotelCityPage = routeLoader$(({ params, url, error }) => {
  const slug = String(params.citySlug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')

  const city = getHotelCityBySlug(slug)
  if (!city) throw error(404, 'Not found')

  const active = parseStayParams(url.searchParams)

  const hotels = city.hotelSlugs
    .map((s) => HOTELS_BY_SLUG[s])
    .filter(Boolean)
    .slice(0, 18)

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
    active,
    searchHref,
  }
})

export default component$(() => {
  const data = useHotelCityPage().value
  const c = data.city

  return (
    <Page>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Andacity Travel', href: '/' },
          { label: 'Hotels', href: '/hotels' },
          { label: 'Cities', href: '/hotels/in' },
          { label: c.city, href: buildHotelsInCityHref(data.slug) },
        ]}
      />

      {/* Header + sticky CTA card */}
      <div class="mt-4 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
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
          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Search hotels in {c.city}
            </div>

            <form method="get" action={buildHotelsInCityHref(data.slug)} class="mt-4 grid gap-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Check-in
                  </label>
                  <input
                    name="checkIn"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.active.checkIn || ''}
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Check-out
                  </label>
                  <input
                    name="checkOut"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.active.checkOut || ''}
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Adults
                  </label>
                  <input
                    name="adults"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="2"
                    value={data.active.adults != null ? String(data.active.adults) : ''}
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Rooms
                  </label>
                  <input
                    name="rooms"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="1"
                    value={data.active.rooms != null ? String(data.active.rooms) : ''}
                  />
                </div>
              </div>

              <button class="t-btn-primary" type="submit">
                Update
              </button>

              <a class="t-btn-primary block text-center" href={data.searchHref}>
                See hotel results
              </a>

              <div class="text-xs text-[color:var(--color-text-muted)]">
                This city page is indexable. Search pages remain noindex.
              </div>
            </form>
          </div>
        </aside>
      </div>

      {/* Featured hotels grid */}
      <section class="mt-8">
        <div class="flex items-end justify-between gap-3">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Featured hotels</h2>
          <a class="text-sm text-[color:var(--color-action)] hover:underline" href={data.searchHref}>
            View all →
          </a>
        </div>

        <ListingCardGrid variant="hotels" items={data.hotels} density="compact" />
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
