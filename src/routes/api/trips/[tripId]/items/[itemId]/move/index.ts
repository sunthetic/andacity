import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseItemIdParam,
  parseMoveTripItemInput,
  parseTripIdParam,
} from "~/lib/queries/trips.server";
import {
  moveTripItemToTrip,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";

const sendJson = (
  headers: Headers,
  send: (status: number, body: string) => void,
  status: number,
  body: unknown,
) => {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
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
    sendJson(headers, send, 400, { error: "Invalid trip or item id." });
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const input = parseMoveTripItemInput(payload);
  if (!input) {
    sendJson(headers, send, 400, { error: "Invalid move payload." });
    return;
  }

  try {
    const result = await moveTripItemToTrip(tripId, itemId, input.targetTripId);
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
      error instanceof Error ? error.message : "Failed to move trip item.";
    sendJson(headers, send, 500, { error: message });
  }
};
