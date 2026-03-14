import { normalizeIsoDate } from '~/lib/date/validateDate'
import type { SearchRequest, SearchRequestError, SearchRequestErrorCode } from '~/types/search'

const AIRPORT_CODE_PATTERN = /^[A-Za-z]{3}$/
const CITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type SearchRequestInput = URLSearchParams | Record<string, unknown>

const toText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || null
}

const normalizeAirportCode = (value: unknown) => {
  const text = toText(value)
  if (!text) return null
  return text.toUpperCase()
}

const normalizeCitySlug = (value: unknown) => {
  const text = toText(value)
  if (!text) return null
  return text.toLowerCase()
}

const toRoutePath = (input: string | URL) => {
  if (input instanceof URL) {
    return input.pathname
  }

  const text = String(input || '').trim()
  if (!text) return '/'

  if (/^https?:\/\//i.test(text)) {
    return new URL(text).pathname
  }

  return new URL(text.startsWith('/') ? text : `/${text}`, 'https://andacity.test').pathname
}

const readInputValue = (input: SearchRequestInput, key: string) => {
  if (input instanceof URLSearchParams) {
    return input.get(key)
  }

  return input[key]
}

const readFirstInputValue = (input: SearchRequestInput, ...keys: string[]) => {
  for (const key of keys) {
    const value = readInputValue(input, key)
    if (toText(value)) return value
  }

  return readInputValue(input, keys[0] || '')
}

const createSearchRouteError = (
  code: SearchRequestErrorCode,
  message: string,
  options: {
    field?: string
    value?: string | null
    status?: number
  } = {},
) =>
  new SearchRouteError(code, message, {
    field: options.field,
    value: options.value,
    status: options.status,
  })

const parseIsoDate = (value: unknown, field: string) => {
  const text = toText(value)
  if (!text) {
    throw createSearchRouteError('invalid_date', `${field} is required.`, {
      field,
      value: null,
    })
  }

  const isoDate = normalizeIsoDate(text)
  if (!isoDate) {
    throw createSearchRouteError('invalid_date', `${field} must be a valid ISO date.`, {
      field,
      value: text,
    })
  }

  return isoDate
}

const parseAirportCode = (value: unknown, field: string) => {
  const code = normalizeAirportCode(value)
  if (!code || !AIRPORT_CODE_PATTERN.test(code)) {
    throw createSearchRouteError(
      'invalid_location_code',
      `${field} must be a 3-letter airport code.`,
      {
        field,
        value: toText(value),
      },
    )
  }

  return code
}

const parseCitySlug = (value: unknown, field: string) => {
  const slug = normalizeCitySlug(value)
  if (!slug || !CITY_SLUG_PATTERN.test(slug)) {
    throw createSearchRouteError(
      'invalid_location_code',
      `${field} must be a lowercase city slug.`,
      {
        field,
        value: toText(value),
      },
    )
  }

  return slug
}

const assertChronologicalDates = (
  startDate: string,
  endDate: string,
  startField: string,
  endField: string,
) => {
  if (endDate <= startDate) {
    throw createSearchRouteError(
      'invalid_date',
      `${endField} must be after ${startField}.`,
      {
        field: endField,
        value: endDate,
      },
    )
  }
}

const parseFlightRoute = (segments: string[]) => {
  if (segments.length !== 4 && segments.length !== 6) {
    throw createSearchRouteError(
      'malformed_route',
      'Flight routes must match /flights/search/{origin}-{destination}/{departDate} with optional /return/{returnDate}.',
      {
        field: 'route',
      },
    )
  }

  const routeToken = toText(segments[2])
  const routeParts = routeToken?.split('-') || []
  if (routeParts.length !== 2) {
    throw createSearchRouteError(
      'malformed_route',
      'Flight routes must include origin and destination separated by a hyphen.',
      {
        field: 'route',
        value: routeToken,
      },
    )
  }

  const [originPart, destinationPart] = routeParts
  const origin = parseAirportCode(originPart, 'origin')
  const destination = parseAirportCode(destinationPart, 'destination')
  if (origin === destination) {
    throw createSearchRouteError(
      'invalid_location_code',
      'Flight routes require different origin and destination airport codes.',
      {
        field: 'destination',
        value: destination,
      },
    )
  }

  const departDate = parseIsoDate(segments[3], 'departDate')
  const request: SearchRequest = {
    type: 'flight',
    origin,
    destination,
    departDate,
  }

  if (segments.length === 6) {
    if (segments[4] !== 'return') {
      throw createSearchRouteError(
        'malformed_route',
        'Round-trip flight routes must include the /return/{returnDate} segment.',
        {
          field: 'route',
          value: segments[4] || null,
        },
      )
    }

    const returnDate = parseIsoDate(segments[5], 'returnDate')
    assertChronologicalDates(departDate, returnDate, 'departDate', 'returnDate')
    request.returnDate = returnDate
  }

  return request
}

