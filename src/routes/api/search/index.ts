import type { RequestHandler } from '@builder.io/qwik-city'
import {
  isSearchRouteError,
  parseSearchRequestInput,
  parseSearchRoute,
} from '~/server/search/routeParser'
import {
  executeSearchRequest,
  isSearchExecutionError,
} from '~/server/search/searchService'

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
  cacheControl = 'no-store',
) => {
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', cacheControl)
  send(status, JSON.stringify(body))
}

const getRequestFromUrl = (url: URL) => {
  const route = String(url.searchParams.get('route') || '').trim()
  if (route) {
    return parseSearchRoute(route)
  }

  return parseSearchRequestInput(url.searchParams)
}

const toErrorResponse = (error: unknown) => {
  if (isSearchExecutionError(error)) {
    return {
      status: error.status,
      body: {
        error: error.toJSON(),
      },
    }
  }

  if (isSearchRouteError(error)) {
    return {
      status: error.status,
      body: {
        error: error.toJSON(),
      },
    }
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'internal_error',
        message: 'Failed to execute search.',
      },
    },
  }
}

export const onGet: RequestHandler = async ({ headers, send, url }) => {
  try {
    const request = getRequestFromUrl(url)
    const response = await executeSearchRequest(request)

    sendJson(
      headers,
      send,
      200,
      response,
      'public, max-age=60, stale-while-revalidate=240',
    )
  } catch (error) {
    const failure = toErrorResponse(error)
    sendJson(headers, send, failure.status, failure.body)
  }
}
