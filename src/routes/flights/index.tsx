import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { VerticalHeroSearchLayout } from '~/components/search/VerticalHeroSearchLayout'
import { FlightsSearchCard } from '~/components/flights/search/FlightsSearchCard'
import { normalizeFlightItineraryType } from '~/lib/search/flights/routing'

export default component$(() => {
  const location = useLocation()

  const itineraryType = normalizeFlightItineraryType(String(location.url.searchParams.get('itineraryType') || '').trim())
  const from = String(location.url.searchParams.get('from') || '').trim()
  const to = String(location.url.searchParams.get('to') || '').trim()
  const depart = ''
  const ret = ''
  const travelers = String(location.url.searchParams.get('travelers') || '').trim()
  const cabin = String(location.url.searchParams.get('cabin') || '').trim()

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Flights' },
      ]}
      eyebrow="Flights"
      title="Search smarter flights with flexible planning"
      description="Find flights by route, dates, and traveler preferences, or explore flexible destinations for your next trip."
      heroImageUrl="/images/hero/flights.svg"
      heroOverlay="base"
      searchCard={(
        <FlightsSearchCard
          initialItineraryType={itineraryType}
          initialFrom={from}
          initialTo={to}
          initialDepart={depart}
          initialReturn={ret}
          initialTravelers={travelers}
          initialCabin={cabin}
        />
      )}
    >
      <section class="mx-auto max-w-4xl">
        <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Plan air travel with clarity
        </h2>

        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
          Andacity combines clean route search with flexible planning tools, making it easier to compare options and book confidently.
        </p>
      </section>
    </VerticalHeroSearchLayout>
  )
})

export const head: DocumentHead = {
  title: 'Flights | Andacity',
  meta: [
    {
      name: 'description',
      content: 'Search flights by route, dates, and traveler preferences with Andacity.',
    },
  ],
}
