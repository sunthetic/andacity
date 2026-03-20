import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseTripIdParam,
  parseUpdateTripInput,
} from "~/lib/queries/trips.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  deleteTrip,
  getTripDetails,
  TripRepoError,
  updateTripMetadata,
} from "~/lib/repos/trips-repo.server";

export const onGet: RequestHandler = async ({
  params,
  headers,
  query,
  send,
}) => {
  const tripId = parseTripIdParam(params.tripId);
  if (!tripId) {
    sendJson(headers, send, 400, { error: "Invalid trip id." }, { cacheControl: "no-store" });
    return;
  }

  const revalidateMode = query.get("revalidate") === "force" ? "force" : "auto";

  try {
    const trip = await getTripDetails(tripId, { revalidate: revalidateMode });
    if (!trip) {
      sendJson(headers, send, 404, { error: "Trip not found." }, { cacheControl: "no-store" });
      return;
    }

    sendJson(headers, send, 200, { trip }, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_schema_missing" ||
        error.code === "trip_runtime_stale"
          ? 503
          : error.code === "trip_not_found"
            ? 404
            : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      }, { cacheControl: "no-store" });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to load trip.", {
      label: "trip-get",
      cacheControl: "no-store",
    });
  }
};

export const onPatch: RequestHandler = async ({
  params,
  request,
  headers,
  send,
}) => {
  const tripId = parseTripIdParam(params.tripId);
  if (!tripId) {
    sendJson(headers, send, 400, { error: "Invalid trip id." }, { cacheControl: "no-store" });
    return;
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const input = parseUpdateTripInput(payload);
    const trip = await updateTripMetadata(tripId, input);
    sendJson(headers, send, 200, { trip }, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_not_found"
          ? 404
          : error.code === "trip_schema_missing" ||
              error.code === "trip_runtime_stale"
            ? 503
            : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      }, { cacheControl: "no-store" });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to update trip.", {
      label: "trip-update",
      cacheControl: "no-store",
    });
  }
};

export const onDelete: RequestHandler = async ({ params, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId);
  if (!tripId) {
    sendJson(headers, send, 400, { error: "Invalid trip id." }, { cacheControl: "no-store" });
    return;
  }

  try {
    await deleteTrip(tripId);
    sendJson(headers, send, 200, { deletedTripId: tripId }, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_not_found"
          ? 404
          : error.code === "trip_schema_missing" ||
              error.code === "trip_runtime_stale"
            ? 503
            : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      }, { cacheControl: "no-store" });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to delete trip.", {
      label: "trip-delete",
      cacheControl: "no-store",
    });
  }
};
