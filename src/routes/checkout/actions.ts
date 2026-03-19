import { createOrResumeBookingRun } from "~/lib/booking/createOrResumeBookingRun";
import { executeBookingRun } from "~/lib/booking/executeBookingRun";
import { getBookingEligibility } from "~/lib/booking/getBookingEligibility";
import { getLatestBookingRunForCheckout } from "~/lib/booking/getBookingRun";
import { getBookingSummary } from "~/lib/booking/getBookingSummary";
import { refreshBookingRunStatus } from "~/lib/booking/refreshBookingRunStatus";
import { canCreateBookingConfirmation } from "~/lib/confirmation/canCreateBookingConfirmation";
import { createOrResumeBookingConfirmation } from "~/lib/confirmation/createOrResumeBookingConfirmation";
import { getBookingConfirmationForBookingRun } from "~/lib/confirmation/getBookingConfirmationForBookingRun";
import { getBookingConfirmationByPublicRef } from "~/lib/confirmation/getBookingConfirmationByPublicRef";
import { refreshBookingConfirmation as refreshBookingConfirmationState } from "~/lib/confirmation/refreshBookingConfirmation";
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
import { cancelCheckoutPaymentSession } from "~/lib/payments/cancelCheckoutPaymentSession";
import { createOrResumeCheckoutPaymentSession } from "~/lib/payments/createOrResumeCheckoutPaymentSession";
import { CheckoutPaymentSessionError } from "~/lib/payments/createCheckoutPaymentSession";
import { getActiveCheckoutPaymentSession } from "~/lib/payments/getActiveCheckoutPaymentSession";
import { getCheckoutPaymentSummary } from "~/lib/payments/getCheckoutPaymentSummary";
import { refreshCheckoutPaymentStatus } from "~/lib/payments/refreshCheckoutPaymentStatus";
import { canCreateItineraryFromConfirmation } from "~/lib/itinerary/canCreateItineraryFromConfirmation";
import { createOrResumeItineraryFromConfirmation } from "~/lib/itinerary/createOrResumeItineraryFromConfirmation";
import { getItineraryForConfirmation } from "~/lib/itinerary/getItineraryForConfirmation";
import { revalidateCheckoutSession } from "~/lib/checkout/revalidateCheckoutSession";
import { parseTripIdParam } from "~/lib/queries/trips.server";
import {
  getTripDetails,
  listTrips,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import type {
  BookingExecutionStatus,
  BookingEligibilityCode,
} from "~/types/booking";
import type { BookingConfirmationStatus } from "~/types/confirmation";
import type { ItineraryStatus } from "~/types/itinerary";
import type {
  CheckoutEntryResult,
  CheckoutReadinessState,
  CheckoutRevalidationStatus,
  TripCheckoutReadiness,
} from "~/types/checkout";
import type {
  RecoveryActionType,
  RecoveryReasonCode,
  RecoveryState,
} from "~/types/recovery";
import type {
  CheckoutPaymentSessionStatus,
  PaymentProvider,
} from "~/types/payment";
import type { TripDetails } from "~/types/trips/trip";
import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import { fromBookingState } from "~/fns/recovery/fromBookingState";
import { fromConfirmationState } from "~/fns/recovery/fromConfirmationState";
import { fromPaymentState } from "~/fns/recovery/fromPaymentState";
import { getPrimaryRecoveryAction } from "~/fns/recovery/getPrimaryRecoveryAction";
import { logRecoveryEvent } from "~/fns/recovery/logRecoveryEvent";
import { normalizeTransactionError } from "~/fns/recovery/normalizeTransactionError";
import { buildCheckoutTravelerCollection } from "~/fns/travelers/buildCheckoutTravelerCollection";
import { deleteCheckoutTravelerProfile } from "~/fns/travelers/deleteCheckoutTravelerProfile";
import { upsertCheckoutTravelerAssignment } from "~/fns/travelers/upsertCheckoutTravelerAssignment";
import { upsertCheckoutTravelerProfile } from "~/fns/travelers/upsertCheckoutTravelerProfile";
import { validateCheckoutTravelers } from "~/fns/travelers/validateCheckoutTravelers";

type RecoveryResultFields = {
  recoveryState: RecoveryState | null;
  reasonCode: RecoveryReasonCode | null;
  nextRecommendedAction: RecoveryActionType | null;
};

const withRecoveryFields = (
  recoveryState: RecoveryState | null,
): RecoveryResultFields => {
  if (!recoveryState) {
    return {
      recoveryState: null,
      reasonCode: null,
      nextRecommendedAction: null,
    };
  }

  return {
    recoveryState,
    reasonCode: recoveryState.reasonCode,
    nextRecommendedAction:
      getPrimaryRecoveryAction(recoveryState)?.type || null,
  };
};

const logIfRecovery = (
  recoveryState: RecoveryState | null,
  input: {
    event: "action_result" | "page_load" | "service_error";
    ids?: Record<string, string | number | null | undefined>;
  },
) => {
  if (!recoveryState) return;
  logRecoveryEvent(recoveryState, input);
};

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
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRIP_NOT_FOUND",
      metadata: {
        tripId: resolved.kind === "trip_not_found" ? resolved.tripId : null,
        tripHref: "/trips",
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        tripId: resolved.kind === "trip_not_found" ? resolved.tripId : null,
      },
    });
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
      ...withRecoveryFields(recoveryState),
    };
  }

  if (resolved.kind === "invalid_trip") {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRIP_INVALID",
      metadata: {
        rawMessage: `Invalid trip reference: ${resolved.tripIdParam || "(empty)"}`,
        tripHref: "/trips",
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
    });
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: `The trip reference "${resolved.tripIdParam || "(empty)"}" is not valid.`,
      }),
      ...withRecoveryFields(recoveryState),
    };
  }

  if (resolved.kind === "empty_trip") {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRIP_EMPTY",
      metadata: {
        tripId: resolved.trip.id,
        tripHref: `/trips/${resolved.trip.id}`,
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        tripId: resolved.trip.id,
      },
    });
    return {
      ok: false,
      code: "TRIP_EMPTY",
      message: getCheckoutEntryErrorMessage("TRIP_EMPTY"),
      ...withRecoveryFields(recoveryState),
    };
  }

  if (resolved.kind === "invalid_trip_state") {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRIP_INVALID",
      metadata: {
        tripId: resolved.trip.id,
        tripHref: `/trips/${resolved.trip.id}`,
        rawMessage: resolved.readiness.readinessLabel,
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        tripId: resolved.trip.id,
      },
    });
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: resolved.readiness.readinessLabel,
        tripReference: buildTripReference(resolved.trip.id),
      }),
      ...withRecoveryFields(recoveryState),
    };
  }

  if (resolved.kind === "error") {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRIP_INVALID",
      metadata: {
        rawMessage: resolved.message,
        tripHref: "/trips",
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
    });
    return {
      ok: false,
      code: "TRIP_INVALID",
      message: getCheckoutEntryErrorMessage("TRIP_INVALID", {
        detail: resolved.message,
      }),
      ...withRecoveryFields(recoveryState),
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
      ...withRecoveryFields(null),
    };
  } catch (error) {
    if (error instanceof CheckoutSessionTransitionError) {
      const normalized = normalizeTransactionError(error, {
        stage: "checkout",
        safeUserMessage: "Checkout could not be started from this trip.",
      });
      const recoveryState = buildRecoveryState({
        stage: normalized.stage,
        reasonCode: normalized.code,
        metadata: {
          tripId: resolved.trip.id,
          tripHref: `/trips/${resolved.trip.id}`,
          rawCode: String(normalized.details?.rawCode || ""),
          rawMessage: normalized.message,
        },
      });
      logIfRecovery(recoveryState, {
        event: "service_error",
        ids: {
          tripId: resolved.trip.id,
        },
      });
      return {
        ok: false,
        code: error.code,
        message: getCheckoutEntryErrorMessage(error.code, {
          detail: error.message,
          tripReference: buildTripReference(resolved.trip.id),
        }),
        ...withRecoveryFields(recoveryState),
      };
    }

    if (error instanceof CheckoutSessionError) {
      const normalized = normalizeTransactionError(error, {
        stage: "checkout",
        code: "CHECKOUT_CREATE_FAILED",
        safeUserMessage: "Checkout could not be created from this trip.",
      });
      const recoveryState = buildRecoveryState({
        stage: normalized.stage,
        reasonCode: normalized.code,
        metadata: {
          tripId: resolved.trip.id,
          tripHref: `/trips/${resolved.trip.id}`,
          rawCode: String(normalized.details?.rawCode || ""),
          rawMessage: normalized.message,
        },
      });
      logIfRecovery(recoveryState, {
        event: "service_error",
        ids: {
          tripId: resolved.trip.id,
        },
      });
      return {
        ok: false,
        code: "CHECKOUT_CREATE_FAILED",
        message: getCheckoutEntryErrorMessage("CHECKOUT_CREATE_FAILED", {
          detail: error.message,
          tripReference: buildTripReference(resolved.trip.id),
        }),
        ...withRecoveryFields(recoveryState),
      };
    }

    const normalized = normalizeTransactionError(error, {
      stage: "checkout",
      code: "CHECKOUT_CREATE_FAILED",
      safeUserMessage: "Checkout could not be started from this trip.",
    });
    const recoveryState = buildRecoveryState({
      stage: normalized.stage,
      reasonCode: normalized.code,
      metadata: {
        tripId: resolved.trip.id,
        tripHref: `/trips/${resolved.trip.id}`,
        rawMessage: normalized.message,
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
      ids: {
        tripId: resolved.trip.id,
      },
    });
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
      ...withRecoveryFields(recoveryState),
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
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
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
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
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
    const recoveryState = buildRecoveryState({
      stage: "revalidation",
      reasonCode: "CHECKOUT_NOT_FOUND",
      metadata: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      readiness: "blocked",
      revalidationStatus: "failed",
      counts: emptyRevalidationCounts,
      message: "Checkout session could not be found.",
      ...withRecoveryFields(recoveryState),
    };
  }

  if (isCheckoutSessionExpired(session)) {
    const recoveryState = buildRecoveryState({
      stage: "revalidation",
      reasonCode: "CHECKOUT_EXPIRED",
      metadata: {
        checkoutSessionId: session.id,
        checkoutStatus: session.status,
        tripId: session.tripId,
        tripHref: `/trips/${session.tripId}`,
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        checkoutSessionId: session.id,
      },
    });
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
      ...withRecoveryFields(recoveryState),
    };
  }

  if (isCheckoutSessionTerminal(session.status)) {
    const recoveryState = buildRecoveryState({
      stage: "revalidation",
      reasonCode: "REVALIDATION_FAILED",
      metadata: {
        checkoutSessionId: session.id,
        checkoutStatus: session.status,
        tripId: session.tripId,
        tripHref: `/trips/${session.tripId}`,
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        checkoutSessionId: session.id,
      },
    });
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
      ...withRecoveryFields(recoveryState),
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
        ...withRecoveryFields(null),
      };
    }

    const recoveryState = buildRecoveryState({
      stage: "revalidation",
      reasonCode: refreshed.revalidationSummary?.unavailableCount
        ? "INVENTORY_UNAVAILABLE"
        : refreshed.revalidationSummary?.priceChangeCount
          ? "PRICE_CHANGED"
          : "REVALIDATION_FAILED",
      metadata: {
        checkoutSessionId: refreshed.id,
        checkoutStatus: refreshed.status,
        tripId: refreshed.tripId,
        tripHref: `/trips/${refreshed.tripId}`,
        blockingIssueCount: counts.blockingIssueCount,
        priceChangeCount: counts.priceChangeCount,
        unavailableCount: counts.unavailableCount,
        failedCount: counts.failedCount,
      },
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        checkoutSessionId: refreshed.id,
      },
    });
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
      ...withRecoveryFields(recoveryState),
    };
  } catch (error) {
    const normalized = normalizeTransactionError(error, {
      stage: "revalidation",
      code: "REVALIDATION_FAILED",
      safeUserMessage: "Checkout revalidation failed.",
    });
    const recoveryState = buildRecoveryState({
      stage: normalized.stage,
      reasonCode: normalized.code,
      metadata: {
        checkoutSessionId,
        rawMessage: normalized.message,
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
      ids: {
        checkoutSessionId,
      },
    });
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
      ...withRecoveryFields(recoveryState),
    };
  }
};

