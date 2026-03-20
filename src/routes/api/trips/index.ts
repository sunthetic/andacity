import type { RequestHandler } from "@builder.io/qwik-city";
import { parseCreateTripInput } from "~/lib/queries/trips.server";
import { listTrips, TripRepoError } from "~/lib/repos/trips-repo.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  createTripAssembly,
  TripAssemblyError,
} from "~/lib/trips/trip-assembly-engine";

export const onGet: RequestHandler = async ({ headers, send }) => {
  try {
    const trips = await listTrips();
    sendJson(headers, send, 200, { trips }, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_schema_missing" ||
        error.code === "trip_runtime_stale"
          ? 503
          : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      }, { cacheControl: "no-store" });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to list trips.", {
      label: "trips-list",
      cacheControl: "no-store",
    });
  }
};

export const onPost: RequestHandler = async ({ request, headers, send }) => {
  try {
    const payload = await request.json().catch(() => ({}));
    const input = parseCreateTripInput(payload);
    const trip = await createTripAssembly(input);
    sendJson(headers, send, 201, { trip }, { cacheControl: "no-store" });
  } catch (error) {
    if (error instanceof TripAssemblyError) {
      sendJson(headers, send, 400, { error: error.message, code: error.code }, {
        cacheControl: "no-store",
      });
      return;
    }

    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_schema_missing" ||
        error.code === "trip_runtime_stale"
          ? 503
          : 400;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      }, { cacheControl: "no-store" });
      return;
    }

    sendApiServerError(headers, send, error, "Failed to create trip.", {
      label: "trips-create",
      cacheControl: "no-store",
    });
  }
};
