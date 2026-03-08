import type { RequestHandler } from '@builder.io/qwik-city'
import { parseTripIdParam, parseUpdateTripInput } from '~/lib/queries/trips.server'
import { getTripDetails, TripRepoError, updateTripMetadata } from '~/lib/repos/trips-repo.server'

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
) => {
  headers.set('content-type', 'application/json; charset=utf-8')
  send(status, JSON.stringify(body))
}

export const onGet: RequestHandler = async ({ params, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId)
  if (!tripId) {
    sendJson(headers, send, 400, { error: 'Invalid trip id.' })
    return
  }

  try {
    const trip = await getTripDetails(tripId)
    if (!trip) {
      sendJson(headers, send, 404, { error: 'Trip not found.' })
      return
    }

    sendJson(headers, send, 200, { trip })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load trip.'
    sendJson(headers, send, 500, { error: message })
  }
}

export const onPatch: RequestHandler = async ({ params, request, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId)
  if (!tripId) {
    sendJson(headers, send, 400, { error: 'Invalid trip id.' })
    return
  }

  try {
    const payload = await request.json().catch(() => ({}))
    const input = parseUpdateTripInput(payload)
    const trip = await updateTripMetadata(tripId, input)
    sendJson(headers, send, 200, { trip })
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === 'trip_not_found'
          ? 404
          : error.code === 'trip_schema_missing'
            ? 503
            : 400
      sendJson(headers, send, status, { error: error.message, code: error.code })
      return
    }

    const message = error instanceof Error ? error.message : 'Failed to update trip.'
    sendJson(headers, send, 500, { error: message })
  }
}
