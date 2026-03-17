import type { CanonicalLocation } from '~/types/location'
import {
  buildFlightsSearchPath,
  normalizeFlightItineraryType,
  type FlightItineraryTypeSlug,
} from '~/lib/search/flights/routing'

const appendSearchParam = (
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) => {
  const text = String(value || '').trim()
  if (text) {
    params.set(key, text)
  }
}

const withSearchParams = (path: string, params: URLSearchParams) => {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export type CanonicalFlightSearchHrefInput = {
  fromLocation: CanonicalLocation
  toLocation: CanonicalLocation
  itineraryType: FlightItineraryTypeSlug
  departDate: string
  returnDate?: string | null
  travelers?: string | null
  cabin?: string | null
  pageNumber?: number
}

export const buildCanonicalFlightSearchHref = (
  input: CanonicalFlightSearchHrefInput,
) => {
  const itineraryType = normalizeFlightItineraryType(input.itineraryType)
  const params = new URLSearchParams()

  params.set('fromLocationId', input.fromLocation.locationId)
  params.set('toLocationId', input.toLocation.locationId)
  appendSearchParam(params, 'depart', input.departDate)
  appendSearchParam(
    params,
    'return',
    itineraryType === 'round-trip' ? input.returnDate : undefined,
  )
  appendSearchParam(params, 'travelers', input.travelers)
  appendSearchParam(params, 'cabin', input.cabin)

  return withSearchParams(
    buildFlightsSearchPath(
      input.fromLocation.searchSlug,
      input.toLocation.searchSlug,
      itineraryType,
      input.pageNumber || 1,
    ),
    params,
  )
}

export type CanonicalHotelSearchHrefInput = {
  destinationLocation: CanonicalLocation
  checkIn: string
  checkOut: string
  guests?: string | null
  pageNumber?: number
}

export const buildCanonicalHotelSearchHref = (
  input: CanonicalHotelSearchHrefInput,
) => {
  const params = new URLSearchParams()

  params.set('destinationLocationId', input.destinationLocation.locationId)
  appendSearchParam(params, 'checkIn', input.checkIn)
  appendSearchParam(params, 'checkOut', input.checkOut)
  appendSearchParam(params, 'guests', input.guests)

  return withSearchParams(
    `/search/hotels/${encodeURIComponent(input.destinationLocation.searchSlug)}/${input.pageNumber || 1}`,
    params,
  )
}

export type CanonicalCarSearchHrefInput = {
  pickupLocation: CanonicalLocation
  pickupDate: string
  dropoffDate: string
  drivers?: string | null
  pageNumber?: number
}

export const buildCanonicalCarSearchHref = (
  input: CanonicalCarSearchHrefInput,
) => {
  const params = new URLSearchParams()

  params.set('pickupLocationId', input.pickupLocation.locationId)
  appendSearchParam(params, 'pickupDate', input.pickupDate)
  appendSearchParam(params, 'dropoffDate', input.dropoffDate)
  appendSearchParam(params, 'drivers', input.drivers)

  return withSearchParams(
    `/search/car-rentals/${encodeURIComponent(input.pickupLocation.searchSlug)}/${input.pageNumber || 1}`,
    params,
  )
}