export type CheckoutTravelerActionResult =
  | {
      ok: true;
      code:
        | "TRAVELER_SAVED"
        | "TRAVELER_ASSIGNED"
        | "TRAVELER_REMOVED"
        | "TRAVELER_VALIDATION_PASSED";
      message: string;
      validationSummary: Awaited<
        ReturnType<typeof buildCheckoutTravelerCollection>
      >["validationSummary"] | null;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    }
  | {
      ok: false;
      code:
        | "CHECKOUT_NOT_FOUND"
        | "TRAVELER_VALIDATION_FAILED"
        | "TRAVELER_SAVE_FAILED"
        | "TRAVELER_ASSIGN_FAILED"
        | "TRAVELER_REMOVE_FAILED";
      message: string;
      validationSummary: Awaited<
        ReturnType<typeof buildCheckoutTravelerCollection>
      >["validationSummary"] | null;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    };

const getCheckoutTravelerValidationSummary = async (checkoutSessionId: string) => {
  const session = await getCheckoutSession(checkoutSessionId, {
    includeTerminal: true,
  });
  if (!session) return null;
  const collection = await buildCheckoutTravelerCollection({
    checkoutSessionId: session.id,
    checkoutItems: session.items,
  });
  return collection.validationSummary;
};

export const saveCheckoutTravelerProfile = async (input: {
  checkoutSessionId: string;
  profile: {
    id?: string | null;
    type?: string | null;
    role?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    dateOfBirth?: string | null;
    email?: string | null;
    phone?: string | null;
    nationality?: string | null;
    documentType?: string | null;
    documentNumber?: string | null;
    documentExpiryDate?: string | null;
    issuingCountry?: string | null;
    knownTravelerNumber?: string | null;
    redressNumber?: string | null;
    driverAge?: number | string | null;
  };
}): Promise<CheckoutTravelerActionResult> => {
  const session = await getCheckoutSession(input.checkoutSessionId, {
    includeTerminal: true,
  });
  if (!session) {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_NOT_FOUND",
      metadata: {
        checkoutSessionId: input.checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      message: "Checkout session could not be found.",
      validationSummary: null,
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    await upsertCheckoutTravelerProfile({
      checkoutSessionId: session.id,
      ...input.profile,
    });
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );

    return {
      ok: true,
      code: "TRAVELER_SAVED",
      message: "Traveler details saved.",
      validationSummary,
      ...withRecoveryFields(
        validationSummary?.status === "complete"
          ? null
          : buildRecoveryState({
              stage: "checkout",
              reasonCode:
                validationSummary?.status === "invalid"
                  ? "CHECKOUT_TRAVELERS_INVALID"
                  : "CHECKOUT_TRAVELERS_INCOMPLETE",
              metadata: {
                checkoutSessionId: session.id,
                issueCount: validationSummary?.issueCount || 0,
              },
            }),
      ),
    };
  } catch (error) {
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_TRAVELERS_INVALID",
      metadata: {
        checkoutSessionId: session.id,
        rawMessage:
          error instanceof Error
            ? error.message
            : "Traveler profile save failed.",
      },
    });
    return {
      ok: false,
      code: "TRAVELER_SAVE_FAILED",
      message:
        error instanceof Error ? error.message : "Traveler profile save failed.",
      validationSummary,
      ...withRecoveryFields(recoveryState),
    };
  }
};

