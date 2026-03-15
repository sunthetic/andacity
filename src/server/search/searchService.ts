import { mapCarSearchParams, CarSearchParamsError } from '~/lib/providers/car/mapCarSearchParams'
import { mapFlightSearchParams, FlightSearchParamsError } from '~/lib/providers/flight/mapFlightSearchParams'
import { mapHotelSearchParams, HotelSearchParamsError } from '~/lib/providers/hotel/mapHotelSearchParams'
import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import { getProvider } from '~/lib/providers/providerRegistry'
import {
  getCachedResults,
  getSearchCacheKey,
  setCachedResults,
  type SearchCacheParams,
} from '~/lib/search/search-cache'
import { resolveLocationBySearchSlug } from '~/lib/location/location-repo.server'
import type {
  NormalizedSearchResults,
  SearchParams,
  SearchRequest,
  SearchRequestError,
  SearchRequestErrorCode,
} from '~/types/search'
import type { CanonicalLocation } from '~/types/location'

type SearchServiceDependencies = {
  getProvider?: (type: SearchRequest['type']) => ProviderAdapter | null
  resolveLocationBySearchSlug?: (searchSlug: string) => Promise<CanonicalLocation | null>
  getCachedResults?: typeof getCachedResults
  setCachedResults?: typeof setCachedResults
}

type FlightProviderRequest = ReturnType<typeof mapFlightSearchParams>
type HotelProviderRequest = ReturnType<typeof mapHotelSearchParams>
type CarProviderRequest = ReturnType<typeof mapCarSearchParams>

const defaultDependencies: Required<SearchServiceDependencies> = {
  getProvider,
  resolveLocationBySearchSlug,
  getCachedResults,
  setCachedResults,
}

const toSearchParams = async (
  request: SearchRequest,
  dependencies: Required<SearchServiceDependencies>,
): Promise<SearchParams> => {
  if (request.type === 'flight') {
    const [originLocation, destinationLocation] = await Promise.all([
      request.origin ? dependencies.resolveLocationBySearchSlug(request.origin) : Promise.resolve(null),
      request.destination
        ? dependencies.resolveLocationBySearchSlug(request.destination)
        : Promise.resolve(null),
    ])

    return {
      vertical: 'flight',
      origin: request.origin,
      destination: request.destination,
      departDate: request.departDate,
      returnDate: request.returnDate,
      originLocation,
      destinationLocation,
      passengers: 1,
    }
  }

  if (request.type === 'hotel') {
    const destinationLocation = request.city
      ? await dependencies.resolveLocationBySearchSlug(request.city)
      : null

    return {
      vertical: 'hotel',
      destination: request.city,
      destinationLocation,
      checkInDate: request.checkIn,
      checkOutDate: request.checkOut,
      occupancy: 2,
      rooms: 1,
    }
  }

  const airportLocation = request.airport
    ? await dependencies.resolveLocationBySearchSlug(request.airport)
    : null
  const pickupDate = request.pickupDate
  const dropoffDate = request.dropoffDate

  return {
    vertical: 'car',
    pickupLocation: request.airport,
    dropoffLocation: request.airport,
    pickupLocationData: airportLocation,
    dropoffLocationData: airportLocation,
    pickupDate,
    dropoffDate,
    departDate: pickupDate,
    returnDate: dropoffDate,
  }
}

const getErrorCodeFromValidationMessage = (message: string): SearchRequestErrorCode => {
  if (message.includes('date') || message.includes('Date')) {
    return 'INVALID_DATE'
  }

  if (message.includes('could not be mapped')) {
    return 'LOCATION_NOT_FOUND'
  }

  return 'INVALID_LOCATION_CODE'
}

const toExecutionError = (error: unknown) => {
  if (
    error instanceof FlightSearchParamsError ||
    error instanceof HotelSearchParamsError ||
    error instanceof CarSearchParamsError
  ) {
    const code = getErrorCodeFromValidationMessage(error.message)
    const status = code === 'LOCATION_NOT_FOUND' ? 404 : 400
    return new SearchExecutionError(code, error.message, { status })
  }

  return error
}

