import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseItemIdParam,
  parseTripEditPreviewInput,
  parseTripIdParam,
} from "~/lib/queries/trips.server";
import {
  applyTripItemEdit,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
) => {
  headers.set("content-type", "application/json; charset=utf-8");
  send(status, JSON.stringify(body));
};

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
      error: "Invalid trip edit apply payload.",
    });
    return;
  }

  try {
    const result = await applyTripItemEdit(tripId, itemId, input);
    sendJson(headers, send, 200, result);
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

    const message =
      error instanceof Error ? error.message : "Failed to apply trip edit.";
    sendJson(headers, send, 500, { error: message });
  }
};
