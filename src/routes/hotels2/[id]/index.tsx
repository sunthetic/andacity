import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'

export const useHotelPage = routeLoader$(({ params }) => {
  // Replace this with your API call(s)
  const hotel: Hotel = {
    id: params.id,
    name: 'Harborline Suites',
    city: 'San Diego, CA',
    rating: 4.6,
    reviewCount: 2841,
    nightlyFrom: 219,
    totalEstimate: 982,
    currency: 'USD',
    badges: [
      { tone: 'deal', label: 'Free cancellation' },
      { tone: 'neutral', label: 'Breakfast available' },
      { tone: 'positive', label: 'Great location' },
    ],
    highlights: [
      'Walkable waterfront',
      'Fast Wi-Fi',
      'Pool + gym',
      '24h front desk',
    ],
    images: [
      { src: '/img/demo/hotel-1.jpg', alt: 'Lobby' },
      { src: '/img/demo/hotel-2.jpg', alt: 'Room' },
      { src: '/img/demo/hotel-3.jpg', alt: 'Pool' },
      { src: '/img/demo/hotel-4.jpg', alt: 'View' },
      { src: '/img/demo/hotel-5.jpg', alt: 'Bathroom' },
    ],
    rooms: [
      {
        id: 'rm-king',
        name: 'King Studio',
        sleeps: 2,
        bed: '1 King',
        refundable: true,
        breakfast: false,
        perks: ['Free cancellation', 'Pay later'],
        price: 239,
        left: 3,
        image: { src: '/img/demo/room-1.jpg', alt: 'King Studio' },
      },
      {
        id: 'rm-double',
        name: 'Double Queen',
        sleeps: 4,
        bed: '2 Queens',
        refundable: true,
        breakfast: true,
        perks: ['Breakfast included', 'Free cancellation'],
        price: 279,
        left: 2,
        image: { src: '/img/demo/room-2.jpg', alt: 'Double Queen' },
      },
      {
        id: 'rm-suite',
        name: 'Harbor Suite',
        sleeps: 4,
        bed: '1 King + Sofa',
        refundable: false,
        breakfast: true,
        perks: ['Breakfast included'],
        price: 349,
        left: 1,
        image: { src: '/img/demo/room-3.jpg', alt: 'Suite' },
      },
    ],
    policies: [
      { title: 'Cancellation', body: 'Free cancellation until 24 hours before check-in.' },
      { title: 'Check-in / out', body: 'Check-in: 3:00 PM · Check-out: 11:00 AM.' },
      { title: 'Fees', body: 'A nightly resort fee may apply at check-in.' },
    ],
  }

  return {
    hotel,
    searchContext: {
      checkIn: '2026-03-18',
      checkOut: '2026-03-22',
      guests: 2,
      rooms: 1,
    },
  }
})

