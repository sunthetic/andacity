import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { getOgSecret, encodeOgPayload, signOgPayload } from '~/lib/seo/og-sign'
import { getHotelBySlug } from '~/data/hotels'
import type { Hotel } from '~/data/hotels'

export const useHotelPage = routeLoader$(({ params, url, error }) => {
  const slug = String(params.slug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')

  const hotel = getHotelBySlug(slug)
  if (!hotel) throw error(404, 'Not found')

  const active = parseHotelStayParams(url.searchParams)
  const nights = computeNights(active.checkIn, active.checkOut)
  const partyLabel = buildPartyLabel(active.adults, active.rooms)

  const pricing = computePricing(hotel, nights, active.rooms)

  // Suggested backlinks (search is noindex, fine for conversion)
  const searchHref = buildSearchHotelsHref({
    query: hotel.cityQuery,
    page: 1,
    checkIn: active.checkIn,
    checkOut: active.checkOut,
    adults: active.adults,
    rooms: active.rooms,
  })

  return {
    slug,
    hotel,
    active,
    nights,
    partyLabel,
    pricing,
    searchHref,
  }
})

export default component$(() => {
  const data = useHotelPage().value
  const h = data.hotel

  return (
    <div class="pb-24 lg:pb-10">
      <div class="mx-auto max-w-6xl px-4 pt-8">
        {/* Breadcrumbs */}
        <div class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
          <a class="hover:text-[color:var(--color-text)]" href="/">
            Home
          </a>
          <span class="text-[color:var(--color-text-subtle)]">/</span>
          <a class="hover:text-[color:var(--color-text)]" href={data.searchHref}>
            Hotels
          </a>
          <span class="text-[color:var(--color-text-subtle)]">/</span>
          <span class="text-[color:var(--color-text)]">{h.name}</span>
        </div>

        {/* Hero: hotel name + trust row */}
        <div class="mt-4 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="t-badge">{h.stars}★</span>
              <span class="t-badge">{h.neighborhood}</span>
              <span class="t-badge">{h.city}</span>
            </div>

            <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
              {h.name}
            </h1>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span class="font-medium text-[color:var(--color-text)]">{h.rating.toFixed(1)} ★</span>
              <span>({h.reviewCount.toLocaleString('en-US')} reviews)</span>
              <span class="text-[color:var(--color-text-subtle)]">·</span>
              <span>{h.addressLine}</span>
            </div>

            {/* Heatmap-informed trust + clarity row */}
            <div class="mt-4 flex flex-wrap gap-2">
              {h.policies.freeCancellation ? (
                <span class="t-badge t-badge--deal">Free cancellation</span>
              ) : (
                <span class="t-badge">Cancellation varies</span>
              )}
              {h.policies.payLater ? (
                <span class="t-badge t-badge--deal">Pay later</span>
              ) : (
                <span class="t-badge">Prepay options</span>
              )}
              {h.policies.noResortFees ? (
                <span class="t-badge">No resort fees</span>
              ) : (
                <span class="t-badge">Fees may apply</span>
              )}
              <span class="t-badge">Transparent totals</span>
            </div>

            {/* Gallery */}
            <div class="mt-6 grid gap-3 lg:grid-cols-[2fr_1fr]">
              <div class="t-card overflow-hidden">
                <img class="h-64 w-full object-cover lg:h-96" src={h.images[0]} alt={h.name} loading="eager" />
              </div>
              <div class="grid gap-3">
                {h.images.slice(1, 3).map((src) => (
                  <div key={src} class="t-card overflow-hidden">
                    <img class="h-32 w-full object-cover lg:h-[186px]" src={src} alt={h.name} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + amenities (high scan zone) */}
            <section class="mt-8 t-card p-5">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Overview</h2>
              <p class="mt-2 max-w-[90ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
                {h.summary}
              </p>

              <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {h.amenities.slice(0, 9).map((a) => (
                  <div key={a} class="t-panel flex items-center justify-between gap-3 px-4 py-3">
                    <span class="text-sm text-[color:var(--color-text)]">{a}</span>
                    <span class="t-badge">Included</span>
                  </div>
                ))}
              </div>

              <div class="mt-4">
                <a class="text-sm text-[color:var(--color-action)] hover:underline" href="#amenities">
                  See all amenities →
                </a>
              </div>
            </section>

            {/* Rooms (conversion core) */}
            <section class="mt-8" id="rooms">
              <div class="flex items-end justify-between gap-3">
                <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Rooms</h2>
                <div class="text-sm text-[color:var(--color-text-muted)]">
                  {data.nights ? (
                    <span>
                      {data.nights} nights · {data.partyLabel}
                    </span>
                  ) : (
                    <a class="text-[color:var(--color-action)] hover:underline" href="#stay">
                      Add dates to see totals
                    </a>
                  )}
                </div>
              </div>

              <div class="mt-4 grid gap-3">
                {h.rooms.map((r) => (
                  <RoomCard key={r.id} room={r} nights={data.nights} currency={h.currency} roomsCount={data.active.rooms} />
                ))}
              </div>
            </section>

            {/* Amenities full */}
            <section class="mt-8 t-card p-5" id="amenities">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Amenities</h2>
              <div class="mt-4 flex flex-wrap gap-2">
                {h.amenities.map((a) => (
                  <span key={a} class="t-badge">
                    {a}
                  </span>
                ))}
              </div>
            </section>

            {/* Policies (trust) */}
            <section class="mt-8 t-card p-5" id="policies">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">Policies</h2>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Cancellation</div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">{h.policies.cancellationBlurb}</div>
                </div>

                <div class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Payment</div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">{h.policies.paymentBlurb}</div>
                </div>

                <div class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Fees</div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">{h.policies.feesBlurb}</div>
                </div>

                <div class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Check-in</div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                    Check-in {h.policies.checkInTime} · Check-out {h.policies.checkOutTime}
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ (indexable) */}
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
          </div>

          {/* Sticky booking card (primary conversion zone) */}
          <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="t-card p-5" id="stay">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Your stay</div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Set dates to reveal totals. GET URLs stay shareable.
                  </div>
                </div>
                <span class="t-badge">Hotels</span>
              </div>

              <form method="get" class="mt-4 grid gap-3">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-in</label>
                    <input
                      name="checkIn"
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="YYYY-MM-DD"
                      value={data.active.checkIn || ''}
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-out</label>
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
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Adults</label>
                    <input
                      name="adults"
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="2"
                      value={data.active.adults != null ? String(data.active.adults) : ''}
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Rooms</label>
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
              </form>

              <div class="mt-5 border-t border-[color:var(--color-divider)] pt-5">
                <div class="flex items-end justify-between gap-3">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    From {formatMoney(h.fromNightly, h.currency)}
                    <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
                  </div>
                  {data.nights ? <span class="t-badge">{data.nights} nights</span> : <span class="t-badge">Set dates</span>}
                </div>

                <div class="mt-3 grid gap-2 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[color:var(--color-text-muted)]">Room subtotal</span>
                    <span class="font-medium text-[color:var(--color-text)]">
                      {data.pricing.subtotal != null ? formatMoney(data.pricing.subtotal, h.currency) : '—'}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[color:var(--color-text-muted)]">Taxes + fees (est.)</span>
                    <span class="font-medium text-[color:var(--color-text)]">
                      {data.pricing.taxes != null ? formatMoney(data.pricing.taxes, h.currency) : '—'}
                    </span>
                  </div>

                  <div class="flex items-center justify-between border-t border-[color:var(--color-divider)] pt-2">
                    <span class="text-[color:var(--color-text-muted)]">Est. total</span>
                    <span class="text-base font-semibold text-[color:var(--color-text-strong)]">
                      {data.pricing.total != null ? formatMoney(data.pricing.total, h.currency) : '—'}
                    </span>
                  </div>
                </div>

                <div class="mt-4">
                  <a class="t-btn-primary block text-center" href="#rooms">
                    Select a room
                  </a>
                </div>

                <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                  Estimate only. Final total depends on room, cancellation terms, and payment schedule.
                </div>
              </div>
            </div>

            {/* Secondary trust card */}
            <div class="mt-4 t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Why Andacity</div>
              <ul class="mt-3 space-y-2 text-sm text-[color:var(--color-text-muted)]">
                <li>Transparent totals and policy clarity</li>
                <li>Fast filtering and shareable URLs</li>
                <li>SEO: destinations + hotels earn rankings</li>
              </ul>

              <div class="mt-4">
                <a class="t-badge block text-center hover:bg-white" href={data.searchHref}>
                  Compare more hotels →
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMoney(h.fromNightly, h.currency)}{' '}
              <span class="text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              {data.nights ? `${data.nights} nights · ` : ''}
              {data.partyLabel}
            </div>
          </div>

          <a class="t-btn-primary px-5" href="#rooms">
            Rooms
          </a>
        </div>
      </div>
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelPage)
  const h = data.hotel

  const title = `${h.name} | Andacity Travel`
  const description = `${h.name} in ${h.city}. Compare rooms with transparent totals, clear cancellation terms, and amenities. From ${formatMoney(h.fromNightly, h.currency)}/night.`

  // IMPORTANT: this page route is /hotel/[slug]
  const canonicalHref = new URL(`/hotel/${encodeURIComponent(data.slug)}`, url.origin).href

  // Optional: once you build OG hotel PNGs
  let ogImage = new URL(`/og/hotel/${encodeURIComponent(data.slug)}.png`, url.origin).href

  const secret = getOgSecret()
  if (secret) {
    const payload: OgHotelPayload = {
      slug: data.slug,
      name: h.name,
      city: h.city,
      neighborhood: h.neighborhood,
      fromNightly: h.fromNightly,
      currency: h.currency,
      rating: h.rating,
      reviewCount: h.reviewCount,
      refundable: h.policies.freeCancellation,
      payLater: h.policies.payLater,
    }

    const p = encodeOgPayload(payload)
    const sig = signOgPayload(p, secret)
    ogImage = ogImage + `?p=${encodeURIComponent(p)}&sig=${encodeURIComponent(sig)}`
  }

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
            item: new URL(`/search/hotels/${encodeURIComponent(h.cityQuery)}/1`, url.origin).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: h.name,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'Hotel',
        name: h.name,
        description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: h.addressLine,
          addressLocality: h.city,
          addressRegion: h.region,
          addressCountry: h.country,
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

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },

      // RouterHead renders this meta as JSON-LD script
      { name: 'json-ld', content: jsonLd },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}

const RoomCard = component$(({ room, nights, currency, roomsCount }: RoomCardProps) => {
  const count = roomsCount ?? 1
  const subtotal = nights ? room.priceFrom * nights * count : null
  const taxes = subtotal != null ? Math.round(subtotal * 0.14) : null
  const total = subtotal != null && taxes != null ? subtotal + taxes : null

  return (
    <div class="t-card p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="text-base font-semibold text-[color:var(--color-text-strong)]">{room.name}</div>
          <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Sleeps {room.sleeps} · {room.beds} · {room.sizeSqft} sq ft
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            {room.refundable ? <span class="t-badge t-badge--deal">Free cancellation</span> : <span class="t-badge">Cancellation varies</span>}
            {room.payLater ? <span class="t-badge t-badge--deal">Pay later</span> : <span class="t-badge">Prepay</span>}
            {room.badges.map((b) => (
              <span key={b} class="t-badge">
                {b}
              </span>
            ))}
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            {room.features.map((f) => (
              <span key={f} class="t-badge">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div class="min-w-[220px] text-right">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            {formatMoney(room.priceFrom, currency)}
            <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
          </div>

          {total != null ? (
            <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
              Est. total:{' '}
              <span class="font-medium text-[color:var(--color-text)]">{formatMoney(total, currency)}</span>
              <span class="ml-1">
                ({nights} nights · {count} room{count === 1 ? '' : 's'})
              </span>
            </div>
          ) : (
            <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">Add dates to see totals</div>
          )}

          <div class="mt-4 flex flex-col gap-2">
            <a class="t-btn-primary block text-center" href="#">
              Choose
            </a>
            <a class="t-badge block text-center hover:bg-white" href="#policies">
              View policies
            </a>
          </div>
        </div>
      </div>
    </div>
  )
})

/* -----------------------------
   Stay params + pricing
----------------------------- */

const parseHotelStayParams = (sp: URLSearchParams): StayParams => {
  const checkIn = normalizeIsoDate(sp.get('checkIn'))
  const checkOut = normalizeIsoDate(sp.get('checkOut'))
  const adults = clampMaybeInt(sp.get('adults'), 1, 10)
  const rooms = clampMaybeInt(sp.get('rooms'), 1, 6)

  return { checkIn, checkOut, adults, rooms }
}

const buildPartyLabel = (adults: number | null, rooms: number | null) => {
  const a = adults ?? 2
  const r = rooms ?? 1
  return `${a} adult${a === 1 ? '' : 's'} · ${r} room${r === 1 ? '' : 's'}`
}

const computePricing = (hotel: Hotel, nights: number | null, rooms: number | null): Pricing => {
  if (!nights) return { subtotal: null, taxes: null, total: null }

  const r = rooms ?? 1
  const subtotal = hotel.fromNightly * nights * r
  const taxes = Math.round(subtotal * 0.14)
  const total = subtotal + taxes

  return { subtotal, taxes, total }
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

/* -----------------------------
   Helpers
----------------------------- */

const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null
  const s = String(raw).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

const computeNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null
  const a = Date.parse(checkIn)
  const b = Date.parse(checkOut)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return null
  return Math.min(diff, 30)
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

type Pricing = {
  subtotal: number | null
  taxes: number | null
  total: number | null
}

type HotelPolicy = {
  freeCancellation: boolean
  payLater: boolean
  noResortFees: boolean
  checkInTime: string
  checkOutTime: string
  cancellationBlurb: string
  paymentBlurb: string
  feesBlurb: string
}

type Room = {
  id: string
  name: string
  sleeps: number
  beds: string
  sizeSqft: number
  priceFrom: number
  refundable: boolean
  payLater: boolean
  badges: string[]
  features: string[]
}

type FAQ = {
  q: string
  a: string
}

type RoomCardProps = {
  room: Room
  nights: number | null
  currency: string
  roomsCount: number | null
}

type OgHotelPayload = {
  slug: string
  name?: string
  city?: string
  neighborhood?: string
  fromNightly?: number
  currency?: string
  rating?: number
  reviewCount?: number
  refundable?: boolean
  payLater?: boolean
}
