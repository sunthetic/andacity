import {
  SearchRouteError,
  isSearchRouteError,
  parseSearchRoute,
} from '~/server/search/routeParser'
import {
  executeSearchRequest,
  isSearchExecutionError,
} from '~/server/search/searchService'
import type {
  CanonicalSearchResponse,
  NormalizedSearchResults,
  SearchRequest,
  SearchRequestError,
} from '~/types/search'
import type { FlightSearchEntity } from '~/types/search-entity'

type FlightSearchRequest = SearchRequest & {
  type: 'flight'
}

type LoadCanonicalFlightSearchDependencies = {
  parseSearchRoute?: (input: string | URL) => SearchRequest
  executeSearchRequest?: (request: SearchRequest) => Promise<NormalizedSearchResults>
  now?: () => number
}

export type CanonicalFlightSearchSuccess = CanonicalSearchResponse<FlightSearchEntity> & {
  status: 200
  request: FlightSearchRequest
}

export type CanonicalFlightSearchFailure = {
  status: number
  error: SearchRequestError
}

export type CanonicalFlightSearchResult =
  | CanonicalFlightSearchSuccess
  | CanonicalFlightSearchFailure

const defaultDependencies: Required<LoadCanonicalFlightSearchDependencies> = {
  parseSearchRoute,
  executeSearchRequest: (request) => executeSearchRequest(request),
  now: () => Date.now(),
}

const isFlightSearchEntity = (value: unknown): value is FlightSearchEntity =>
  typeof value === 'object' && value !== null && 'vertical' in value && value.vertical === 'flight'

const requireFlightRequest = (request: SearchRequest): FlightSearchRequest => {
  if (request.type === 'flight') {
    return request as FlightSearchRequest
  }

  throw new SearchRouteError(
    'unsupported_search_type',
    'Canonical flight search route only supports flight searches.',
    {
      field: 'type',
      value: request.type,
      status: 400,
    },
  )
}

const toFlightResults = (results: NormalizedSearchResults['results']) => {
  if (!results.every((result) => isFlightSearchEntity(result))) {
    throw new Error('Canonical flight search returned non-flight results.')
  }

  return results as FlightSearchEntity[]
}

const toErrorResult = (error: unknown): CanonicalFlightSearchFailure => {
  if (isSearchExecutionError(error)) {
    return {
      status: error.status,
      error: error.toJSON(),
    }
  }

  if (isSearchRouteError(error)) {
    return {
      status: error.status,
      error: error.toJSON(),
    }
  }

  return {
    status: 500,
    error: {
      code: 'internal_error',
      message: 'Failed to load canonical flight search.',
    },
  }
}

export const loadCanonicalFlightSearch = async (
  input: string | URL,
  overrides: LoadCanonicalFlightSearchDependencies = {},
): Promise<CanonicalFlightSearchResult> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const startedAt = dependencies.now()

  try {
    const parsedRequest = dependencies.parseSearchRoute(input)
    const request = requireFlightRequest(parsedRequest)
    const response = await dependencies.executeSearchRequest(request)
    const results = toFlightResults(response.results)

    return {
      status: 200,
      request,
      results,
      metadata: {
        totalResults: results.length,
        providersQueried: response.provider ? [response.provider] : [],
        searchTime: Math.max(0, dependencies.now() - startedAt),
      },
    }
  } catch (error) {
    return toErrorResult(error)
  }
}
