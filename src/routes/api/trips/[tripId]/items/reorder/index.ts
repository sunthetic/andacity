import type { RequestHandler } from '@builder.io/qwik-city'
import { parseTripIdParam, parseTripReorderInput } from '~/lib/queries/trips.server'
import { reorderTripItems, TripRepoError } from '~/lib/repos/trips-repo.server'

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
) => {
  headers.set('content-type', 'application/json; charset=utf-8')
  send(status, JSON.stringify(body))
}

export const onPost: RequestHandler = async ({ params, request, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId)
  if (!tripId) {
    sendJson(headers, send, 400, { error: 'Invalid trip id.' })
    return
  }

  const payload = await request.json().catch(() => ({}))
  const orderedItemIds = parseTripReorderInput(payload)
  if (!orderedItemIds) {
    sendJson(headers, send, 400, { error: 'Invalid reorder payload.' })
    return
  }

  try {
    const trip = await reorderTripItems(tripId, orderedItemIds)
    sendJson(headers, send, 200, { trip })
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === 'trip_not_found'
          ? 404
          : error.code === 'trip_schema_missing' || error.code === 'trip_runtime_stale'
            ? 503
            : 400
      sendJson(headers, send, status, { error: error.message, code: error.code })
      return
    }

    const message = error instanceof Error ? error.message : 'Failed to reorder trip items.'
    sendJson(headers, send, 500, { error: message })
  }
}