export default component$(() => {
  const data = useHotelPage().value
  const { hotel, searchContext } = data

  return (
    <div className="pb-24 lg:pb-10">
      {/* Top utility bar (keeps search context visible) */}
      <div className="sticky top-0 z-40 border-b border-[color:var(--color-divider)] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[240px] items-center gap-2 text-sm">
              <a className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]" href="/hotels">
                Hotels
              </a>
              <span className="text-[color:var(--color-text-subtle)]">/</span>
              <span className="text-[color:var(--color-text)]">{hotel.name}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="t-badge">
                {formatDate(searchContext.checkIn)} → {formatDate(searchContext.checkOut)}
              </span>
              <span className="t-badge">
                {searchContext.guests} guests · {searchContext.rooms} room
              </span>
              <a className="t-badge hover:bg-[color:var(--color-neutral-50)]" href="/search/hotels">
                Edit search
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-3xl">
            {hotel.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
            <span>{hotel.city}</span>
            <span className="text-[color:var(--color-text-subtle)]">•</span>
            <span className="text-[color:var(--color-text)]">
              {hotel.rating.toFixed(1)} ★
            </span>
            <span>({hotel.reviewCount.toLocaleString()} reviews)</span>
          </div>
        </div>

        {/* Hero row: gallery + sticky booking card */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
          <Gallery images={hotel.images} />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <BookingCard
              nightlyFrom={hotel.nightlyFrom}
              totalEstimate={hotel.totalEstimate}
              currency={hotel.currency}
              badges={hotel.badges}
            />
          </div>
        </div>

        {/* Trust row: highlights + badges */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap gap-2">
            {hotel.highlights.map((h) => (
              <span key={h} className="t-badge">{h}</span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {hotel.badges.map((b) => (
              <Badge key={b.label} tone={b.tone} label={b.label} />
            ))}
          </div>
        </div>

        {/* Section nav (anchors) */}
        <div className="mt-6">
          <div className="t-panel p-3">
            <nav className="flex flex-wrap gap-2 text-sm">
              <AnchorPill href="#overview" label="Overview" />
              <AnchorPill href="#rooms" label="Rooms" />
              <AnchorPill href="#amenities" label="Amenities" />
              <AnchorPill href="#policies" label="Policies" />
              <AnchorPill href="#reviews" label="Reviews" />
              <AnchorPill href="#location" label="Location" />
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.55fr]">
          {/* Left column */}
          <div className="space-y-6">
            <section id="overview" className="t-card p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Overview</h2>
              <p className="mt-2 text-[color:var(--color-text-muted)]">
                Clean, scannable overview copy. Lead with the 1–2 differentiators users care about,
                then keep the rest in bullets and short paragraphs.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoItem label="Check-in" value="3:00 PM" />
                <InfoItem label="Check-out" value="11:00 AM" />
                <InfoItem label="Neighborhood" value="Waterfront" />
                <InfoItem label="Parking" value="Paid onsite" />
              </div>

              <div className="mt-4">
                <div className="t-panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[color:var(--color-text-strong)]">
                        Popular choice for these dates
                      </div>
                      <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        High demand: prices tend to rise closer to check-in.
                      </div>
                    </div>
                    <span className="t-badge t-badge--deal">Deal</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="rooms" className="t-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Rooms</h2>
                <div className="flex flex-wrap gap-2">
                  <FilterChip label="Refundable" />
                  <FilterChip label="Breakfast" />
                  <FilterChip label="Sleeps 4+" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {hotel.rooms.map((r) => (
                  <RoomCard key={r.id} room={r} currency={hotel.currency} />
                ))}
              </div>
            </section>

            <section id="amenities" className="t-card p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Amenities</h2>
              <ul className="mt-3 grid gap-2 text-sm text-[color:var(--color-text-muted)] sm:grid-cols-2">
                <ListItem>Pool</ListItem>
                <ListItem>Gym</ListItem>
                <ListItem>Wi-Fi</ListItem>
                <ListItem>Air conditioning</ListItem>
                <ListItem>Front desk 24h</ListItem>
                <ListItem>Laundry</ListItem>
              </ul>
            </section>

            <section id="policies" className="t-card p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Policies</h2>
              <div className="mt-3 space-y-3">
                {hotel.policies.map((p) => (
                  <div key={p.title} className="t-panel p-4">
                    <div className="text-sm font-medium text-[color:var(--color-text-strong)]">
                      {p.title}
                    </div>
                    <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                      {p.body}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="reviews" className="t-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Reviews</h2>
                <a className="text-sm text-[color:var(--color-action)] hover:underline" href="#reviews">
                  Read all
                </a>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ReviewCard name="Maya" text="Very clean, easy check-in, perfect location." score={5} />
                <ReviewCard name="Chris" text="Rooms were quiet. Great value for the dates." score={5} />
              </div>
            </section>

            <section id="location" className="t-card p-5">
              <h2 className="text-lg font-semibold text-[color:var(--color-text-strong)]">Location</h2>
              <div className="mt-3 t-panel p-4">
                <div className="text-sm text-[color:var(--color-text-muted)]">
                  Map embed placeholder. Keep it compact; don’t let the map steal conversion focus.
                </div>
                <div className="mt-3 h-44 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" />
              </div>
            </section>
          </div>

          {/* Right column (secondary info; booking card already above on desktop) */}
          <div className="hidden lg:block space-y-4">
            <div className="t-card p-5">
              <h3 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Price tips</h3>
              <ul className="mt-2 space-y-2 text-sm text-[color:var(--color-text-muted)]">
                <li>Refundable rates cost more but reduce risk</li>
                <li>Breakfast bundles can beat buying onsite</li>
                <li>Compare total (fees included), not nightly only</li>
              </ul>
            </div>

            <div className="t-card p-5">
              <h3 className="text-sm font-semibold text-[color:var(--color-text-strong)]">Need help?</h3>
              <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                Add chat / support entry points here, but keep them low prominence.
              </p>
              <button className="t-btn-primary mt-3 w-full">
                Contact support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMoney(hotel.nightlyFrom, hotel.currency)}
              <span className="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
            </div>
            <div className="text-xs text-[color:var(--color-text-muted)]">
              Total est. {formatMoney(hotel.totalEstimate, hotel.currency)}
            </div>
          </div>
          <button className="t-btn-primary px-5">
            Reserve
          </button>
        </div>
      </div>
    </div>
  )
})

const Gallery = component$(({ images }: GalleryProps) => {
  // Heatmap cue: one big image + small supporting images, big click target
  const primary = images[0]
  const rest = images.slice(1, 5)

  return (
    <div className="t-card overflow-hidden p-0">
      <div className="grid gap-2 p-2 lg:grid-cols-[1.6fr_1fr]">
        <a className="block overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" href="#photos">
          <img className="h-72 w-full object-cover lg:h-[360px]" src={primary?.src} alt={primary?.alt} loading="lazy" />
        </a>

        <div className="grid grid-cols-2 gap-2">
          {rest.map((img) => (
            <a
              key={img.src}
              className="block overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]"
              href="#photos"
            >
              <img className="h-36 w-full object-cover lg:h-[176px]" src={img.src} alt={img.alt} loading="lazy" />
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-divider)] px-4 py-3">
        <div className="text-sm text-[color:var(--color-text-muted)]">
          {images.length} photos
        </div>
        <button className="t-badge hover:bg-[color:var(--color-neutral-50)]">
          View all photos
        </button>
      </div>
    </div>
  )
})

const BookingCard = component$(({ nightlyFrom, totalEstimate, currency, badges }: BookingCardProps) => {
  return (
    <div className="t-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            {formatMoney(nightlyFrom, currency)}
            <span className="ml-1 text-sm font-normal text-[color:var(--color-text-muted)]">/night</span>
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Total estimate {formatMoney(totalEstimate, currency)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {badges.slice(0, 2).map((b) => (
            <Badge key={b.label} tone={b.tone} label={b.label} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button className="t-btn-primary w-full">Reserve</button>
        <button className="w-full rounded-xl border border-[color:var(--color-border-strong)] bg-white px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-neutral-50)]">
          Save
        </button>
      </div>

      <div className="mt-4 t-panel p-4">
        <div className="text-sm font-medium text-[color:var(--color-text-strong)]">
          Good to know
        </div>
        <ul className="mt-2 space-y-1 text-sm text-[color:var(--color-text-muted)]">
          <li>Pay later options may be available</li>
          <li>Prices can change until you reserve</li>
        </ul>
      </div>
    </div>
  )
})

const RoomCard = component$(({ room, currency }: RoomCardProps) => {
  return (
    <div className="t-panel overflow-hidden">
      <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
        <div className="bg-[color:var(--color-neutral-50)]">
          <img className="h-40 w-full object-cover sm:h-full" src={room.image.src} alt={room.image.alt} loading="lazy" />
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px]">
              <div className="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {room.name}
              </div>
              <div className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Sleeps {room.sleeps} · {room.bed}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {room.perks.map((p) => (
                  <Badge
                    key={p}
                    tone={p.toLowerCase().includes('breakfast') ? 'deal' : 'neutral'}
                    label={p}
                  />
                ))}
                {room.refundable ? (
                  <Badge tone="positive" label="Refundable" />
                ) : (
                  <Badge tone="neutral" label="Non-refundable" />
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-semibold text-[color:var(--color-text-strong)]">
                {formatMoney(room.price, currency)}
              </div>
              <div className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                per night
              </div>

              {typeof room.left === 'number' && room.left <= 2 ? (
                <div className="mt-2 rounded-lg border border-[color:var(--color-tertiary-150)] bg-[color:var(--color-deal-soft)] px-2 py-1 text-xs text-[color:var(--color-tertiary-700)]">
                  Only {room.left} left
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-divider)] pt-3">
            <a className="text-sm text-[color:var(--color-action)] hover:underline" href="#policies">
              View cancellation policy
            </a>
            <button className="t-btn-primary">
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const Badge = component$(({ tone, label }: BadgeProps) => {
  const cls =
    tone === 'deal'
      ? 't-badge t-badge--deal'
      : tone === 'positive'
        ? 'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium bg-[color:var(--color-success-soft)] text-[color:var(--color-secondary-700)] border-[color:var(--color-secondary-150)]'
        : 't-badge'

  return <span className={cls}>{label}</span>
})

const AnchorPill = component$(({ href, label }: AnchorPillProps) => (
  <a
    className="inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-white px-3 py-1.5 text-sm text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-neutral-50)] hover:text-[color:var(--color-text)]"
    href={href}
  >
    {label}
  </a>
))

const FilterChip = component$(({ label }: FilterChipProps) => (
  <button
    className="inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] hover:bg-white"
    type="button"
  >
    {label}
  </button>
))

const InfoItem = component$(({ label, value }: InfoItemProps) => (
  <div className="t-panel p-3">
    <div className="text-xs font-medium text-[color:var(--color-text-subtle)]">{label}</div>
    <div className="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">{value}</div>
  </div>
))

const ListItem = component$((props: { children: any }) => (
  <li className="flex items-start gap-2">
    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-primary-500)]" />
    <span>{props.children}</span>
  </li>
))

const ReviewCard = component$(({ name, text, score }: ReviewCardProps) => (
  <div className="t-panel p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-[color:var(--color-text-strong)]">{name}</div>
      <div className="t-badge">{score} ★</div>
    </div>
    <div className="mt-2 text-sm text-[color:var(--color-text-muted)]">
      {text}
    </div>
  </div>
))

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

const formatDate = (iso: string) => {
  // Minimal formatting; swap with your date library if desired
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* -----------------------------
   Types
----------------------------- */

type Hotel = {
  id: string
  name: string
  city: string
  rating: number
  reviewCount: number
  nightlyFrom: number
  totalEstimate: number
  currency: string
  badges: { tone: BadgeTone; label: string }[]
  highlights: string[]
  images: { src: string; alt: string }[]
  rooms: Room[]
  policies: { title: string; body: string }[]
}

type Room = {
  id: string
  name: string
  sleeps: number
  bed: string
  refundable: boolean
  breakfast: boolean
  perks: string[]
  price: number
  left?: number
  image: { src: string; alt: string }
}

type BadgeTone = 'neutral' | 'positive' | 'deal'

type GalleryProps = {
  images: { src: string; alt: string }[]
}

type BookingCardProps = {
  nightlyFrom: number
  totalEstimate: number
  currency: string
  badges: { tone: BadgeTone; label: string }[]
}

type RoomCardProps = {
  room: Room
  currency: string
}

type BadgeProps = {
  tone: BadgeTone
  label: string
}

type AnchorPillProps = {
  href: string
  label: string
}

type FilterChipProps = {
  label: string
}

type InfoItemProps = {
  label: string
  value: string
}

type ReviewCardProps = {
  name: string
  text: string
  score: number
}

import type { DocumentHead } from '@builder.io/qwik-city'

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelPage)
  const h = data.hotel

  const title = `${h.name} – ${h.city} | Andacity Travel`
  const description = `Compare rooms, totals, and policies for ${h.name} in ${h.city}. Book confidently with transparent pricing.`

  const ogImage = new URL(`/og/hotel/${encodeURIComponent(h.id)}.png`, url.origin).href

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: h.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: h.city,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(h.rating),
      reviewCount: String(h.reviewCount),
    },
  }

  return {
    title,
    meta: [
      { name: 'description', content: description },

      { property: 'og:type', content: 'hotel' },
      { property: 'og:image', content: ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },

      // JSON-LD channel (RouterHead picks this up)
      { name: 'json-ld', content: JSON.stringify(jsonLd) },
    ],
  }
}
