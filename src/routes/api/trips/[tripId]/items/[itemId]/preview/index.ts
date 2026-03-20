import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseItemIdParam,
  parseTripEditPreviewInput,
  parseTripIdParam,
} from "~/lib/queries/trips.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  previewTripItemEdit,
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
    sendJson(headers, send, 400, { error: "Invalid trip id or item id." });
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const input = parseTripEditPreviewInput(payload);
  if (!input) {
    sendJson(headers, send, 400, {
      error: "Invalid trip edit preview payload.",
    });
    return;
  }

  try {
    const preview = await previewTripItemEdit(tripId, itemId, input);
    sendJson(headers, send, 200, { preview });
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

    sendApiServerError(headers, send, error, "Failed to preview trip edit.", {
      label: "trip-item-preview",
    });
  }
};