export const assignCheckoutTravelerToItem = async (input: {
  checkoutSessionId: string;
  assignment: {
    id?: string | null;
    checkoutItemKey?: string | null;
    travelerProfileId: string;
    role?: string | null;
    isPrimary?: boolean | null;
  };
}): Promise<CheckoutTravelerActionResult> => {
  const session = await getCheckoutSession(input.checkoutSessionId, {
    includeTerminal: true,
  });
  if (!session) {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_NOT_FOUND",
      metadata: {
        checkoutSessionId: input.checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      message: "Checkout session could not be found.",
      validationSummary: null,
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    await upsertCheckoutTravelerAssignment({
      checkoutSessionId: session.id,
      ...input.assignment,
    });
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );
    const reasonCode =
      validationSummary?.status === "invalid"
        ? "CHECKOUT_TRAVELERS_INVALID"
        : validationSummary?.status === "incomplete"
          ? "TRAVELER_ASSIGNMENT_MISMATCH"
          : null;
    return {
      ok: true,
      code: "TRAVELER_ASSIGNED",
      message: "Traveler assignment saved.",
      validationSummary,
      ...withRecoveryFields(
        reasonCode
          ? buildRecoveryState({
              stage: "checkout",
              reasonCode,
              metadata: {
                checkoutSessionId: session.id,
                issueCount: validationSummary?.issueCount || 0,
              },
            })
          : null,
      ),
    };
  } catch (error) {
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "TRAVELER_ASSIGNMENT_MISMATCH",
      metadata: {
        checkoutSessionId: session.id,
        rawMessage:
          error instanceof Error
            ? error.message
            : "Traveler assignment save failed.",
      },
    });
    return {
      ok: false,
      code: "TRAVELER_ASSIGN_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Traveler assignment save failed.",
      validationSummary,
      ...withRecoveryFields(recoveryState),
    };
  }
};

