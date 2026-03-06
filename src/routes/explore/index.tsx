import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { HeroBackground } from '~/components/hero/HeroBackground'
import { Page } from '~/components/site/Page'

const VIBE_ITEMS = [
  { label: 'Beach escapes', href: '/explore#beach-escapes' },
  { label: 'Mountain getaways', href: '/explore#mountain-getaways' },
  { label: 'Weekend cities', href: '/explore#weekend-cities' },
  { label: 'Warm weather', href: '/explore#warm-weather' },
  { label: 'Luxury stays', href: '/explore#luxury-stays' },
  { label: 'Budget trips', href: '/explore#budget-trips' },
  { label: 'Family travel', href: '/explore#family-travel' },
  { label: 'Solo escapes', href: '/explore#solo-escapes' },
]

const FLEX_IDEAS = [
  {
    title: 'Warm places in March',
    description: 'Find sunny destinations when late-winter weather is still holding on at home.',
    href: '/explore#warm-places-in-march',
  },
  {
    title: 'Cheap long weekends',
    description: 'Compare short getaways with lower total trip cost and easy timing windows.',
    href: '/explore#cheap-long-weekends',
  },
  {
    title: 'Scenic coastal drives',
    description: 'Plan route-first escapes with beach towns, viewpoints, and flexible stops.',
    href: '/explore#scenic-coastal-drives',
  },
  {
    title: 'City breaks with easy flights',
    description: 'Prioritize destinations with frequent air service and low-friction arrivals.',
    href: '/explore#city-breaks',
  },
  {
    title: 'Beach trips with rental flexibility',
    description: 'Pair shoreline stays with pickup-friendly car options for more freedom.',
    href: '/explore#beach-rentals',
  },
  {
    title: 'Quick mountain escapes',
    description: 'Browse high-altitude weekend options with shorter planning lead times.',
    href: '/explore#mountain-escapes',
  },
]

const POPULAR_DESTINATIONS = [
  { name: 'Miami', href: '/destinations/miami', blurb: 'Beach-forward stays and nonstop routes' },
  { name: 'Las Vegas', href: '/hotels/in/las-vegas', blurb: 'High-availability stays and short city trips' },
  { name: 'San Diego', href: '/destinations/san-diego', blurb: 'Coastal neighborhoods and mild-weather planning' },
  { name: 'New York', href: '/hotels/in/new-york', blurb: 'Dense lodging options and quick city breaks' },
  { name: 'Denver', href: '/search/hotels/denver/1', blurb: 'Mountain access with strong weekend demand' },
  { name: 'Honolulu', href: '/search/hotels/honolulu/1', blurb: 'Island escapes with warm-weather demand' },
]

export default component$(() => {
  return (
    <Page
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Explore' },
      ]}
    >
      <section class="relative overflow-hidden rounded-[var(--radius-xl)]">
        <HeroBackground imageUrl="/images/hero/home.svg" overlay="strong">
          <div class="px-5 py-10 md:px-8 md:py-14 lg:px-10 lg:py-16">
            <div class="max-w-3xl">
              <p class="text-sm font-medium text-[color:var(--color-text-on-hero-muted)]">
                Explore
              </p>

              <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-on-hero)] md:text-5xl">
                Discover trips by mood, season, or budget
              </h1>

              <p class="mt-3 max-w-[68ch] text-sm leading-6 text-[color:var(--color-text-on-hero-muted)] md:text-base">
                Browse destinations, flexible ideas, and trip inspiration when you're not starting with a fixed plan.
              </p>
            </div>
          </div>
        </HeroBackground>
      </section>

      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Browse by vibe
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Start from how you want the trip to feel, then drill into destination and timing.
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VIBE_ITEMS.map((item) => (
            <a
              key={item.label}
              class="t-card block p-4 text-sm font-medium text-[color:var(--color-text-strong)] transition hover:-translate-y-px hover:bg-white"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Flexible trip ideas
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Use themed starters when your destination is still open.
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLEX_IDEAS.map((idea) => (
            <a
              key={idea.title}
              href={idea.href}
              class="t-card block h-full rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] p-5 transition hover:-translate-y-px hover:bg-white"
            >
              <h3 class="text-lg font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                {idea.title}
              </h3>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {idea.description}
              </p>
              <div class="mt-4 pt-1 text-sm font-medium text-[color:var(--color-action)]">
                Explore idea →
              </div>
            </a>
          ))}
        </div>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Popular destinations
            </h2>
            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Jump into places that pair well with flexible planning and multi-vertical booking.
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_DESTINATIONS.map((destination) => (
            <a key={destination.name} class="t-card block p-5 transition hover:bg-white" href={destination.href}>
              <div class="text-base font-semibold text-[color:var(--color-text-strong)]">
                {destination.name}
              </div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {destination.blurb}
              </div>
              <div class="mt-4 text-sm text-[color:var(--color-action)]">
                Explore destination →
              </div>
            </a>
          ))}
        </div>
      </section>
    </Page>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Explore | Andacity'
  const description =
    'Discover trips by mood, season, or budget with discovery-first destination ideas across flights, stays, and car rentals.'
  const canonicalHref = new URL('/explore', url.origin).href

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
  }
}
