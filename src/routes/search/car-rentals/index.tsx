import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ redirect, url }) => {
  const pickupLocation = String(url.searchParams.get('q') || '').trim()
  const query = pickupLocation || 'anywhere'
  const pickupDate = String(url.searchParams.get('pickupDate') || '').trim()
  const dropoffDate = String(url.searchParams.get('dropoffDate') || '').trim()
  const drivers = String(url.searchParams.get('drivers') || '').trim()

  const path = `/search/car-rentals/${encodeURIComponent(query)}/1`
  const nextParams = new URLSearchParams()

  if (pickupLocation) {
    nextParams.set('q', pickupLocation)
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