const validateAndMapRequest = (
  params: SearchParams,
): FlightProviderRequest | HotelProviderRequest | CarProviderRequest => {
  try {
    if (params.vertical === 'flight') {
      return mapFlightSearchParams(params)
    }

    if (params.vertical === 'hotel') {
      return mapHotelSearchParams(params)
    }

    return mapCarSearchParams(params)
  } catch (error) {
    throw toExecutionError(error)
  }
}

const buildCacheParams = (
  request: SearchRequest,
  providerRequest: FlightProviderRequest | HotelProviderRequest | CarProviderRequest,
): SearchCacheParams => {
  if (request.type === 'flight') {
    const flightRequest = providerRequest as FlightProviderRequest
    return {
      origin: flightRequest.originIata,
      destination: flightRequest.destinationIata,
      departDate: flightRequest.departDate,
      returnDate: flightRequest.returnDate,
      itineraryType: flightRequest.itineraryType,
      passengers: flightRequest.passengers,
    }
  }

  if (request.type === 'hotel') {
    const hotelRequest = providerRequest as HotelProviderRequest
    return {
      citySlug: request.city || hotelRequest.citySlug,
      checkIn: hotelRequest.checkInDate,
      checkOut: hotelRequest.checkOutDate,
      occupancy: hotelRequest.occupancy,
      rooms: hotelRequest.rooms,
      sort: hotelRequest.sort,
      priceRange: hotelRequest.filters.priceRanges,
      starRating: hotelRequest.filters.starRatings,
      guestRating: hotelRequest.filters.guestRatingMin == null ? [] : [hotelRequest.filters.guestRatingMin * 2],
      amenities: hotelRequest.filters.amenities,
    }
  }

  const carRequest = providerRequest as CarProviderRequest
  return {
    pickupLocation: request.airport || carRequest.citySlug,
    pickupDate: carRequest.pickupDate,
    dropoffDate: carRequest.dropoffDate,
    sort: carRequest.sort,
    vehicleClass: carRequest.filters.vehicleClassKeys,
    pickupType: carRequest.filters.pickupType || 'airport',
    transmission: carRequest.filters.transmission,
    seatsMin: carRequest.filters.seatsMin,
    priceBand: carRequest.filters.priceBand,
  }
}

const getProviderLabel = (provider: ProviderAdapter | null, request: SearchRequest) => {
  if (provider?.provider) return provider.provider
  return request.type
}

export class SearchExecutionError extends Error {
  code: SearchRequestErrorCode
  field?: string
  status: number
  value?: string | null

  constructor(
    code: SearchRequestErrorCode,
    message: string,
    options: {
      field?: string
      value?: string | null
      status?: number
    } = {},
  ) {
    super(message)
    this.name = 'SearchExecutionError'
    this.code = code
    this.field = options.field
    this.value = options.value
    this.status =
      options.status ??
      (code === 'LOCATION_NOT_FOUND' ? 404 : code === 'PROVIDER_UNAVAILABLE' ? 503 : 400)
  }

  toJSON(): SearchRequestError {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
      ...(this.value !== undefined ? { value: this.value } : {}),
    }
  }
}

export const isSearchExecutionError = (value: unknown): value is SearchExecutionError =>
  value instanceof SearchExecutionError

export const executeSearchRequest = async (
  request: SearchRequest,
  overrides: SearchServiceDependencies = {},
): Promise<NormalizedSearchResults> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const searchParams = await toSearchParams(request, dependencies)
  const providerRequest = validateAndMapRequest(searchParams)
  const cacheParams = buildCacheParams(request, providerRequest)
  const searchKey = getSearchCacheKey(request.type, cacheParams)
  const provider = dependencies.getProvider(request.type)
  const providerLabel = getProviderLabel(provider, request)

  const cachedResults = dependencies.getCachedResults(searchKey)
  if (cachedResults) {
    return {
      request,
      searchKey,
      cacheHit: true,
      provider: providerLabel,
      results: cachedResults,
    }
  }

  if (!provider) {
    throw new SearchExecutionError(
      'PROVIDER_UNAVAILABLE',
      `No provider adapter is registered for ${request.type} search.`,
      {
        field: 'type',
        value: request.type,
        status: 503,
      },
    )
  }

  const results = await provider.search(searchParams)
  dependencies.setCachedResults(request.type, searchKey, cacheParams, results)

  return {
    request,
    searchKey,
    cacheHit: false,
    provider: providerLabel,
    results,
  }
}