export const removeCheckoutTravelerProfile = async (input: {
  checkoutSessionId: string;
  travelerProfileId: string;
}): Promise<CheckoutTravelerActionResult> => {
  const session = await getCheckoutSession(input.checkoutSessionId, {
    includeTerminal: true,
  });
  if (!session) {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_NOT_FOUND",
      metadata: {
        checkoutSessionId: input.checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      message: "Checkout session could not be found.",
      validationSummary: null,
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    const removed = await deleteCheckoutTravelerProfile({
      checkoutSessionId: session.id,
      travelerProfileId: input.travelerProfileId,
    });
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );
    if (removed) {
      return {
        ok: true,
        code: "TRAVELER_REMOVED",
        message: "Traveler profile removed.",
        validationSummary,
        ...withRecoveryFields(
          validationSummary?.status === "complete"
            ? null
            : buildRecoveryState({
                stage: "checkout",
                reasonCode: "CHECKOUT_TRAVELERS_INCOMPLETE",
                metadata: {
                  checkoutSessionId: session.id,
                },
              }),
        ),
      };
    }

    return {
      ok: false,
      code: "TRAVELER_REMOVE_FAILED",
      message: "Traveler profile could not be removed.",
      validationSummary,
      ...withRecoveryFields(
        buildRecoveryState({
          stage: "checkout",
          reasonCode: "CHECKOUT_TRAVELERS_INCOMPLETE",
          metadata: {
            checkoutSessionId: session.id,
          },
        }),
      ),
    };
  } catch (error) {
    const validationSummary = await getCheckoutTravelerValidationSummary(
      session.id,
    );
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_TRAVELERS_INCOMPLETE",
      metadata: {
        checkoutSessionId: session.id,
        rawMessage:
          error instanceof Error
            ? error.message
            : "Traveler profile remove failed.",
      },
    });
    return {
      ok: false,
      code: "TRAVELER_REMOVE_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Traveler profile remove failed.",
      validationSummary,
      ...withRecoveryFields(recoveryState),
    };
  }
};

