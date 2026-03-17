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
import type { HotelSearchEntity } from '~/types/search-entity'

type HotelSearchRequest = SearchRequest & {
  type: 'hotel'
}

type LoadCanonicalHotelSearchDependencies = {
  parseSearchRoute?: (input: string | URL) => SearchRequest
  executeSearchRequest?: (request: SearchRequest) => Promise<NormalizedSearchResults>
  now?: () => number
}

export type CanonicalHotelSearchSuccess = CanonicalSearchResponse<HotelSearchEntity> & {
  status: 200
  request: HotelSearchRequest
}

export type CanonicalHotelSearchFailure = {
  status: number
  error: SearchRequestError
}

export type CanonicalHotelSearchResult =
  | CanonicalHotelSearchSuccess
  | CanonicalHotelSearchFailure

const defaultDependencies: Required<LoadCanonicalHotelSearchDependencies> = {
  parseSearchRoute,
  executeSearchRequest: (request) => executeSearchRequest(request),
  now: () => Date.now(),
}

const isHotelSearchEntity = (value: unknown): value is HotelSearchEntity =>
  typeof value === 'object' && value !== null && 'vertical' in value && value.vertical === 'hotel'

const requireHotelRequest = (request: SearchRequest): HotelSearchRequest => {
  if (request.type === 'hotel') {
    return request as HotelSearchRequest
  }

  throw new SearchRouteError(
    'INVALID_SEARCH_TYPE',
    'Canonical hotel search route only supports hotel searches.',
    {
      field: 'type',
      value: request.type,
      status: 400,
    },
  )
}

const toHotelResults = (results: NormalizedSearchResults['results']) => {
  if (!results.every((result) => isHotelSearchEntity(result))) {
    throw new Error('Canonical hotel search returned non-hotel results.')
  }

  return results as HotelSearchEntity[]
}

const toErrorResult = (error: unknown): CanonicalHotelSearchFailure => {
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
      code: 'INTERNAL_ERROR',
      message: 'Failed to load canonical hotel search.',
    },
  }
}

export const loadCanonicalHotelSearch = async (
  input: string | URL,
  overrides: LoadCanonicalHotelSearchDependencies = {},
): Promise<CanonicalHotelSearchResult> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const startedAt = dependencies.now()

  try {
    const parsedRequest = dependencies.parseSearchRoute(input)
    const request = requireHotelRequest(parsedRequest)
    const response = await dependencies.executeSearchRequest(request)
    const results = toHotelResults(response.results)

    return {
      status: 200,
      request,
      results,
      metadata: {
        totalResults: results.length,
        providersQueried: response.providers,
        searchTime: Math.max(0, dependencies.now() - startedAt),
      },
    }
  } catch (error) {
    return toErrorResult(error)
  }
}
