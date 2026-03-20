import { buildSearchRequest } from '~/server/search/buildSearchRequest'
import {
  SearchRouteError,
  isSearchRouteError,
  parseSearchRoute,
} from '~/server/search/routeParser'
import {
  executeSearchRequest,
  getIncrementalSearchSnapshot,
  type IncrementalSearchSnapshot,
  isSearchExecutionError,
} from '~/server/search/searchService'
import { readApiErrorMessage } from '~/lib/server/api-response'
import type {
  NormalizedSearchResults,
  SearchRequest,
  SearchRequestError,
  SearchResultsApiError,
  SearchResultsApiErrorCode,
  SearchResultsIncrementalApiResponse,
  SearchResultsApiResponse,
} from '~/types/search'

type SearchResultsApiDependencies = {
  buildSearchRequest?: typeof buildSearchRequest
  parseSearchRoute?: typeof parseSearchRoute
  executeSearchRequest?: (request: SearchRequest) => Promise<NormalizedSearchResults>
  getIncrementalSearchSnapshot?: (
    request: SearchRequest,
    cursor: number,
  ) => Promise<IncrementalSearchSnapshot>
  now?: () => number
}

export type SearchResultsApiHttpResponse = {
  status: number
  body: SearchResultsApiResponse | SearchResultsApiError
}

export type SearchResultsIncrementalApiHttpResponse = {
  status: number
  body: SearchResultsIncrementalApiResponse | SearchResultsApiError
}

const SEARCH_EXECUTION_FAILED_MESSAGE = 'Search execution failed. Please try again.'
const MALFORMED_ROUTE_MESSAGE = 'route must match a supported canonical search route.'

const defaultDependencies: Required<SearchResultsApiDependencies> = {
  buildSearchRequest,
  parseSearchRoute,
  executeSearchRequest: (request) => executeSearchRequest(request),
  getIncrementalSearchSnapshot: (request, cursor) => getIncrementalSearchSnapshot(request, cursor),
  now: () => Date.now(),
}

const toUrl = (input: string | URL) => {
  if (input instanceof URL) {
    return input
  }

  const text = String(input || '').trim()
  if (!text) {
    return new URL('https://andacity.test/api/search')
  }

  if (/^https?:\/\//i.test(text)) {
    return new URL(text)
  }

  return new URL(text.startsWith('/') ? text : `/${text}`, 'https://andacity.test')
}

const toJsonSafe = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const toRouteError = (error: SearchRequestError) =>
  new SearchRouteError(error.code, error.message, {
    field: error.field,
    value: error.value,
    status: 400,
  })

const resolveRequestFromUrl = (
  url: URL,
  dependencies: Required<SearchResultsApiDependencies>,
) => {
  const route = String(url.searchParams.get('route') || '').trim()
  if (route) {
    const parsedRequest = dependencies.parseSearchRoute(route)
    const result = dependencies.buildSearchRequest(parsedRequest)
    if (result.ok) {
      return result.data
    }

    throw toRouteError(result.error)
  }

  const result = dependencies.buildSearchRequest(url.searchParams)
  if (result.ok) {
    return result.data
  }

  throw toRouteError(result.error)
}

const inferLocationField = (message: string, request: SearchRequest | null) => {
  if (request?.type === 'hotel') {
    return 'city'
  }

  if (request?.type === 'car') {
    return 'airport'
  }

  const match = /^(origin|destination|pickupLocation|dropoffLocation)\b/i.exec(
    String(message || '').trim(),
  )
  if (!match) return undefined

  const field = match[1]?.toLowerCase()
  if (field === 'pickuplocation' || field === 'dropofflocation') {
    return 'airport'
  }

  return field
}

const getLocationValidationMessage = (
  request: SearchRequest | null,
  field: string | undefined,
) => {
  if (request?.type === 'hotel') {
    return 'city must reference a supported city slug.'
  }

  if (field === 'origin' || field === 'destination' || field === 'airport') {
    return `${field} must reference a supported airport code.`
  }

  return 'Search locations must reference supported airport codes.'
}

