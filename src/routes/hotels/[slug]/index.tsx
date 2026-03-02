import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { HOTELS_BY_SLUG } from '~/data/hotels'

export const useHotelPage = routeLoader$(({ params, url, error }) => {
  const slug = String(params.slug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')

  const hotel = HOTELS_BY_SLUG[slug]
  if (!hotel) throw error(404, 'Not found')

  // Optional UX params (do not index these permutations)
  const checkIn = url.searchParams.get('checkIn') || null
  const checkOut = url.searchParams.get('checkOut') || null
  const guests = clampIntOrNull(url.searchParams.get('guests'), 1, 12)

  return {
    slug,
    hotel,
    checkIn,
    checkOut,
    guests,
  }
})

export default component$(() => {
  const data = useHotelPage().value
  const h = data.hotel

  const hasDates = Boolean(data.checkIn && data.checkOut)

  return (
    <div class="mx-auto max-w-6xl px-4 pb-24 pt-8 lg:pb-10">
      {/* Breadcrumbs */}
      <div class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
        <a class="hover:text-[color:var(--color-text)]" href="/">Home</a>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <a class="hover:text-[color:var(--color-text)]" href="/destinations">Destinations</a>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <a class="hover:text-[color:var(--color-text)]" href={`/destinations/${encodeURIComponent(h.destinationSlug)}`}>
          {h.city}
        </a>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <span class="text-[color:var(--color-text)]">{h.name}</span>
      </div>

      {/* Header */}
      <div class="mt-4 grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            {h.name}
          </h1>

          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
            <span>{h.stars}★</span>
            <span class="text-[color:var(--color-text-subtle)]">·</span>
            <span>{h.rating.toFixed(1)} ★ ({h.reviewCount.toLocaleString('en-US')} reviews)</span>
            <span class="text-[color:var(--color-text-subtle)]">·</span>
            <span>{h.city}</span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="t-badge">Transparent totals</span>
            <span class="t-badge">Policy clarity</span>
            <span class="t-badge">{h.amenities.slice(0, 2).join(' · ')}</span>
          </div>
        </div>

        {/* Sticky booking module (heatmap: primary conversion zone) */}
        <div class="lg:sticky lg:top-24 lg:self-start">
          <div class="t-card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  From {formatMoney(minRoomPrice(h), 'USD')}
                  <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
                </div>
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Total shown at checkout · includes all required fees we know about
                </div>
              </div>
              <span class="t-badge">Top rated</span>
            </div>

            <div class="mt-4 grid gap-2">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-in</label>
                  <input
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.checkIn || ''}
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-out</label>
                  <input
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.checkOut || ''}
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Guests</label>
                  <input
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="2"
                    value={data.guests ? String(data.guests) : ''}
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Rooms</label>
                  <input
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="1"
                  />
                </div>
              </div>

              <a class="t-btn-primary mt-2 text-center" href="#rooms">
                {hasDates ? 'See available rooms' : 'Browse room options'}
              </a>

              <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                We don’t index date/guest permutations.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery + key facts */}
      <div class="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section class="t-card overflow-hidden">
          <div class="grid gap-2 p-3 sm:grid-cols-2">
            {h.images.slice(0, 4).map((src) => (
              <img key={src} class="h-44 w-full rounded-2xl object-cover" src={src} alt={h.name} loading="lazy" />
            ))}
          </div>
        </section>

        <section class="t-card p-5">
          <h2 class="text-base font-semibold text-[color:var(--color-text-strong)]">What you get</h2>

          <ul class="mt-3 space-y-2 text-sm text-[color:var(--color-text-muted)]">
            {h.amenities.slice(0, 6).map((a) => (
              <li key={a} class="flex gap-2">
                <span class="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--color-action)]" />
                <span>{a}</span>
              </li>
            ))}
          </ul>

          <div class="mt-5 border-t border-[color:var(--color-divider)] pt-4 text-sm text-[color:var(--color-text-muted)]">
            <div><span class="font-medium text-[color:var(--color-text)]">Check-in:</span> {h.policies.checkIn}</div>
            <div class="mt-1"><span class="font-medium text-[color:var(--color-text)]">Check-out:</span> {h.policies.checkOut}</div>
          </div>
        </section>
      </div>

      {/* Rooms / rates (decision grid) */}
      <section class="mt-8" id="rooms">
        <div class="flex items-end justify-between gap-3">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Rooms</h2>
          <a class="text-sm text-[color:var(--color-action)] hover:underline" href={`/search/hotels/${encodeURIComponent(h.city)}/1`}>
            Compare nearby hotels
          </a>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          {h.rooms.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>

        <div class="mt-4 t-panel p-4 text-sm text-[color:var(--color-text-muted)]">
          <strong class="text-[color:var(--color-text)]">Policy clarity:</strong> {h.policies.cancellation}
        </div>
      </section>

      {/* Policies + fees (trust) */}
      <section class="mt-8 grid gap-6 lg:grid-cols-2">
        <div class="t-card p-5">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Policies</h2>
          <div class="mt-3 space-y-3 text-sm text-[color:var(--color-text-muted)]">
            <div><span class="font-medium text-[color:var(--color-text)]">Cancellation:</span> {h.policies.cancellation}</div>
            <div><span class="font-medium text-[color:var(--color-text)]">Payment:</span> {h.policies.payment}</div>
            <div><span class="font-medium text-[color:var(--color-text)]">Fees:</span> {h.policies.fees}</div>
          </div>
        </div>

        <div class="t-card p-5">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Location</h2>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            {h.address.street}, {h.address.locality}, {h.address.region} {h.address.postalCode}
          </p>
          <div class="mt-4 h-56 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" />
        </div>
      </section>

      {/* FAQ (indexable long-tail) */}
      <section class="mt-8 t-card p-5" id="faq">
        <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">FAQ</h2>
        <div class="mt-4 space-y-3">
          {h.faq.map((qa) => (
            <div key={qa.q} class="t-panel p-4">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{qa.q}</div>
              <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">{qa.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              From {formatMoney(minRoomPrice(h), 'USD')}
              <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">{h.rating.toFixed(1)} ★ · {h.reviewCount.toLocaleString('en-US')} reviews</div>
          </div>
          <a class="t-btn-primary px-5" href="#rooms">Rooms</a>
        </div>
      </div>
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelPage)
  const h = data.hotel

  // Clean canonical: do not include checkIn/checkOut/guests permutations
  const canonicalHref = new URL(`/hotels/${encodeURIComponent(data.slug)}`, url.origin).href

  const title = `${h.name} | Andacity Travel`
  const description = `Book ${h.name} in ${h.city}. Compare rooms, cancellation policies, and totals. Rated ${h.rating.toFixed(1)} from ${h.reviewCount.toLocaleString('en-US')} reviews.`

  // If any query params are present that can create infinite permutations, noindex them.
  const hasPermParams =
    url.searchParams.has('checkIn') ||
    url.searchParams.has('checkOut') ||
    url.searchParams.has('guests')

  const robots = hasPermParams
    ? 'noindex,follow,max-image-preview:large'
    : 'index,follow,max-image-preview:large'

  const ogImage = new URL(`/og/hotel/${encodeURIComponent(data.slug)}.png`, url.origin).href

  const min = minRoomPrice(h)
  const max = maxRoomPrice(h)

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
            item: new URL('/destinations', url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: h.city,
            item: new URL(`/destinations/${encodeURIComponent(h.destinationSlug)}`, url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: h.name,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'Hotel',
        '@id': canonicalHref,
        name: h.name,
        description,
        url: canonicalHref,
        address: {
          '@type': 'PostalAddress',
          streetAddress: h.address.street,
          addressLocality: h.address.locality,
          addressRegion: h.address.region,
          postalCode: h.address.postalCode,
          addressCountry: h.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: h.geo.lat,
          longitude: h.geo.lng,
        },
        starRating: {
          '@type': 'Rating',
          ratingValue: h.stars,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: h.rating,
          reviewCount: h.reviewCount,
        },
        amenityFeature: h.amenities.slice(0, 12).map((a) => ({
          '@type': 'LocationFeatureSpecification',
          name: a,
          value: true,
        })),
        image: h.images.slice(0, 6).map((src) => new URL(src, url.origin).href),
        makesOffer: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: min,
          highPrice: max,
          offerCount: h.rooms.length,
          url: canonicalHref,
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: h.faq.map((qa) => ({
          '@type': 'Question',
          name: qa.q,
          acceptedAnswer: { '@type': 'Answer', text: qa.a },
        })),
      },
    ],
  })

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: robots },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },

      { name: 'json-ld', content: jsonLd },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}

