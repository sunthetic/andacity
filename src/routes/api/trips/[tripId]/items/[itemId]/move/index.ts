import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseItemIdParam,
  parseMoveTripItemInput,
  parseTripIdParam,
} from "~/lib/queries/trips.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  moveTripItemToTrip,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";

export const onPost: RequestHandler = async ({
  params,
  request,
  headers,
  send,
}) => {
  const tripId = parseTripIdParam(params.tripId);
  const itemId = parseItemIdParam(params.itemId);

  if (!tripId || !itemId) {
    sendJson(headers, send, 400, { error: "Invalid trip or item id." }, { cacheControl: "no-store" });
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const input = parseMoveTripItemInput(payload);
  if (!input) {
    sendJson(headers, send, 400, { error: "Invalid move payload." }, { cacheControl: "no-store" });
    return;
  }

  try {
    const result = await moveTripItemToTrip(tripId, itemId, input.targetTripId);
    sendJson(headers, send, 200, result, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_not_found" || error.code === "trip_item_not_found"
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

    sendApiServerError(headers, send, error, "Failed to move trip item.", {
      label: "trip-item-move",
      cacheControl: "no-store",
    });
  }
};