export const validateCheckoutTravelersAction = async (input: {
  checkoutSessionId: string;
}): Promise<CheckoutTravelerActionResult> => {
  const session = await getCheckoutSession(input.checkoutSessionId, {
    includeTerminal: true,
  });
  if (!session) {
    const recoveryState = buildRecoveryState({
      stage: "checkout",
      reasonCode: "CHECKOUT_NOT_FOUND",
      metadata: {
        checkoutSessionId: input.checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CHECKOUT_NOT_FOUND",
      message: "Checkout session could not be found.",
      validationSummary: null,
      ...withRecoveryFields(recoveryState),
    };
  }

  const validated = await validateCheckoutTravelers({
    checkoutSessionId: session.id,
    checkoutItems: session.items,
  });
  const validationSummary = validated.validationSummary;
  if (validationSummary.status === "complete") {
    return {
      ok: true,
      code: "TRAVELER_VALIDATION_PASSED",
      message: "Traveler details are complete.",
      validationSummary,
      ...withRecoveryFields(null),
    };
  }

  const recoveryState = buildRecoveryState({
    stage: "checkout",
    reasonCode:
      validationSummary.status === "invalid"
        ? "CHECKOUT_TRAVELERS_INVALID"
        : validationSummary.issues.some(
              (issue) =>
                issue.code === "PASSENGER_COUNT_MISMATCH" ||
                issue.code === "TRAVELER_ASSIGNMENT_MISSING" ||
                issue.code === "MISSING_PRIMARY_GUEST" ||
                issue.code === "MISSING_PRIMARY_DRIVER",
            )
          ? "TRAVELER_ASSIGNMENT_MISMATCH"
          : "CHECKOUT_TRAVELERS_INCOMPLETE",
    metadata: {
      checkoutSessionId: session.id,
      issueCount: validationSummary.issueCount,
    },
  });
  return {
    ok: false,
    code: "TRAVELER_VALIDATION_FAILED",
    message: "Traveler details still need attention before checkout can proceed.",
    validationSummary,
    ...withRecoveryFields(recoveryState),
  };
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

export type CheckoutPaymentActionResult =
  | {
      ok: true;
      code:
        | "PAYMENT_SESSION_READY"
        | "PAYMENT_SESSION_CANCELED"
        | "PAYMENT_SESSION_REFRESHED";
      paymentSessionId: string | null;
      paymentStatus: CheckoutPaymentSessionStatus | null;
      provider: PaymentProvider | null;
      clientSecret: string | null;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    }
  | {
      ok: false;
      code:
        | "CHECKOUT_NOT_FOUND"
        | "CHECKOUT_NOT_READY"
        | "CHECKOUT_EXPIRED"
        | "PAYMENT_PROVIDER_UNAVAILABLE"
        | "PAYMENT_INTENT_CREATE_FAILED"
        | "PAYMENT_SESSION_STALE"
        | "PAYMENT_SESSION_CANCELED";
      paymentSessionId: string | null;
      paymentStatus: CheckoutPaymentSessionStatus | null;
      provider: PaymentProvider | null;
      clientSecret: string | null;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    };

const mapPaymentErrorResult = (
  error: unknown,
  checkoutSessionId?: string,
): CheckoutPaymentActionResult => {
  const normalized = normalizeTransactionError(error, {
    stage: "payment",
    safeUserMessage: "Payment session creation failed.",
  });
  const recoveryState = buildRecoveryState({
    stage: normalized.stage,
    reasonCode: normalized.code,
    metadata: {
      checkoutSessionId: checkoutSessionId || null,
      rawCode: String(normalized.details?.rawCode || ""),
      rawMessage: normalized.message,
    },
  });
  logIfRecovery(recoveryState, {
    event: "service_error",
    ids: {
      checkoutSessionId: checkoutSessionId || null,
    },
  });

  if (error instanceof CheckoutPaymentSessionError) {
    return {
      ok: false,
      code: error.code,
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: error.message,
      ...withRecoveryFields(recoveryState),
    };
  }

  return {
    ok: false,
    code: "PAYMENT_INTENT_CREATE_FAILED",
    paymentSessionId: null,
    paymentStatus: null,
    provider: null,
    clientSecret: null,
    message:
      error instanceof Error
        ? error.message
        : "Payment session creation failed.",
    ...withRecoveryFields(recoveryState),
  };
};

export const createCheckoutPaymentIntent = async (
  checkoutSessionId: string,
): Promise<CheckoutPaymentActionResult> => {
  try {
    const paymentSession =
      await createOrResumeCheckoutPaymentSession(checkoutSessionId);
    const recoveryState = fromPaymentState({
      paymentSummary: await getCheckoutPaymentSummary(
        (await getCheckoutSession(checkoutSessionId, {
          includeTerminal: true,
        }))!,
        {
          now: new Date(),
        },
      ),
      checkoutSessionId,
    });

    return {
      ok: true,
      code: "PAYMENT_SESSION_READY",
      paymentSessionId: paymentSession.id,
      paymentStatus: paymentSession.status,
      provider: paymentSession.provider,
      clientSecret: paymentSession.providerClientSecret,
      message:
        paymentSession.status === "requires_action"
          ? "Your payment session is ready for card details."
          : "Your payment session is ready to resume.",
      ...withRecoveryFields(recoveryState),
    };
  } catch (error) {
    return mapPaymentErrorResult(error, checkoutSessionId);
  }
};

export const cancelCheckoutPayment = async (
  checkoutSessionId: string,
): Promise<CheckoutPaymentActionResult> => {
  const activeSession = await getActiveCheckoutPaymentSession(
    checkoutSessionId,
    {
      now: new Date(),
    },
  );
  if (!activeSession) {
    const recoveryState = buildRecoveryState({
      stage: "payment",
      reasonCode: "PAYMENT_FAILED",
      metadata: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "PAYMENT_SESSION_CANCELED",
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: "There is no active payment session to cancel.",
      ...withRecoveryFields(recoveryState),
    };
  }

  const canceled = await cancelCheckoutPaymentSession(activeSession.id, {
    now: new Date(),
    reason: "checkout_user_canceled",
  });

  return {
    ok: true,
    code: "PAYMENT_SESSION_CANCELED",
    paymentSessionId: canceled?.id || null,
    paymentStatus: canceled?.status || null,
    provider: canceled?.provider || null,
    clientSecret: null,
    message: "Payment session canceled.",
    ...withRecoveryFields(
      buildRecoveryState({
        stage: "payment",
        reasonCode: "PAYMENT_FAILED",
        metadata: {
          checkoutSessionId,
          paymentStatus: canceled?.status || null,
        },
      }),
    ),
  };
};

export const refreshCheckoutPaymentSession = async (
  checkoutSessionId: string,
): Promise<CheckoutPaymentActionResult> => {
  const activeSession = await getActiveCheckoutPaymentSession(
    checkoutSessionId,
    {
      now: new Date(),
    },
  );

  if (!activeSession) {
    const recoveryState = buildRecoveryState({
      stage: "payment",
      reasonCode: "PAYMENT_FAILED",
      metadata: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "PAYMENT_SESSION_CANCELED",
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: "There is no active payment session to refresh.",
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    const refreshed = await refreshCheckoutPaymentStatus(activeSession.id, {
      now: new Date(),
    });

    return {
      ok: true,
      code: "PAYMENT_SESSION_REFRESHED",
      paymentSessionId: refreshed?.id || activeSession.id,
      paymentStatus: refreshed?.status || activeSession.status,
      provider: refreshed?.provider || activeSession.provider,
      clientSecret:
        refreshed?.providerClientSecret || activeSession.providerClientSecret,
      message: "Payment status refreshed.",
      ...withRecoveryFields(
        fromPaymentState({
          paymentSummary: await getCheckoutPaymentSummary(
            (await getCheckoutSession(checkoutSessionId, {
              includeTerminal: true,
            }))!,
            {
              now: new Date(),
            },
          ),
          checkoutSessionId,
        }),
      ),
    };
  } catch (error) {
    return mapPaymentErrorResult(error, checkoutSessionId);
  }
};

export type CheckoutBookingActionResult =
  | {
      ok: true;
      code: "BOOKING_STARTED" | "BOOKING_SUCCEEDED" | "BOOKING_PARTIAL";
      bookingRunId: string | null;
      status: BookingExecutionStatus;
      redirectTo: string | null;
      message: string;
      eligibilityCode: BookingEligibilityCode;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    }
  | {
      ok: false;
      code:
        | "BOOKING_FAILED"
        | "BOOKING_INELIGIBLE"
        | "BOOKING_ALREADY_IN_PROGRESS";
      bookingRunId: string | null;
      status: BookingExecutionStatus;
      redirectTo: string | null;
      message: string;
      eligibilityCode: BookingEligibilityCode;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    };

const mapBookingSummaryToActionResult = (
  bookingSummary: Awaited<ReturnType<typeof getBookingSummary>>,
): CheckoutBookingActionResult => {
  if (bookingSummary.status === "succeeded") {
    return {
      ok: true,
      code: "BOOKING_SUCCEEDED",
      bookingRunId: bookingSummary.bookingRunId,
      status: bookingSummary.status,
      redirectTo: null,
      message: "All checkout items were booked successfully.",
      eligibilityCode: bookingSummary.eligibilityCode,
      ...withRecoveryFields(null),
    };
  }

  if (
    bookingSummary.status === "partial" ||
    bookingSummary.status === "requires_manual_review"
  ) {
    const recoveryState = fromBookingState({
      bookingSummary,
      checkoutSessionId: bookingSummary.checkoutSessionId,
    });
    return {
      ok: true,
      code: "BOOKING_PARTIAL",
      bookingRunId: bookingSummary.bookingRunId,
      status: bookingSummary.status,
      redirectTo: null,
      message: bookingSummary.statusDescription,
      eligibilityCode: bookingSummary.eligibilityCode,
      ...withRecoveryFields(recoveryState),
    };
  }

  if (
    bookingSummary.status === "pending" ||
    bookingSummary.status === "processing"
  ) {
    return {
      ok: true,
      code: "BOOKING_STARTED",
      bookingRunId: bookingSummary.bookingRunId,
      status: bookingSummary.status,
      redirectTo: null,
      message: bookingSummary.statusDescription,
      eligibilityCode: bookingSummary.eligibilityCode,
      ...withRecoveryFields(null),
    };
  }

  const recoveryState = fromBookingState({
    bookingSummary,
    checkoutSessionId: bookingSummary.checkoutSessionId,
  });
  return {
    ok: false,
    code: "BOOKING_FAILED",
    bookingRunId: bookingSummary.bookingRunId,
    status: bookingSummary.status,
    redirectTo: null,
    message: bookingSummary.statusDescription,
    eligibilityCode: bookingSummary.eligibilityCode,
    ...withRecoveryFields(recoveryState),
  };
};

export const executeCheckoutBooking = async (
  checkoutSessionId: string,
): Promise<CheckoutBookingActionResult> => {
  const eligibility = await getBookingEligibility(checkoutSessionId, {
    now: new Date(),
  });

  if (!eligibility.ok) {
    if (eligibility.code === "BOOKING_ALREADY_IN_PROGRESS") {
      const recoveryState = buildRecoveryState({
        stage: "booking",
        reasonCode: "BOOKING_FAILED",
        metadata: {
          checkoutSessionId,
          bookingStatus:
            eligibility.activeBookingRun?.summary?.overallStatus ||
            "processing",
        },
      });
      return {
        ok: false,
        code: "BOOKING_ALREADY_IN_PROGRESS",
        bookingRunId: eligibility.activeBookingRun?.id || null,
        status:
          eligibility.activeBookingRun?.summary?.overallStatus || "processing",
        redirectTo: null,
        message: eligibility.message,
        eligibilityCode: eligibility.code,
        ...withRecoveryFields(recoveryState),
      };
    }

    const summary = await getBookingSummary(checkoutSessionId, {
      now: new Date(),
    });
    const recoveryState = fromBookingState({
      bookingSummary: summary,
      checkoutSessionId,
    });
    logIfRecovery(recoveryState, {
      event: "action_result",
      ids: {
        checkoutSessionId,
      },
    });

    return {
      ok: false,
      code: "BOOKING_INELIGIBLE",
      bookingRunId:
        eligibility.activeBookingRun?.id ||
        eligibility.completedBookingRun?.id ||
        summary.bookingRunId,
      status: summary.status,
      redirectTo: null,
      message: eligibility.message,
      eligibilityCode: eligibility.code,
      ...withRecoveryFields(recoveryState),
    };
  }

  const bookingRun = await createOrResumeBookingRun(
    checkoutSessionId,
    eligibility.executionKey,
    {
      now: new Date(),
    },
  );
  await executeBookingRun(bookingRun.id, {
    now: new Date(),
  });

  const bookingSummary = await getBookingSummary(checkoutSessionId, {
    now: new Date(),
  });
  const result = mapBookingSummaryToActionResult(bookingSummary);
  logIfRecovery(result.recoveryState, {
    event: "action_result",
    ids: {
      checkoutSessionId,
      bookingRunId: result.bookingRunId,
    },
  });
  return result;
};

export const refreshBookingRun = async (
  checkoutSessionId: string,
): Promise<CheckoutBookingActionResult> => {
  const refreshed = await refreshBookingRunStatus(checkoutSessionId, {
    now: new Date(),
  });
  const bookingSummary = await getBookingSummary(checkoutSessionId, {
    now: new Date(),
  });

  if (!refreshed && !bookingSummary.run) {
    const recoveryState = buildRecoveryState({
      stage: "booking",
      reasonCode: "CHECKOUT_NOT_READY",
      metadata: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "BOOKING_INELIGIBLE",
      bookingRunId: null,
      status: "idle",
      redirectTo: null,
      message: "There is no booking run to refresh yet.",
      eligibilityCode: bookingSummary.eligibilityCode,
      ...withRecoveryFields(recoveryState),
    };
  }

  const result = mapBookingSummaryToActionResult(bookingSummary);
  logIfRecovery(result.recoveryState, {
    event: "action_result",
    ids: {
      checkoutSessionId,
      bookingRunId: result.bookingRunId,
    },
  });
  return result;
};

export type CheckoutConfirmationActionResult =
  | {
      ok: true;
      code: "CONFIRMATION_CREATED" | "CONFIRMATION_RESUMED";
      confirmationId: string;
      confirmationPublicRef: string;
      status: BookingConfirmationStatus;
      redirectTo: string | null;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    }
  | {
      ok: false;
      code: "CONFIRMATION_INELIGIBLE" | "CONFIRMATION_FAILED";
      confirmationId: string | null;
      confirmationPublicRef: string | null;
      status: BookingConfirmationStatus | null;
      redirectTo: string | null;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    };

const mapConfirmationResult = (input: {
  confirmation: NonNullable<
    Awaited<ReturnType<typeof getBookingConfirmationForBookingRun>>
  >;
  created: boolean;
  message?: string;
}): CheckoutConfirmationActionResult => {
  const recoveryState = fromConfirmationState({
    confirmation: input.confirmation,
  });
  return {
    ok: true,
    code: input.created ? "CONFIRMATION_CREATED" : "CONFIRMATION_RESUMED",
    confirmationId: input.confirmation.id,
    confirmationPublicRef: input.confirmation.publicRef,
    status: input.confirmation.status,
    redirectTo: `/confirmation/${input.confirmation.publicRef}`,
    message:
      input.message ||
      (input.created
        ? "Booking confirmation created."
        : "Booking confirmation resumed."),
    ...withRecoveryFields(recoveryState),
  };
};

export const createBookingConfirmationFromCheckout = async (
  checkoutSessionId: string,
): Promise<CheckoutConfirmationActionResult> => {
  const bookingRun = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });

  if (!bookingRun) {
    const recoveryState = buildRecoveryState({
      stage: "confirmation",
      reasonCode: "CONFIRMATION_FAILED",
      metadata: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CONFIRMATION_INELIGIBLE",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message: "There is no booking run available for confirmation yet.",
      ...withRecoveryFields(recoveryState),
    };
  }

  const existing = await getBookingConfirmationForBookingRun(bookingRun.id);
  if (existing) {
    return mapConfirmationResult({
      confirmation: existing,
      created: false,
      message: "Existing booking confirmation resumed.",
    });
  }

  const eligibility = await canCreateBookingConfirmation({
    bookingRun,
    allowExisting: true,
  });
  if (!eligibility.ok) {
    const recoveryState = buildRecoveryState({
      stage: "confirmation",
      reasonCode: "CONFIRMATION_FAILED",
      metadata: {
        checkoutSessionId,
        bookingStatus: bookingRun.summary?.overallStatus || bookingRun.status,
      },
    });
    return {
      ok: false,
      code: "CONFIRMATION_INELIGIBLE",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message: eligibility.message,
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    const result = await createOrResumeBookingConfirmation(bookingRun.id, {
      now: new Date(),
    });
    try {
      await createOrResumeItineraryFromConfirmation(result.confirmation.id, {
        now: new Date(),
      });
    } catch {
      // Confirmation creation should still succeed even if itinerary promotion needs a retry.
    }

    return mapConfirmationResult({
      confirmation: result.confirmation,
      created: result.created,
      message: result.created
        ? "Booking confirmation created from the latest booking run."
        : "Existing booking confirmation resumed.",
    });
  } catch (error) {
    const normalized = normalizeTransactionError(error, {
      stage: "confirmation",
      code: "CONFIRMATION_FAILED",
      safeUserMessage: "Booking confirmation could not be created.",
    });
    const recoveryState = buildRecoveryState({
      stage: normalized.stage,
      reasonCode: normalized.code,
      metadata: {
        checkoutSessionId,
        bookingStatus: bookingRun.summary?.overallStatus || bookingRun.status,
        rawMessage: normalized.message,
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
      ids: {
        checkoutSessionId,
        bookingRunId: bookingRun.id,
      },
    });
    return {
      ok: false,
      code: "CONFIRMATION_FAILED",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message:
        error instanceof Error
          ? error.message
          : "Booking confirmation could not be created.",
      ...withRecoveryFields(recoveryState),
    };
  }
};

export const refreshBookingConfirmation = async (
  checkoutSessionId: string,
): Promise<CheckoutConfirmationActionResult> => {
  try {
    const confirmation = await refreshBookingConfirmationState(
      checkoutSessionId,
      {
        now: new Date(),
      },
    );

    if (!confirmation) {
      const recoveryState = buildRecoveryState({
        stage: "confirmation",
        reasonCode: "CONFIRMATION_FAILED",
        metadata: {
          checkoutSessionId,
        },
      });
      return {
        ok: false,
        code: "CONFIRMATION_INELIGIBLE",
        confirmationId: null,
        confirmationPublicRef: null,
        status: null,
        redirectTo: null,
        message: "There is no confirmation-ready booking run to refresh yet.",
        ...withRecoveryFields(recoveryState),
      };
    }

    try {
      await createOrResumeItineraryFromConfirmation(confirmation.id, {
        now: new Date(),
      });
    } catch {
      // Keep refresh resilient even when itinerary promotion is unavailable.
    }

    return mapConfirmationResult({
      confirmation,
      created: false,
      message: "Booking confirmation refreshed from persisted state.",
    });
  } catch (error) {
    const normalized = normalizeTransactionError(error, {
      stage: "confirmation",
      code: "CONFIRMATION_FAILED",
      safeUserMessage: "Booking confirmation could not be refreshed.",
    });
    const recoveryState = buildRecoveryState({
      stage: normalized.stage,
      reasonCode: normalized.code,
      metadata: {
        checkoutSessionId,
        rawMessage: normalized.message,
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
      ids: {
        checkoutSessionId,
      },
    });
    return {
      ok: false,
      code: "CONFIRMATION_FAILED",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message:
        error instanceof Error
          ? error.message
          : "Booking confirmation could not be refreshed.",
      ...withRecoveryFields(recoveryState),
    };
  }
};

export type CheckoutItineraryActionResult =
  | {
      ok: true;
      code: "ITINERARY_CREATED" | "ITINERARY_RESUMED";
      itineraryId: string;
      itineraryRef: string;
      status: ItineraryStatus;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    }
  | {
      ok: false;
      code: "ITINERARY_INELIGIBLE" | "ITINERARY_CREATE_FAILED";
      itineraryId: string | null;
      itineraryRef: string | null;
      status: ItineraryStatus | null;
      message: string;
      recoveryState: RecoveryState | null;
      reasonCode: RecoveryReasonCode | null;
      nextRecommendedAction: RecoveryActionType | null;
    };

export const createItineraryFromConfirmation = async (input: {
  confirmationRef?: string | null;
  checkoutSessionId?: string | null;
}): Promise<CheckoutItineraryActionResult> => {
  let confirmation = null;

  if (input.confirmationRef) {
    confirmation = await getBookingConfirmationByPublicRef(
      input.confirmationRef,
    );
  } else if (input.checkoutSessionId) {
    const bookingRun = await getLatestBookingRunForCheckout(
      input.checkoutSessionId,
      {
        includeTerminal: true,
      },
    );
    if (bookingRun) {
      confirmation = await getBookingConfirmationForBookingRun(bookingRun.id);
    }
  }

  if (!confirmation) {
    const recoveryState = buildRecoveryState({
      stage: "itinerary",
      reasonCode: "ITINERARY_CREATE_FAILED",
      metadata: {
        checkoutSessionId: input.checkoutSessionId || null,
        confirmationRef: input.confirmationRef || null,
      },
    });
    return {
      ok: false,
      code: "ITINERARY_INELIGIBLE",
      itineraryId: null,
      itineraryRef: null,
      status: null,
      message:
        "Booking confirmation could not be found for itinerary creation.",
      ...withRecoveryFields(recoveryState),
    };
  }

  const existing = await getItineraryForConfirmation(confirmation.id);
  if (existing) {
    return {
      ok: true,
      code: "ITINERARY_RESUMED",
      itineraryId: existing.id,
      itineraryRef: existing.publicRef,
      status: existing.status,
      message: "Existing durable itinerary resumed.",
      ...withRecoveryFields(null),
    };
  }

  const eligibility = await canCreateItineraryFromConfirmation({
    confirmation,
    allowExisting: true,
  });
  if (!eligibility.ok) {
    const recoveryState = buildRecoveryState({
      stage: "itinerary",
      reasonCode: "ITINERARY_CREATE_FAILED",
      metadata: {
        confirmationRef: confirmation.publicRef,
        tripId: confirmation.tripId,
        tripHref: `/trips/${confirmation.tripId}`,
        hasConfirmedItems: confirmation.items.some(
          (item) => item.status === "confirmed",
        ),
      },
    });
    return {
      ok: false,
      code: "ITINERARY_INELIGIBLE",
      itineraryId: null,
      itineraryRef: null,
      status: null,
      message: eligibility.message,
      ...withRecoveryFields(recoveryState),
    };
  }

  try {
    const result = await createOrResumeItineraryFromConfirmation(
      confirmation.id,
      {
        now: new Date(),
      },
    );

    return {
      ok: true,
      code: result.created ? "ITINERARY_CREATED" : "ITINERARY_RESUMED",
      itineraryId: result.itinerary.id,
      itineraryRef: result.itinerary.publicRef,
      status: result.itinerary.status,
      message: result.created
        ? "Durable itinerary created from the latest confirmation."
        : "Existing durable itinerary resumed.",
      ...withRecoveryFields(null),
    };
  } catch (error) {
    const normalized = normalizeTransactionError(error, {
      stage: "itinerary",
      code: "ITINERARY_CREATE_FAILED",
      safeUserMessage: "Itinerary could not be created from this confirmation.",
    });
    const recoveryState = buildRecoveryState({
      stage: normalized.stage,
      reasonCode: normalized.code,
      metadata: {
        confirmationRef: confirmation.publicRef,
        tripId: confirmation.tripId,
        tripHref: `/trips/${confirmation.tripId}`,
        rawMessage: normalized.message,
        hasConfirmedItems: confirmation.items.some(
          (item) => item.status === "confirmed",
        ),
      },
    });
    logIfRecovery(recoveryState, {
      event: "service_error",
      ids: {
        confirmationRef: confirmation.publicRef,
      },
    });
    return {
      ok: false,
      code: "ITINERARY_CREATE_FAILED",
      itineraryId: null,
      itineraryRef: null,
      status: null,
      message:
        error instanceof Error
          ? error.message
          : "Itinerary could not be created from this confirmation.",
      ...withRecoveryFields(recoveryState),
    };
  }
};
