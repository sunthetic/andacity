import {
  createOrResumeCheckoutSession,
  CheckoutSessionTransitionError,
} from "~/lib/checkout/createOrResumeCheckoutSession";
import { getCheckoutEntryErrorMessage } from "~/lib/checkout/getCheckoutEntryErrorMessage";
import { getTripCheckoutReadiness } from "~/lib/checkout/getTripCheckoutReadiness";
import { getCheckoutReadinessState } from "~/lib/checkout/getCheckoutReadinessState";
import {
  CheckoutSessionError,
  getCheckoutSession,
  persistCheckoutSessionStatus,
} from "~/lib/checkout/getCheckoutSession";
import { isCheckoutSessionExpired } from "~/lib/checkout/isCheckoutSessionExpired";
import { isCheckoutSessionTerminal } from "~/lib/checkout/isCheckoutSessionTerminal";
import { revalidateCheckoutSession } from "~/lib/checkout/revalidateCheckoutSession";
import { parseTripIdParam } from "~/lib/queries/trips.server";
import {
  getTripDetails,
  listTrips,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import type {
  CheckoutEntryResult,
  CheckoutReadinessState,
  CheckoutRevalidationStatus,
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

export type CheckoutRevalidationActionResult =
  | {
      ok: true;
      code: "REVALIDATION_PASSED";
      readiness: CheckoutReadinessState;
      revalidationStatus: CheckoutRevalidationStatus;
      counts: {
        blockingIssueCount: number;
        priceChangeCount: number;
        unavailableCount: number;
        changedCount: number;
        failedCount: number;
      };
    }
  | {
      ok: false;
      code:
        | "CHECKOUT_NOT_FOUND"
        | "CHECKOUT_EXPIRED"
        | "REVALIDATION_FAILED"
        | "REVALIDATION_BLOCKED";
      readiness: CheckoutReadinessState;
      revalidationStatus: CheckoutRevalidationStatus;
      counts: {
        blockingIssueCount: number;
        priceChangeCount: number;
        unavailableCount: number;
        changedCount: number;
        failedCount: number;
      };
      message: string;
    };

const emptyRevalidationCounts = {
  blockingIssueCount: 0,
  priceChangeCount: 0,
  unavailableCount: 0,
  changedCount: 0,
  failedCount: 0,
};

export const runCheckoutRevalidation = async (
  checkoutSessionId: string,
): Promise<CheckoutRevalidationActionResult> => {
  const session = await getCheckoutSession(checkoutSessionId, {
    includeTerminal: true,
  });

  if (!session) {
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      readiness: "blocked",
      revalidationStatus: "failed",
      counts: emptyRevalidationCounts,
      message: "Checkout session could not be found.",
    };
  }

  if (isCheckoutSessionExpired(session)) {
    return {
      ok: false,
      code: "CHECKOUT_EXPIRED",
      readiness: "blocked",
      revalidationStatus: session.revalidationStatus,
      counts: session.revalidationSummary
        ? {
            blockingIssueCount: session.revalidationSummary.blockingIssueCount,
            priceChangeCount: session.revalidationSummary.priceChangeCount,
            unavailableCount: session.revalidationSummary.unavailableCount,
            changedCount: session.revalidationSummary.changedCount,
            failedCount: session.revalidationSummary.failedCount,
          }
        : emptyRevalidationCounts,
      message:
        "This checkout session expired. Return to the trip to create a fresh checkout snapshot.",
    };
  }

  if (isCheckoutSessionTerminal(session.status)) {
    return {
      ok: false,
      code: "REVALIDATION_FAILED",
      readiness: "blocked",
      revalidationStatus: session.revalidationStatus,
      counts: session.revalidationSummary
        ? {
            blockingIssueCount: session.revalidationSummary.blockingIssueCount,
            priceChangeCount: session.revalidationSummary.priceChangeCount,
            unavailableCount: session.revalidationSummary.unavailableCount,
            changedCount: session.revalidationSummary.changedCount,
            failedCount: session.revalidationSummary.failedCount,
          }
        : emptyRevalidationCounts,
      message: "This checkout session can no longer be revalidated.",
    };
  }

  try {
    const refreshed = await revalidateCheckoutSession(checkoutSessionId);
    const readiness = getCheckoutReadinessState(refreshed);
    const counts = refreshed.revalidationSummary
      ? {
          blockingIssueCount: refreshed.revalidationSummary.blockingIssueCount,
          priceChangeCount: refreshed.revalidationSummary.priceChangeCount,
          unavailableCount: refreshed.revalidationSummary.unavailableCount,
          changedCount: refreshed.revalidationSummary.changedCount,
          failedCount: refreshed.revalidationSummary.failedCount,
        }
      : emptyRevalidationCounts;

    if (
      readiness === "ready" &&
      refreshed.revalidationStatus === "passed" &&
      refreshed.revalidationSummary?.allItemsPassed
    ) {
      return {
        ok: true,
        code: "REVALIDATION_PASSED",
        readiness,
        revalidationStatus: refreshed.revalidationStatus,
        counts,
      };
    }

    return {
      ok: false,
      code:
        refreshed.revalidationStatus === "failed"
          ? "REVALIDATION_FAILED"
          : "REVALIDATION_BLOCKED",
      readiness,
      revalidationStatus: refreshed.revalidationStatus,
      counts,
      message: refreshed.revalidationSummary?.blockingIssueCount
        ? "One or more items changed before checkout could continue."
        : "Checkout could not be revalidated right now.",
    };
  } catch (error) {
    return {
      ok: false,
      code: "REVALIDATION_FAILED",
      readiness: "blocked",
      revalidationStatus: "failed",
      counts: emptyRevalidationCounts,
      message:
        error instanceof Error
          ? error.message
          : "Checkout revalidation failed.",
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
