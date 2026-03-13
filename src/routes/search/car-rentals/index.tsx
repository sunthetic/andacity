import type { RequestHandler } from '@builder.io/qwik-city'
import { resolveLocationFromUrlValues } from '~/lib/location/location-repo.server'

export const onGet: RequestHandler = async ({ redirect, url }) => {
  const pickupLocation = String(url.searchParams.get('q') || '').trim()
  const resolvedLocation = await resolveLocationFromUrlValues({
    locationId: url.searchParams.get('pickupLocationId'),
    text: pickupLocation,
  })
  const query = resolvedLocation?.searchSlug || pickupLocation || 'anywhere'
  const pickupDate = String(url.searchParams.get('pickupDate') || '').trim()
  const dropoffDate = String(url.searchParams.get('dropoffDate') || '').trim()
  const drivers = String(url.searchParams.get('drivers') || '').trim()

  const path = `/search/car-rentals/${encodeURIComponent(query)}/1`
  const nextParams = new URLSearchParams()

  if (pickupLocation) {
    nextParams.set('q', pickupLocation)
  }
  if (resolvedLocation?.locationId) {
    nextParams.set('pickupLocationId', resolvedLocation.locationId)
  }

  if (pickupDate) {
    nextParams.set('pickupDate', pickupDate)
  }

  if (dropoffDate) {
    nextParams.set('dropoffDate', dropoffDate)
  }

  if (drivers) {
    nextParams.set('drivers', drivers)
  }

  const queryString = nextParams.toString()
  const href = queryString ? `${path}?${queryString}` : path
  throw redirect(302, href)
}
