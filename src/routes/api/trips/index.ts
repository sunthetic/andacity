import type { RequestHandler } from "@builder.io/qwik-city";
import { parseCreateTripInput } from "~/lib/queries/trips.server";
import { listTrips, TripRepoError } from "~/lib/repos/trips-repo.server";
import {
  createTripAssembly,
  TripAssemblyError,
} from "~/lib/trips/trip-assembly-engine";

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

export const onGet: RequestHandler = async ({ headers, send }) => {
  try {
    const trips = await listTrips();
    sendJson(headers, send, 200, { trips });
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
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to list trips.";
    sendJson(headers, send, 500, { error: message });
  }
};

export const onPost: RequestHandler = async ({ request, headers, send }) => {
  try {
    const payload = await request.json().catch(() => ({}));
    const input = parseCreateTripInput(payload);
    const trip = await createTripAssembly(input);
    sendJson(headers, send, 201, { trip });
  } catch (error) {
    if (error instanceof TripAssemblyError) {
      sendJson(headers, send, 400, { error: error.message, code: error.code });
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
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to create trip.";
    sendJson(headers, send, 500, { error: message });
  }
};
