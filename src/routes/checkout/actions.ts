import { createOrResumeCheckoutSession } from "~/lib/checkout/createOrResumeCheckoutSession";
import {
  CheckoutSessionError,
  persistCheckoutSessionStatus,
} from "~/lib/checkout/getCheckoutSession";
import {
  getTripDetails,
  listTrips,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import { parseTripIdParam } from "~/lib/queries/trips.server";
import type { TripDetails } from "~/types/trips/trip";

type ResolveCheckoutTripResult =
  | {
      kind: "ready";
      trip: TripDetails;
      tripIdParam: number | null;
    }
  | {
      kind: "missing_trip";
      tripIdParam: number | null;
    }
  | {
      kind: "invalid_trip";
      tripIdParam: string;
    }
  | {
      kind: "trip_not_found";
      tripId: number;
    }
  | {
      kind: "empty_trip";
      trip: TripDetails;
      tripIdParam: number | null;
    }
  | {
      kind: "error";
      tripIdParam: number | null;
      title: string;
      message: string;
    };

const readTripIdParam = (value: string | number | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? Math.round(value) : null;
  }

  if (value == null) return null;
  return parseTripIdParam(String(value));
};

export const resolveCheckoutTrip = async (
  input: {
    tripId?: string | number | null;
  } = {},
): Promise<ResolveCheckoutTripResult> => {
  const rawTripId = input.tripId == null ? null : String(input.tripId).trim();
  const tripId = readTripIdParam(input.tripId);

  if (rawTripId && !tripId) {
    return {
      kind: "invalid_trip",
      tripIdParam: rawTripId,
    };
  }

  try {
    const resolvedTripId =
      tripId ??
      (await listTrips()).find((trip) => trip.itemCount >= 0)?.id ??
      null;

    if (!resolvedTripId) {
      return {
        kind: "missing_trip",
        tripIdParam: tripId,
      };
    }

    const trip = await getTripDetails(resolvedTripId);
    if (!trip) {
      return {
        kind: "trip_not_found",
        tripId: resolvedTripId,
      };
    }

    if (!trip.items.length) {
      return {
        kind: "empty_trip",
        trip,
        tripIdParam: tripId,
      };
    }

    return {
      kind: "ready",
      trip,
      tripIdParam: tripId,
    };
  } catch (error) {
    if (error instanceof TripRepoError) {
      return {
        kind: "error",
        tripIdParam: tripId,
        title:
          error.code === "trip_schema_missing" ||
          error.code === "trip_runtime_stale"
            ? "Trip persistence is not ready"
            : "Trip retrieval failed",
        message: error.message,
      };
    }

    return {
      kind: "error",
      tripIdParam: tripId,
      title: "Trip retrieval failed",
      message:
        error instanceof Error
          ? error.message
          : "Failed to load the checkout trip.",
    };
  }
};

export const beginCheckoutFromTrip = async (input: {
  tripId?: string | number | null;
  now?: Date | string | null;
}) => {
  const resolved = await resolveCheckoutTrip({ tripId: input.tripId });
  if (resolved.kind !== "ready") return null;

  return createOrResumeCheckoutSession({
    trip: resolved.trip,
    now: input.now,
  });
};

export const abandonCheckoutSession = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
) => {
  const normalizedId = String(checkoutSessionId || "").trim();
  if (!normalizedId) {
    throw new CheckoutSessionError(
      "invalid_session",
      "Checkout session id is required to abandon a session.",
    );
  }

  await persistCheckoutSessionStatus(normalizedId, "abandoned", options);
};
