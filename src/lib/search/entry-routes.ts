import type { CanonicalLocation } from '~/types/location'
import {
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

const toText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || null
}

const resolveFlightRouteCode = (location: CanonicalLocation) =>
  toText(location.airportCode || location.primaryAirportCode || location.searchSlug)?.toUpperCase() ||
  'ANY'

const resolveHotelRouteSlug = (location: CanonicalLocation) => {
  const citySlug = toText(location.citySlug)
  if (citySlug) return citySlug

  const airportCitySlug = String(location.searchSlug || '')
    .split('--')[0]
    ?.trim()
  return airportCitySlug || location.searchSlug
}

const resolveCarRouteCode = (location: CanonicalLocation) =>
  toText(location.airportCode || location.primaryAirportCode || location.searchSlug)?.toUpperCase() ||
  'ANY'

export const buildCanonicalFlightSearchPath = (input: {
  fromLocation: CanonicalLocation
  toLocation: CanonicalLocation
  departDate: string
  returnDate?: string | null
  itineraryType?: FlightItineraryTypeSlug | null
}) => {
  const itineraryType = normalizeFlightItineraryType(input.itineraryType)
  const fromCode = encodeURIComponent(resolveFlightRouteCode(input.fromLocation))
  const toCode = encodeURIComponent(resolveFlightRouteCode(input.toLocation))
  const departDate = encodeURIComponent(input.departDate)

  if (itineraryType === 'round-trip' && toText(input.returnDate)) {
    return `/flights/search/${fromCode}-${toCode}/${departDate}/return/${encodeURIComponent(String(input.returnDate).trim())}`
  }

  return `/flights/search/${fromCode}-${toCode}/${departDate}`
}

export const buildCanonicalHotelSearchPath = (input: {
  destinationLocation: CanonicalLocation
  checkIn: string
  checkOut: string
}) =>
  `/hotels/search/${encodeURIComponent(resolveHotelRouteSlug(input.destinationLocation))}/${encodeURIComponent(input.checkIn)}/${encodeURIComponent(input.checkOut)}`

export const buildCanonicalCarSearchPath = (input: {
  pickupLocation: CanonicalLocation
  pickupDate: string
  dropoffDate: string
}) =>
  `/car-rentals/search/${encodeURIComponent(resolveCarRouteCode(input.pickupLocation))}/${encodeURIComponent(input.pickupDate)}/${encodeURIComponent(input.dropoffDate)}`

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

  params.set('itineraryType', itineraryType)
  params.set('fromLocationId', input.fromLocation.locationId)
  params.set('toLocationId', input.toLocation.locationId)
  appendSearchParam(params, 'from', input.fromLocation.displayName)
  appendSearchParam(params, 'to', input.toLocation.displayName)
  appendSearchParam(params, 'depart', input.departDate)
  appendSearchParam(
    params,
    'return',
    itineraryType === 'round-trip' ? input.returnDate : undefined,
  )
  appendSearchParam(params, 'travelers', input.travelers)
  appendSearchParam(params, 'cabin', input.cabin)

  return withSearchParams(
    buildCanonicalFlightSearchPath({
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      departDate: input.departDate,
      returnDate: input.returnDate,
      itineraryType,
    }),
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
  appendSearchParam(params, 'destination', input.destinationLocation.displayName)
  appendSearchParam(params, 'checkIn', input.checkIn)
  appendSearchParam(params, 'checkOut', input.checkOut)
  appendSearchParam(params, 'guests', input.guests)

  return withSearchParams(
    buildCanonicalHotelSearchPath({
      destinationLocation: input.destinationLocation,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    }),
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
  appendSearchParam(params, 'q', input.pickupLocation.displayName)
  appendSearchParam(params, 'pickupDate', input.pickupDate)
  appendSearchParam(params, 'dropoffDate', input.dropoffDate)
  appendSearchParam(params, 'drivers', input.drivers)

  return withSearchParams(
    buildCanonicalCarSearchPath({
      pickupLocation: input.pickupLocation,
      pickupDate: input.pickupDate,
      dropoffDate: input.dropoffDate,
    }),
    params,
  )
}
