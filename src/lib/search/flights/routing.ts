export type FlightItineraryTypeSlug = 'round-trip' | 'one-way'

export const DEFAULT_FLIGHT_ITINERARY_TYPE: FlightItineraryTypeSlug = 'round-trip'

export const isFlightItineraryTypeSlug = (value: string | null | undefined): value is FlightItineraryTypeSlug => {
  return value === 'round-trip' || value === 'one-way'
}

export const normalizeFlightItineraryType = (value: string | null | undefined): FlightItineraryTypeSlug => {
  return isFlightItineraryTypeSlug(value) ? value : DEFAULT_FLIGHT_ITINERARY_TYPE
}

export const slugifyLocation = (value: string) => {
  return String(value || '')
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

export const humanizeLocationSlug = (slug: string) => {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export const buildFlightsSearchPath = (
  fromLocationSlug: string,
  toLocationSlug: string,
  itineraryTypeSlug: FlightItineraryTypeSlug,
  pageNumber = 1,
) => {
  return `/search/flights/from/${encodeURIComponent(fromLocationSlug)}/to/${encodeURIComponent(toLocationSlug)}/${itineraryTypeSlug}/${pageNumber}`
}

