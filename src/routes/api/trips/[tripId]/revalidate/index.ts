import type { RequestHandler } from '@builder.io/qwik-city'
import { parseTripIdParam } from '~/lib/queries/trips.server'
import { revalidateTrip, TripRepoError } from '~/lib/repos/trips-repo.server'
import { sendApiServerError, sendJson } from '~/lib/server/api-response'

export const onPost: RequestHandler = async ({ params, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId)
  if (!tripId) {
    sendJson(headers, send, 400, { error: 'Invalid trip id.' })
    return
  }

  try {
    const trip = await revalidateTrip(tripId)
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

    sendApiServerError(headers, send, error, 'Failed to revalidate trip.', {
      label: 'trip-revalidate',
    })
  }
}
