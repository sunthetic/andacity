import { component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import type { RequestHandler } from '@builder.io/qwik-city'
import { useLocation } from '@builder.io/qwik-city'
import { HotelSearchCard } from '~/components/hotels/search/HotelSearchCard'
import { VerticalHeroSearchLayout } from '~/components/search/VerticalHeroSearchLayout'
import { SearchEmptyState } from '~/components/search/SearchEmptyState'
import { loadHotelCitiesFromDb } from '~/lib/queries/hotels-pages.server'
import { resolveLocationFromUrlValues } from '~/lib/location/location-repo.server'
import {
  parseLocationSelection,
  validateLocationSelection,
} from '~/lib/location/validateLocationSelection'

export const useHotelsIndexPage = routeLoader$(async () => {
  const items = await loadHotelCitiesFromDb()
  return { items }
})

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const isSearchSubmit = String(url.searchParams.get('search') || '').trim() === '1'
  if (!isSearchSubmit) return

  const destination = validateLocationSelection({
    selection: url.searchParams.get('destinationLocation'),
    rawValue: url.searchParams.get('destination'),
    required: true,
    fieldLabel: 'destination',
    allowedKinds: ['city', 'airport'],
  })

  if (!destination.location) return

  const nextParams = new URLSearchParams()
  const checkIn = String(url.searchParams.get('checkIn') || '').trim()
  const checkOut = String(url.searchParams.get('checkOut') || '').trim()
  const guests = String(url.searchParams.get('guests') || '').trim()

  nextParams.set('destinationLocationId', destination.location.locationId)

  if (checkIn) nextParams.set('checkIn', checkIn)
  if (checkOut) nextParams.set('checkOut', checkOut)
  if (guests) nextParams.set('guests', guests)

  const path = `/search/hotels/${encodeURIComponent(destination.location.searchSlug)}/1`
  const query = nextParams.toString()
  throw redirect(302, query ? `${path}?${query}` : path)
}

export const useHotelsSearchState = routeLoader$(async ({ url }) => {
  const selection = parseLocationSelection(url.searchParams.get('destinationLocation'))
  const destinationLocation =
    selection ||
    (await resolveLocationFromUrlValues({
      locationId: url.searchParams.get('destinationLocationId'),
      text: url.searchParams.get('destination'),
    }))

  return {
    destinationLocation,
  }
})

export default component$(() => {
  const { items } = useHotelsIndexPage().value
  const { destinationLocation } = useHotelsSearchState().value
  const location = useLocation()
  const destination = String(location.url.searchParams.get('destination') || '').trim()
  const checkIn = String(location.url.searchParams.get('checkIn') || '').trim()
  const checkOut = String(location.url.searchParams.get('checkOut') || '').trim()
  const guests = String(location.url.searchParams.get('guests') || '').trim()

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Hotels' },
      ]}
      eyebrow="Hotels"
      title="Find stays that fit the trip, not just the city"
      description="Search hotels by destination, dates, and guests, or browse city hubs built for planning and discovery."
      heroImageUrl="/images/hero/hotels.svg"
      heroOverlay="base"
      searchCard={(
        <HotelSearchCard
          initialDestination={destinationLocation?.displayName || destination}
          initialDestinationLocation={destinationLocation}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      )}
      helperLinks={[
        { label: 'Miami', href: '/hotels/in/miami' },
        { label: 'New York', href: '/hotels/in/new-york' },
        { label: 'Las Vegas', href: '/hotels/in/las-vegas' },
      ]}
    >
      <section class="mx-auto max-w-4xl">
        <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Plan stays with less friction
        </h2>

        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
          Combine destination-first search with city-based discovery for a cleaner way to book accommodations.
        </p>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Browse hotel cities
            </h2>

            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              Indexable city pages that support discovery, planning, and internal linking across the Hotels vertical.
            </p>
          </div>

          <a class="t-btn-primary px-5 text-center" href="/search/hotels/anywhere/1">
            Search hotels
          </a>
        </div>

        {items.length ? (
          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((city) => (
              <a
                key={city.slug}
                href={`/hotels/in/${city.slug}`}
                class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
              >
                <div class="text-base font-medium text-[color:var(--color-text-strong)]">
                  {city.city}
                </div>

                <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  Browse hotels in {city.city}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-6">
            <SearchEmptyState
              title="No hotel cities are available right now"
              description="Try searching hotels directly while city pages are refreshed."
              primaryAction={{ label: 'Search hotels again', href: '/hotels' }}
              secondaryAction={{ label: 'Browse hotel cities', href: '/hotels/in' }}
            />
          </div>
        )}
      </section>
    </VerticalHeroSearchLayout>
  )
})

export const head: DocumentHead = {
  title: 'Hotels | Andacity',
  meta: [
    {
      name: 'description',
      content: 'Search hotels by destination, dates, and guests, or browse Andacity city pages for hotel discovery.',
    },
  ],
}
