import type { RequestHandler } from "@builder.io/qwik-city";
import {
  parseTripIdParam,
  parseTripRollbackDraftInput,
} from "~/lib/queries/trips.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  restoreTripRollbackDraft,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";

export const onPost: RequestHandler = async ({
  params,
  request,
  headers,
  send,
}) => {
  const tripId = parseTripIdParam(params.tripId);
  if (!tripId) {
    sendJson(headers, send, 400, { error: "Invalid trip id." });
    return;
  }

  const payload = await request.json().catch(() => ({}));
  const draft = parseTripRollbackDraftInput(payload);
  if (!draft) {
    sendJson(headers, send, 400, { error: "Invalid trip rollback payload." });
    return;
  }

  try {
    const trip = await restoreTripRollbackDraft(tripId, draft);
    sendJson(headers, send, 200, { trip });
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
      });
      return;
    }

    sendApiServerError(
      headers,
      send,
      error,
      "Failed to restore trip draft.",
      { label: "trip-restore" },
    );
  }
};
