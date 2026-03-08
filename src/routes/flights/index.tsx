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
  const depart = String(location.url.searchParams.get('depart') || '').trim()
  const ret = String(location.url.searchParams.get('return') || '').trim()
  const travelers = String(location.url.searchParams.get('travelers') || '').trim()
  const cabin = String(location.url.searchParams.get('cabin') || '').trim()

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Flights' },
      ]}
      eyebrow="Flights"
      title="Find smarter flights with flexible planning"
      description="Search routes, compare schedules, and plan around your dates and preferences with less friction."
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
          Compare routes, timing, and options faster so you can book with confidence.
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
