import type { RequestHandler } from '@builder.io/qwik-city'
import { buildFlightsSearchPath, normalizeFlightItineraryType, slugifyLocation } from '~/lib/search/flights/routing'

export const onGet: RequestHandler = async ({ params, url, redirect }) => {
  const from = String(url.searchParams.get('from') || '').trim()
  const to = String(url.searchParams.get('to') || '').trim()
  const fromLocationSlug = slugifyLocation(from)
  const toLocationSlug = slugifyLocation(to)
  if (fromLocationSlug && toLocationSlug) {
    const itineraryType = normalizeFlightItineraryType(url.searchParams.get('itineraryType'))
    const path = buildFlightsSearchPath(fromLocationSlug, toLocationSlug, itineraryType, 1)
    const query = new URLSearchParams(url.searchParams)
    query.delete('from')
    query.delete('to')
    query.delete('itineraryType')
    if (itineraryType === 'one-way') {
      query.delete('return')
    }

    const queryString = query.toString()
    throw redirect(302, queryString ? `${path}?${queryString}` : path)
  }

  const { query } = params
  throw redirect(302, `/search/flights/${query}/1`)
}