const RoomCard = component$(({ room }: RoomCardProps) => (
  <div class="t-card p-5">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{room.name}</div>
        <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
          {room.beds} · Sleeps {room.sleeps}
        </div>
      </div>
      <span class="t-badge">{room.refundability}</span>
    </div>

    <div class="mt-4 text-sm font-semibold text-[color:var(--color-text-strong)]">
      From {formatMoney(room.priceNightlyFrom, room.currency)}
      <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      {room.inclusions.slice(0, 3).map((x) => (
        <span key={x} class="t-badge">{x}</span>
      ))}
    </div>

    <a class="t-btn-primary mt-5 block text-center" href="#rooms">
      Select
    </a>

    <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
      Final total depends on dates, occupancy, and taxes/fees.
    </div>
  </div>
))

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const clampIntOrNull = (raw: string | null, min: number, max: number) => {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  if (n < min) return min
  if (n > max) return max
  return n
}

const minRoomPrice = (h: { rooms: { priceNightlyFrom: number }[] }) =>
  Math.min(...h.rooms.map((r) => r.priceNightlyFrom))

const maxRoomPrice = (h: { rooms: { priceNightlyFrom: number }[] }) =>
  Math.max(...h.rooms.map((r) => r.priceNightlyFrom))

/* -----------------------------
   Types
----------------------------- */

type RoomCardProps = {
  room: {
    id: string
    name: string
    beds: string
    sleeps: number
    refundability: string
    priceNightlyFrom: number
    currency: string
    inclusions: string[]
  }
}