const parseHotelRoute = (segments: string[]) => {
  if (segments.length !== 5) {
    throw createSearchRouteError(
      'malformed_route',
      'Hotel routes must match /hotels/search/{citySlug}/{checkInDate}/{checkOutDate}.',
      {
        field: 'route',
      },
    )
  }

  const city = parseCitySlug(segments[2], 'city')
  const checkIn = parseIsoDate(segments[3], 'checkIn')
  const checkOut = parseIsoDate(segments[4], 'checkOut')
  assertChronologicalDates(checkIn, checkOut, 'checkIn', 'checkOut')

  return {
    type: 'hotel',
    city,
    checkIn,
    checkOut,
  } satisfies SearchRequest
}

const parseCarRoute = (segments: string[]) => {
  if (segments.length !== 5) {
    throw createSearchRouteError(
      'malformed_route',
      'Car routes must match /cars/search/{airportCode}/{pickupDate}/{dropoffDate}.',
      {
        field: 'route',
      },
    )
  }

  const airport = parseAirportCode(segments[2], 'airport')
  const departDate = parseIsoDate(segments[3], 'departDate')
  const returnDate = parseIsoDate(segments[4], 'returnDate')
  assertChronologicalDates(departDate, returnDate, 'departDate', 'returnDate')

  return {
    type: 'car',
    airport,
    departDate,
    returnDate,
  } satisfies SearchRequest
}

const parseSearchType = (value: unknown) => {
  const type = toText(value)?.toLowerCase()
  if (type === 'flight' || type === 'hotel' || type === 'car') {
    return type
  }

  throw createSearchRouteError(
    'unsupported_search_type',
    'type must be one of flight, hotel, or car.',
    {
      field: 'type',
      value: toText(value),
    },
  )
}

const parseFlightRequest = (input: SearchRequestInput) => {
  const origin = parseAirportCode(readInputValue(input, 'origin'), 'origin')
  const destination = parseAirportCode(readInputValue(input, 'destination'), 'destination')
  if (origin === destination) {
    throw createSearchRouteError(
      'invalid_location_code',
      'Flight searches require different origin and destination airport codes.',
      {
        field: 'destination',
        value: destination,
      },
    )
  }

  const departDate = parseIsoDate(readInputValue(input, 'departDate'), 'departDate')
  const rawReturnDate = readInputValue(input, 'returnDate')
  const returnDate = toText(rawReturnDate) ? parseIsoDate(rawReturnDate, 'returnDate') : undefined

  if (returnDate) {
    assertChronologicalDates(departDate, returnDate, 'departDate', 'returnDate')
  }

  return {
    type: 'flight',
    origin,
    destination,
    departDate,
    ...(returnDate ? { returnDate } : {}),
  } satisfies SearchRequest
}

const parseHotelRequest = (input: SearchRequestInput) => {
  const city = parseCitySlug(readFirstInputValue(input, 'city', 'destination'), 'city')
  const checkIn = parseIsoDate(readFirstInputValue(input, 'checkIn', 'checkInDate'), 'checkIn')
  const checkOut = parseIsoDate(
    readFirstInputValue(input, 'checkOut', 'checkOutDate'),
    'checkOut',
  )
  assertChronologicalDates(checkIn, checkOut, 'checkIn', 'checkOut')

  return {
    type: 'hotel',
    city,
    checkIn,
    checkOut,
  } satisfies SearchRequest
}

const parseCarRequest = (input: SearchRequestInput) => {
  const airport = parseAirportCode(readFirstInputValue(input, 'airport', 'airportCode'), 'airport')
  const departDate = parseIsoDate(
    readFirstInputValue(input, 'departDate', 'pickupDate'),
    'departDate',
  )
  const returnDate = parseIsoDate(
    readFirstInputValue(input, 'returnDate', 'dropoffDate'),
    'returnDate',
  )
  assertChronologicalDates(departDate, returnDate, 'departDate', 'returnDate')

  return {
    type: 'car',
    airport,
    departDate,
    returnDate,
  } satisfies SearchRequest
}

export class SearchRouteError extends Error {
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
    this.name = 'SearchRouteError'
    this.code = code
    this.field = options.field
    this.value = options.value
    this.status =
      options.status ??
      (code === 'location_not_found' ? 404 : code === 'provider_unavailable' ? 503 : 400)
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

export const isSearchRouteError = (value: unknown): value is SearchRouteError =>
  value instanceof SearchRouteError

export const parseSearchRoute = (input: string | URL): SearchRequest => {
  const pathname = toRoutePath(input).replace(/\/+$/, '') || '/'
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length < 2 || segments[1] !== 'search') {
    throw createSearchRouteError(
      'malformed_route',
      'Search routes must begin with /{vertical}/search.',
      {
        field: 'route',
        value: pathname,
      },
    )
  }

  switch (segments[0]) {
    case 'flights':
      return parseFlightRoute(segments)

    case 'hotels':
      return parseHotelRoute(segments)

    case 'cars':
      return parseCarRoute(segments)

    default:
      throw createSearchRouteError(
        'unsupported_search_type',
        `Unsupported search route vertical "${segments[0]}".`,
        {
          field: 'route',
          value: segments[0],
        },
      )
  }
}

export const parseSearchRequestInput = (input: SearchRequestInput): SearchRequest => {
  const type = parseSearchType(
    readInputValue(input, 'type') ?? readInputValue(input, 'searchType'),
  )

  if (type === 'flight') return parseFlightRequest(input)
  if (type === 'hotel') return parseHotelRequest(input)
  return parseCarRequest(input)
}
