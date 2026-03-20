import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseItemIdParam,
  parseTripIdParam,
  parseUpdateTripItemInput,
} from "~/lib/queries/trips.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import { TripRepoError, updateTripItem } from "~/lib/repos/trips-repo.server";
import {
  removeItemFromTripAssembly,
  TripAssemblyError,
} from "~/lib/trips/trip-assembly-engine";

export const onDelete: RequestHandler = async ({ params, headers, send }) => {
  const tripId = parseTripIdParam(params.tripId);
  const itemId = parseItemIdParam(params.itemId);
  if (!tripId || !itemId) {
    sendJson(headers, send, 400, { error: "Invalid trip id or item id." });
    return;
  }

  try {
    const trip = await removeItemFromTripAssembly({ tripId, itemId });
    sendJson(headers, send, 200, { trip });
  } catch (error) {
    if (error instanceof TripAssemblyError) {
      const status =
        error.code === "trip_not_found" || error.code === "trip_item_not_found"
          ? 404
          : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      });
      return;
    }

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
      });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to remove trip item.", {
      label: "trip-item-delete",
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
  const itemId = parseItemIdParam(params.itemId);
  if (!tripId || !itemId) {
    sendJson(headers, send, 400, { error: "Invalid trip id or item id." });
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const input = parseUpdateTripItemInput(payload);
  if (!input) {
    sendJson(headers, send, 400, {
      error: "Invalid trip item update payload.",
    });
    return;
  }

  try {
    const trip = await updateTripItem(tripId, itemId, input);
    sendJson(headers, send, 200, { trip });
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
      });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to update trip item.", {
      label: "trip-item-update",
    });
  }
};
