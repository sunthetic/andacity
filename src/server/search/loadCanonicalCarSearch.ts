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
import type { CarSearchEntity } from '~/types/search-entity'

type CarSearchRequest = SearchRequest & {
  type: 'car'
}

type LoadCanonicalCarSearchDependencies = {
  parseSearchRoute?: (input: string | URL) => SearchRequest
  executeSearchRequest?: (request: SearchRequest) => Promise<NormalizedSearchResults>
  now?: () => number
}

export type CanonicalCarSearchSuccess = CanonicalSearchResponse<CarSearchEntity> & {
  status: 200
  request: CarSearchRequest
}

export type CanonicalCarSearchFailure = {
  status: number
  error: SearchRequestError
}

export type CanonicalCarSearchResult =
  | CanonicalCarSearchSuccess
  | CanonicalCarSearchFailure

const defaultDependencies: Required<LoadCanonicalCarSearchDependencies> = {
  parseSearchRoute,
  executeSearchRequest: (request) => executeSearchRequest(request),
  now: () => Date.now(),
}

const isCarSearchEntity = (value: unknown): value is CarSearchEntity =>
  typeof value === 'object' && value !== null && 'vertical' in value && value.vertical === 'car'

const requireCarRequest = (request: SearchRequest): CarSearchRequest => {
  if (request.type === 'car') {
    return request as CarSearchRequest
  }

  throw new SearchRouteError(
    'INVALID_SEARCH_TYPE',
    'Canonical car search route only supports car searches.',
    {
      field: 'type',
      value: request.type,
      status: 400,
    },
  )
}

const toCarResults = (results: NormalizedSearchResults['results']) => {
  if (!results.every((result) => isCarSearchEntity(result))) {
    throw new Error('Canonical car search returned non-car results.')
  }

  return results as CarSearchEntity[]
}

const toErrorResult = (error: unknown): CanonicalCarSearchFailure => {
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
      message: 'Failed to load canonical car search.',
    },
  }
}

export const loadCanonicalCarSearch = async (
  input: string | URL,
  overrides: LoadCanonicalCarSearchDependencies = {},
): Promise<CanonicalCarSearchResult> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  }
  const startedAt = dependencies.now()

  try {
    const parsedRequest = dependencies.parseSearchRoute(input)
    const request = requireCarRequest(parsedRequest)
    const response = await dependencies.executeSearchRequest(request)
    const results = toCarResults(response.results)

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
