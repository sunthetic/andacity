import type { RequestHandler } from "@builder.io/qwik-city";
import { isBookableEntity } from "~/lib/booking/bookable-entity";
import {
  parseTripIdParam,
  parseTripItemCandidateInput,
} from "~/lib/queries/trips.server";
import { addItemToTrip, TripRepoError } from "~/lib/repos/trips-repo.server";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  addBookableEntityToTrip,
  TripAssemblyError,
} from "~/lib/trips/trip-assembly-engine";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const parseOptionalBookingSessionId = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

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
  const entity = isBookableEntity(payload)
    ? payload
    : isRecord(payload) && isBookableEntity(payload.entity)
      ? payload.entity
      : null;
  const candidate = entity ? null : parseTripItemCandidateInput(payload);

  if (!entity && !candidate) {
    sendJson(headers, send, 400, { error: "Invalid trip item payload." });
    return;
  }

  try {
    const trip = await (entity
      ? addBookableEntityToTrip({
          tripId,
          entity,
          bookingSessionId:
            isRecord(payload) && !isBookableEntity(payload)
              ? parseOptionalBookingSessionId(payload.bookingSessionId)
              : null,
        })
      : addItemToTrip(tripId, candidate as NonNullable<typeof candidate>));
    sendJson(headers, send, 201, { trip });
  } catch (error) {
    if (error instanceof TripAssemblyError) {
      const status =
        error.code === "trip_not_found"
          ? 404
          : error.code === "invalid_booking_session" ||
              error.code === "booking_session_mismatch"
            ? 409
            : error.code === "inventory_unavailable"
              ? 400
              : 404;
      sendJson(headers, send, status, {
        error: error.message,
        code: error.code,
      });
      return;
    }

    if (error instanceof TripRepoError) {
      const status =
        error.code === "trip_not_found" || error.code === "inventory_not_found"
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

    sendApiServerError(headers, send, error, "Failed to add item to trip.", {
      label: "trip-item-add",
    });
  }
};
