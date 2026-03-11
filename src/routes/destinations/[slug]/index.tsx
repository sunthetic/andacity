import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { DESTINATIONS_BY_SLUG } from '~/data/destinations'
import { loadTopDestinationStaysFromDb } from '~/lib/queries/hotels-pages.server'

export const useDestinationPage = routeLoader$(async ({ params, error }) => {
  const slug = String(params.slug || '').toLowerCase().trim()
  if (!slug) throw error(404, 'Not found')

  const destination = DESTINATIONS_BY_SLUG[slug]
  if (!destination) throw error(404, 'Not found')

  const topStays: HotelCard[] = await loadTopDestinationStaysFromDb(destination.slug, 4)

  return {
    slug,
    destination,
    topStays,
    faq: destination.faq,
  }
})

export default component$(() => {
  const data = useDestinationPage().value
  const d = data.destination

  const searchPath = (q: string, page: number) =>
    `/search/destinations/${encodeURIComponent(q)}/${page}`

  return (
    <Page>
      <>
        <div class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <a class="hover:text-[color:var(--color-text)]" href="/">
                Andacity Travel
              </a>
              <span class="text-[color:var(--color-text-subtle)]">/</span>
              <a class="hover:text-[color:var(--color-text)]" href="/destinations">
                Destinations
              </a>
              <span class="text-[color:var(--color-text-subtle)]">/</span>
              <span class="text-[color:var(--color-text)]">{d.name}</span>
            </div>

            <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
              Hotels in {d.name}
            </h1>

            <p class="mt-2 max-w-[64ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Compare stays across {d.name}. Transparent totals, clean policies, and fast filtering that
              doesn’t hide fees.
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="t-badge">From {formatMoney(d.priceFrom, 'USD')}/night</span>
              <span class="t-badge">{d.bestFor.join(' · ')}</span>
              <span class="t-badge">{d.airportCode} airport</span>
            </div>
          </div>

          <div
            class="lg:sticky lg:self-start"
            style={{ top: "var(--sticky-top-offset)" }}
          >
            <div class="t-card p-5">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Search hotels in {d.name}
              </div>

              <div class="mt-3 grid gap-2">
                <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                  Destination
                </label>
                <input
                  class="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                  value={d.query}
                  readOnly
                />

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                      Check-in
                    </label>
                    <input
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                      Check-out
                    </label>
                    <input
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                      Guests
                    </label>
                    <input
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                      Rooms
                    </label>
                    <input
                      class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-text)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                      placeholder="1"
                    />
                  </div>
                </div>

                <a class="t-btn-primary mt-2 text-center" href={searchPath(d.query, 1)}>
                  See hotels
                </a>

                <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  Search pages are not indexed. This destination page is.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="mt-8">
          <div class="flex items-end justify-between gap-3">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Top stays in {d.name}
            </h2>
            <a class="text-sm text-[color:var(--color-action)] hover:underline" href={searchPath(d.query, 1)}>
              View all
            </a>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.topStays.map((h) => (
              <HotelMiniCard key={h.id} hotel={h} />
            ))}
          </div>
        </section>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section class="t-card p-5">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Map
            </h2>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Keep the map compact. It supports decision-making, but shouldn’t steal conversion.
            </p>
            <div class="mt-4 h-56 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" />
          </section>

          <section class="t-card p-5">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Best areas to stay
            </h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              {d.neighborhoods.map((n) => (
                <div key={n.slug} class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {n.name}
                  </div>
                  <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    {n.blurb}
                  </div>
                  <div class="mt-3">
                    <a
                      class="text-sm text-[color:var(--color-action)] hover:underline"
                      href={searchPath(`${d.query} ${n.name}`, 1)}
                    >
                      Search hotels in {n.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section class="mt-8 t-card p-5" id="faq">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
            FAQ
          </h2>

          <div class="mt-4 space-y-3">
            {data.faq.map((qa) => (
              <div key={qa.q} class="t-panel p-4">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {qa.q}
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {qa.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section class="mt-8 t-card p-5">
          <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
            Guide to {d.name}
          </h2>

          <div class="prose prose-sm mt-3 max-w-none text-[color:var(--color-text)]">
            <p class="text-[color:var(--color-text-muted)]">
              This is where you earn long-tail rankings: best time to visit, where to stay, what to expect,
              and practical planning details. Keep paragraphs short and information-dense.
            </p>

            <ul class="text-[color:var(--color-text-muted)]">
              <li>Best for: {d.bestFor.join(', ')}</li>
              <li>Airport: {d.airportCode}</li>
              <li>Typical nightly range: {formatMoney(d.priceFrom, 'USD')}+ (varies by season)</li>
            </ul>
          </div>
        </section>

      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              From {formatMoney(d.priceFrom, 'USD')}
              <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              Search {d.name} hotels
            </div>
          </div>
          <a class="t-btn-primary px-5" href={searchPath(d.query, 1)}>
            See hotels
          </a>
        </div>
        </div>
        </>
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useDestinationPage)
  const d = data.destination

  const title = `Hotels in ${d.name} | Andacity Travel`
  const description = `Compare hotels in ${d.name}. Explore top areas to stay, transparent totals, and policies. From ${formatMoney(d.priceFrom, 'USD')}/night.`

  const canonicalHref = new URL(`/destinations/${encodeURIComponent(data.slug)}`, url.origin).href
  const ogImage = new URL(`/og/destination/${encodeURIComponent(data.slug)}.png`, url.origin).href

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
            name: d.name,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'TouristDestination',
        name: d.name,
        description,
      },
      {
        '@type': 'FAQPage',
        mainEntity: d.faq.map((qa) => ({
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

      { name: 'json-ld', content: jsonLd },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}

const HotelMiniCard = component$(({ hotel }: HotelMiniCardProps) => (
  <a class="t-panel block overflow-hidden hover:bg-white" href={`/hotels/${encodeURIComponent(hotel.slug)}`}>
    <div class="bg-[color:var(--color-neutral-50)]">
      <img
        class="h-36 w-full object-cover"
        src={hotel.image}
        alt={hotel.name}
        loading="lazy"
        width={640}
        height={288}
      />
    </div>
    <div class="p-4">
      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
        {hotel.name}
      </div>
      <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
        {hotel.area} · {hotel.rating.toFixed(1)} ★ ({hotel.reviewCount.toLocaleString('en-US')})
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        {hotel.badges.slice(0, 2).map((b) => (
          <span key={b} class="t-badge">{b}</span>
        ))}
      </div>

      <div class="mt-3 text-sm font-semibold text-[color:var(--color-text-strong)]">
        From {formatMoney(hotel.from, hotel.currency)}
        <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
      </div>
    </div>
  </a>
))

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

type HotelCard = {
  id: string
  slug: string
  name: string
  area: string
  rating: number
  reviewCount: number
  from: number
  currency: string
  image: string
  badges: string[]
}

type HotelMiniCardProps = {
  hotel: HotelCard
}
