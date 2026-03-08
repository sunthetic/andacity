import type { RequestHandler } from '@builder.io/qwik-city'
import { parseTripIdParam, parseTripItemCandidateInput } from '~/lib/queries/trips.server'
import { addItemToTrip, TripRepoError } from '~/lib/repos/trips-repo.server'

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
  const candidate = parseTripItemCandidateInput(payload)
  if (!candidate) {
    sendJson(headers, send, 400, { error: 'Invalid trip item payload.' })
    return
  }

  try {
    const trip = await addItemToTrip(tripId, candidate)
    sendJson(headers, send, 201, { trip })
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === 'trip_not_found' || error.code === 'inventory_not_found'
          ? 404
          : error.code === 'trip_schema_missing' || error.code === 'trip_runtime_stale'
            ? 503
            : 400
      sendJson(headers, send, status, { error: error.message, code: error.code })
      return
    }

    const message = error instanceof Error ? error.message : 'Failed to add item to trip.'
    sendJson(headers, send, 500, { error: message })
  }
}
