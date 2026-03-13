import { normalizeDatePart } from '~/lib/inventory/inventory-id'
import type { SearchParams } from '~/types/search'
import type { FlightItineraryType } from '~/types/flights/provider'
import { findTopTravelCity } from '~/seed/cities/top-100.js'
import type { CanonicalLocation } from '~/types/location'

export type FlightProviderSearchRequest = {
  originIata: string
  destinationIata: string
  departDate: string | null
  returnDate: string | null
  passengers: number
  itineraryType: FlightItineraryType
}

export class FlightSearchParamsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FlightSearchParamsError'
  }
}

const AIRPORT_CODE_PATTERN = /^[A-Z]{3}$/

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const clampPassengers = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.min(12, Math.round(parsed)))
}

const resolveExplicitAirportCode = (value: string) => {
  const directCode = value.toUpperCase()
  if (AIRPORT_CODE_PATTERN.test(directCode)) return directCode

  const embeddedCode = /\(([A-Za-z]{3})\)/.exec(value)
  if (!embeddedCode) return null

  return embeddedCode[1].toUpperCase()
}

const resolveAirportCodeFromLocation = (location: CanonicalLocation | null | undefined) => {
  if (!location) return null
  if (location.airportCode) return location.airportCode.toUpperCase()
  if (location.primaryAirportCode) return location.primaryAirportCode.toUpperCase()
  return null
}

const resolveAirportCode = (
  value: unknown,
  location: CanonicalLocation | null | undefined,
  fieldName: string,
) => {
  const canonicalCode = resolveAirportCodeFromLocation(location)
  if (canonicalCode && AIRPORT_CODE_PATTERN.test(canonicalCode)) {
    return canonicalCode
  }

  const text = toNullableText(value)
  if (!text) {
    throw new FlightSearchParamsError(`${fieldName} is required for flight provider search.`)
  }

  const explicitCode = resolveExplicitAirportCode(text)
  if (explicitCode) return explicitCode

  const city = findTopTravelCity(text)
  const airportCode = Array.isArray(city?.airportCodes) ? city.airportCodes[0] : null
  if (airportCode && AIRPORT_CODE_PATTERN.test(String(airportCode).toUpperCase())) {
    return String(airportCode).toUpperCase()
  }

  throw new FlightSearchParamsError(
    `${fieldName} "${text}" could not be mapped to a supported airport code.`,
  )
}

const resolveDate = (value: unknown, fieldName: string) => {
  const text = toNullableText(value)
  if (!text) return null

  try {
    return normalizeDatePart(text, fieldName)
  } catch {
    throw new FlightSearchParamsError(`${fieldName} must be a valid ISO date.`)
  }
}

export const mapFlightSearchParams = (
  params: SearchParams,
): FlightProviderSearchRequest => {
  if (params.vertical !== 'flight') {
    throw new FlightSearchParamsError(
      `Flight provider cannot search the "${params.vertical}" vertical.`,
    )
  }

  const originIata = resolveAirportCode(
    params.origin,
    params.originLocation,
    'origin',
  )
  const destinationIata = resolveAirportCode(
    params.destination,
    params.destinationLocation,
    'destination',
  )
  if (originIata === destinationIata) {
    throw new FlightSearchParamsError('Flight provider search requires different origin and destination airports.')
  }

  const departDate = resolveDate(params.departDate, 'departDate')
  const returnDate = resolveDate(params.returnDate, 'returnDate')
  if (returnDate && !departDate) {
    throw new FlightSearchParamsError(
      'Flight provider search does not support returnDate without departDate.',
    )
  }

  return {
    originIata,
    destinationIata,
    departDate,
    returnDate,
    passengers: clampPassengers(params.passengers),
    itineraryType: returnDate ? 'round-trip' : 'one-way',
  }
}