const toExecutionFailure = (error?: unknown): SearchResultsApiHttpResponse => ({
  status: 500,
  body: {
    ok: false,
    error: {
      code: 'SEARCH_EXECUTION_FAILED',
      message: readApiErrorMessage(error, SEARCH_EXECUTION_FAILED_MESSAGE),
    },
  },
})

const toValidationError = (
  code: SearchResultsApiErrorCode,
  message: string,
  field?: string,
): SearchResultsApiHttpResponse => ({
  status: 400,
  body: toJsonSafe({
    ok: false,
    error: {
      code,
      message,
      ...(field ? { field } : {}),
    },
  }),
})

const toErrorResponse = (
  error: unknown,
  request: SearchRequest | null,
): SearchResultsApiHttpResponse => {
  if (isSearchExecutionError(error) || isSearchRouteError(error)) {
    if (
      error.code === 'INVALID_SEARCH_TYPE' ||
      error.code === 'MISSING_REQUIRED_FIELD' ||
      error.code === 'INVALID_LOCATION_CODE' ||
      error.code === 'INVALID_CITY_SLUG' ||
      error.code === 'INVALID_DATE' ||
      error.code === 'INVALID_DATE_RANGE'
    ) {
      return toValidationError(error.code, error.message, error.field)
    }

    if (error.code === 'LOCATION_NOT_FOUND') {
      const field = inferLocationField(error.message, request)
      const code = request?.type === 'hotel' ? 'INVALID_CITY_SLUG' : 'INVALID_LOCATION_CODE'
      return toValidationError(code, getLocationValidationMessage(request, field), field)
    }

    if (error.code === 'MALFORMED_ROUTE') {
      return toValidationError('MISSING_REQUIRED_FIELD', MALFORMED_ROUTE_MESSAGE, 'route')
    }
  }

  console.error('[search-results-api]', error)
  return toExecutionFailure(error)
}

const toSuccessResponse = (
  response: NormalizedSearchResults,
  searchTimeMs: number,
): SearchResultsApiHttpResponse => ({
  status: 200,
  body: toJsonSafe({
    ok: true,
    data: {
      request: response.request,
      results: response.results,
      metadata: {
        vertical: response.request.type,
        totalResults: response.results.length,
        providersQueried: response.cacheHit ? [] : response.providers,
        cacheHit: response.cacheHit,
        searchTimeMs: Math.max(0, Math.round(searchTimeMs)),
      },
    },
  }),
})

const toIncrementalSuccessResponse = (
  response: IncrementalSearchSnapshot,
): SearchResultsIncrementalApiHttpResponse => ({
  status: 200,
  body: toJsonSafe({
    ok: true,
    data: {
      request: response.request,
      results: response.results,
      batches: response.batches,
      metadata: response.metadata,
    },
  }),
})

export const loadSearchResultsApiResponse = async (
  input: string | URL,
  overrides: SearchResultsApiDependencies = {},
): Promise<SearchResultsApiHttpResponse> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const url = toUrl(input)
  const startedAt = dependencies.now()
  let request: SearchRequest | null = null

  try {
    request = resolveRequestFromUrl(url, dependencies)
    const response = await dependencies.executeSearchRequest(request)
    return toSuccessResponse(response, dependencies.now() - startedAt)
  } catch (error) {
    return toErrorResponse(error, request)
  }
}

export const loadIncrementalSearchResultsApiResponse = async (
  input: string | URL,
  overrides: SearchResultsApiDependencies = {},
): Promise<SearchResultsIncrementalApiHttpResponse> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const url = toUrl(input)
  let request: SearchRequest | null = null

  try {
    request = resolveRequestFromUrl(url, dependencies)
    const cursor = Number.parseInt(String(url.searchParams.get('cursor') || '0'), 10)
    const response = await dependencies.getIncrementalSearchSnapshot(
      request,
      Number.isFinite(cursor) ? Math.max(0, cursor) : 0,
    )
    return toIncrementalSuccessResponse(response)
  } catch (error) {
    return toErrorResponse(error, request) as SearchResultsIncrementalApiHttpResponse
  }
}
