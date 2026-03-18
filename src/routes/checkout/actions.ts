import {
  createOrResumeCheckoutSession,
  CheckoutSessionTransitionError,
} from "~/lib/checkout/createOrResumeCheckoutSession";
import { getCheckoutEntryErrorMessage } from "~/lib/checkout/getCheckoutEntryErrorMessage";
import { getTripCheckoutReadiness } from "~/lib/checkout/getTripCheckoutReadiness";
import {
  CheckoutSessionError,
  persistCheckoutSessionStatus,
} from "~/lib/checkout/getCheckoutSession";
import { parseTripIdParam } from "~/lib/queries/trips.server";
import {
  getTripDetails,
  listTrips,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import type {
  CheckoutEntryResult,
  TripCheckoutReadiness,
} from "~/types/checkout";
import type { TripDetails } from "~/types/trips/trip";

type ResolveCheckoutTripResult =
  | {
      kind: "ready";
      trip: TripDetails;
      tripIdParam: number | null;
      readiness: TripCheckoutReadiness;
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
      readiness: TripCheckoutReadiness;
    }
  | {
      kind: "invalid_trip_state";
      trip: TripDetails;
      tripIdParam: number | null;
      readiness: TripCheckoutReadiness;
    }
  | {
      kind: "error";
      tripIdParam: number | null;
      title: string;
      message: string;
    };

const buildTripReference = (tripId: number) => {
  return `TRIP-${String(Math.max(0, tripId)).padStart(6, "0")}`;
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
    const trips = await listTrips();
    const resolvedTripId =
      tripId ?? trips.find((trip) => trip.itemCount >= 0)?.id ?? null;

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

    const readiness = getTripCheckoutReadiness(trip);

    if (!trip.items.length) {
      return {
        kind: "empty_trip",
        trip,
        tripIdParam: tripId,
        readiness,
      };
    }

    if (!readiness.isReady) {
      return {
        kind: "invalid_trip_state",
        trip,
        tripIdParam: tripId,
        readiness,
      };
    }

    return {
      kind: "ready",
      trip,
      tripIdParam: tripId,
      readiness,
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
}): Promise<CheckoutEntryResult> => {
  const resolved = await resolveCheckoutTrip({ tripId: input.tripId });

  if (resolved.kind === "missing_trip" || resolved.kind === "trip_not_found") {
    return {
      ok: false,
      code: "TRIP_NOT_FOUND",
      message: getCheckoutEntryErrorMessage("TRIP_NOT_FOUND", {
        tripReference:
          resolved.kind === "trip_not_found"
            ? buildTripReference(resolved.tripId)
            : null,
        tripIdParam:
          resolved.kind === "trip_not_found"
            ? resolved.tripId
            : resolved.tripIdParam,
      }),
    };
  }

  if (resolved.kind === "invalid_trip") {
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: `The trip reference "${resolved.tripIdParam || "(empty)"}" is not valid.`,
      }),
    };
  }

  if (resolved.kind === "empty_trip") {
    return {
      ok: false,
      code: "TRIP_EMPTY",
      message: getCheckoutEntryErrorMessage("TRIP_EMPTY"),
    };
  }

  if (resolved.kind === "invalid_trip_state") {
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: resolved.readiness.readinessLabel,
        tripReference: buildTripReference(resolved.trip.id),
      }),
    };
  }

  if (resolved.kind === "error") {
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: resolved.message,
      }),
    };
  }

  try {
    const result = await createOrResumeCheckoutSession({
      trip: resolved.trip,
      now: input.now,
    });

    return {
      ok: true,
      checkoutSessionId: result.session.id,
      redirectTo: result.redirectTo,
      entryMode: result.entryMode,
    };
  } catch (error) {
    if (error instanceof CheckoutSessionTransitionError) {
      return {
        ok: false,
        code: error.code,
        message: getCheckoutEntryErrorMessage(error.code, {
          detail: error.message,
          tripReference: buildTripReference(resolved.trip.id),
        }),
      };
    }

    if (error instanceof CheckoutSessionError) {
      return {
        ok: false,
        code: "CHECKOUT_CREATE_FAILED",
        message: getCheckoutEntryErrorMessage("CHECKOUT_CREATE_FAILED", {
          detail: error.message,
          tripReference: buildTripReference(resolved.trip.id),
        }),
      };
    }

    return {
      ok: false,
      code: "CHECKOUT_CREATE_FAILED",
      message: getCheckoutEntryErrorMessage("CHECKOUT_CREATE_FAILED", {
        detail:
          error instanceof Error
            ? error.message
            : "Checkout could not be started from this trip.",
        tripReference: buildTripReference(resolved.trip.id),
      }),
    };
  }
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
