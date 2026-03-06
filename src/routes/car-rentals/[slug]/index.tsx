import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { Page } from '~/components/site/Page'
import { getCarRentalBySlug } from '~/data/car-rentals'
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs'

export const useCarRental = routeLoader$(({ params, error }) => {
  const rental = getCarRentalBySlug(params.slug)

  if (!rental) throw error(404, 'Not found')

  return rental
})

export default component$(() => {
  const rental = useCarRental().value

  const heroImg = rental.images[0] || '/img/demo/car-1.jpg'
  const priceFrom = Math.min(...rental.offers.map((o) => o.priceFrom))

  return (
    <Page>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Car Rentals', href: '/car-rentals' },
          { label: rental.city, href: `/car-rentals/in/${encodeURIComponent(rental.cityQuery)}` },
          { label: rental.name },
        ]}
      />

      <div class="flex flex-col gap-6">
        {/* Header */}
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div class="min-w-0">
            <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {rental.name}
            </h1>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span class="t-badge">
                {rental.rating.toFixed(1)} ★{' '}
                <span class="text-[color:var(--color-text-muted)]">
                  ({rental.reviewCount.toLocaleString('en-US')})
                </span>
              </span>

              <span class="text-[color:var(--color-text-muted)]">•</span>

              <span class="text-[color:var(--color-text-muted)]">
                {rental.city}, {rental.region}
              </span>

              <span class="text-[color:var(--color-text-muted)]">•</span>

              <span class="text-[color:var(--color-text-muted)]">{rental.pickupArea}</span>
            </div>

            <p class="mt-4 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              {rental.summary}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <a class="t-btn-primary px-4 text-center" href={buildSearchHref(rental.cityQuery, 1)}>
                Search in {rental.city}
              </a>
              <a class="t-btn-primary px-4 text-center" href={buildCityHref(rental.cityQuery)}>
                Car rentals in {rental.city}
              </a>
            </div>
          </div>

          <div class="lg:sticky lg:top-24">
            <div class="t-card p-5 bg-primary-surface">
              <div class="text-xs text-[color:var(--color-text-muted)]">From</div>
              <div class="mt-1 text-2xl font-semibold text-[color:var(--color-text-strong)]">
                {formatMoney(priceFrom, rental.currency)}
                <span class="ml-1 text-base font-normal text-[color:var(--color-text-muted)]">/day</span>
              </div>

              <div class="mt-4 grid gap-2 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[color:var(--color-text-muted)]">Free cancellation</span>
                  <span class="text-[color:var(--color-text-strong)]">
                    {rental.policies.freeCancellation ? 'Often' : 'Varies'}
                  </span>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-[color:var(--color-text-muted)]">Payment</span>
                  <span class="text-[color:var(--color-text-strong)]">
                    {rental.policies.payAtCounter ? 'Pay at counter' : 'Prepay'}
                  </span>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-[color:var(--color-text-muted)]">Minimum age</span>
                  <span class="text-[color:var(--color-text-strong)]">{rental.policies.minDriverAge}+</span>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-[color:var(--color-text-muted)]">Fuel policy</span>
                  <span class="text-[color:var(--color-text-strong)]">{rental.policies.fuelPolicy}</span>
                </div>
              </div>

              <div class="mt-4 text-xs text-[color:var(--color-text-muted)]">
                Estimates shown early; exact totals confirmed at checkout.
              </div>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div class="t-card overflow-hidden">
          <div class="bg-[color:var(--color-neutral-50)]">
            <img
              class="h-[260px] w-full object-cover sm:h-[320px] lg:h-[360px]"
              src={heroImg}
              alt={rental.name}
              loading="eager"
              width={1280}
              height={720}
            />
          </div>
        </div>

        {/* Inclusions + Pickup */}
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">What’s included</div>

            <div class="mt-3 flex flex-wrap gap-2">
              {rental.inclusions.map((x) => (
                <span key={x} class="t-badge">
                  {x}
                </span>
              ))}
            </div>

            <div class="mt-5 grid gap-2 text-sm">
              <div class="text-[color:var(--color-text-muted)]">Pickup location</div>
              <div class="text-[color:var(--color-text-strong)]">
                {rental.pickupArea}{' '}
                <span class="text-[color:var(--color-text-muted)]">·</span> {rental.pickupAddressLine}
              </div>
            </div>
          </div>

          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Policy highlights</div>

            <div class="mt-3 grid gap-2 text-sm">
              <div>
                <div class="text-[color:var(--color-text-muted)]">Cancellation</div>
                <div class="mt-1 text-[color:var(--color-text)]">{rental.policies.cancellationBlurb}</div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Payment</div>
                <div class="mt-1 text-[color:var(--color-text)]">{rental.policies.paymentBlurb}</div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Fees</div>
                <div class="mt-1 text-[color:var(--color-text)]">{rental.policies.feesBlurb}</div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Deposit</div>
                <div class="mt-1 text-[color:var(--color-text)]">{rental.policies.depositBlurb}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div class="t-card p-5">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Available cars</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Choose an offer. Policies may vary per offer.
              </div>
            </div>

            <a class="t-btn-primary px-4 text-center" href={buildSearchHref(rental.cityQuery, 1)}>
              See more results
            </a>
          </div>

          <div class="mt-5 grid gap-3 lg:grid-cols-2">
            {rental.offers.map((o) => (
              <div key={o.id} class="t-card p-5 hover:bg-white">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{o.name}</div>
                    <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                      {o.category} · {o.transmission} · {o.doors} doors · {o.seats} seats · {o.bags}
                      {o.ac ? ' · A/C' : ''}
                    </div>
                  </div>

                  <div class="shrink-0 text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {formatMoney(o.priceFrom, rental.currency)}
                    <span class="ml-1 text-[color:var(--color-text-muted)]">/day</span>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  {o.badges.map((b) => (
                    <span key={b} class={b.toLowerCase() === 'premium' ? 't-badge t-badge--deal' : 't-badge'}>
                      {b}
                    </span>
                  ))}

                  {o.freeCancellation ? (
                    <span class="t-badge t-badge--deal">Free cancellation</span>
                  ) : (
                    <span class="t-badge">Cancellation varies</span>
                  )}

                  {o.payAtCounter ? (
                    <span class="t-badge t-badge--deal">Pay at counter</span>
                  ) : (
                    <span class="t-badge">Prepay</span>
                  )}
                </div>

                <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                  Key features:{' '}
                  <span class="text-[color:var(--color-text)]">{o.features.slice(0, 4).join(' · ')}</span>
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <a class="t-btn-primary px-4 text-center" href={buildSearchHref(rental.cityQuery, 1)}>
                    Check availability
                  </a>
                  <a class="t-btn-primary px-4 text-center" href={buildCarRentalsHref()}>
                    Back to car rentals
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div class="t-card p-5">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">FAQ</div>

          <div class="mt-4 grid gap-3">
            {rental.faq.map((x) => (
              <div key={x.q} class="t-card p-5">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{x.q}</div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">{x.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, params, url }) => {
  const rental = resolveValue(useCarRental)

  const title = `${rental.name} | Car Rentals | Andacity Travel`
  const description = rental.summary

  const canonicalHref = new URL(buildCarRentalDetailHref(params.slug), url.origin).href

  const priceFrom = rental.offers.length ? Math.min(...rental.offers.map((o) => o.priceFrom)) : rental.fromDaily

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
            name: rental.name,
            item: canonicalHref,
          },
        ],
      },
      {
        '@type': 'Product',
        name: rental.name,
        description: rental.summary,
        image: rental.images.map((src) => new URL(src, url.origin).href),
        brand: { '@type': 'Brand', name: 'Andacity' },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rental.rating,
          reviewCount: rental.reviewCount,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: rental.currency,
          price: priceFrom,
          availability: 'https://schema.org/InStock',
          url: canonicalHref,
        },
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
        key: 'ld-car-rental-detail',
        props: { type: 'application/ld+json' },
        script: jsonLd,
      },
    ],
  }
}

const buildCarRentalsHref = () => {
  return '/car-rentals'
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
