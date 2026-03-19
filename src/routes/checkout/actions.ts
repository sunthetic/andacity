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
  CheckoutPaymentSessionStatus,
  PaymentProvider,
} from "~/types/payment";
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
    };

const mapPaymentErrorResult = (error: unknown): CheckoutPaymentActionResult => {
  if (error instanceof CheckoutPaymentSessionError) {
    return {
      ok: false,
      code: error.code,
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: error.message,
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
  };
};

export const createCheckoutPaymentIntent = async (
  checkoutSessionId: string,
): Promise<CheckoutPaymentActionResult> => {
  try {
    const paymentSession =
      await createOrResumeCheckoutPaymentSession(checkoutSessionId);

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
    };
  } catch (error) {
    return mapPaymentErrorResult(error);
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
    return {
      ok: false,
      code: "PAYMENT_SESSION_CANCELED",
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: "There is no active payment session to cancel.",
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
    return {
      ok: false,
      code: "PAYMENT_SESSION_CANCELED",
      paymentSessionId: null,
      paymentStatus: null,
      provider: null,
      clientSecret: null,
      message: "There is no active payment session to refresh.",
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
    };
  } catch (error) {
    return mapPaymentErrorResult(error);
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
    };
  }

  if (
    bookingSummary.status === "partial" ||
    bookingSummary.status === "requires_manual_review"
  ) {
    return {
      ok: true,
      code: "BOOKING_PARTIAL",
      bookingRunId: bookingSummary.bookingRunId,
      status: bookingSummary.status,
      redirectTo: null,
      message: bookingSummary.statusDescription,
      eligibilityCode: bookingSummary.eligibilityCode,
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
    };
  }

  return {
    ok: false,
    code: "BOOKING_FAILED",
    bookingRunId: bookingSummary.bookingRunId,
    status: bookingSummary.status,
    redirectTo: null,
    message: bookingSummary.statusDescription,
    eligibilityCode: bookingSummary.eligibilityCode,
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
      return {
        ok: false,
        code: "BOOKING_ALREADY_IN_PROGRESS",
        bookingRunId: eligibility.activeBookingRun?.id || null,
        status:
          eligibility.activeBookingRun?.summary?.overallStatus || "processing",
        redirectTo: null,
        message: eligibility.message,
        eligibilityCode: eligibility.code,
      };
    }

    const summary = await getBookingSummary(checkoutSessionId, {
      now: new Date(),
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
  return mapBookingSummaryToActionResult(bookingSummary);
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
    return {
      ok: false,
      code: "BOOKING_INELIGIBLE",
      bookingRunId: null,
      status: "idle",
      redirectTo: null,
      message: "There is no booking run to refresh yet.",
      eligibilityCode: bookingSummary.eligibilityCode,
    };
  }

  return mapBookingSummaryToActionResult(bookingSummary);
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
    }
  | {
      ok: false;
      code: "CONFIRMATION_INELIGIBLE" | "CONFIRMATION_FAILED";
      confirmationId: string | null;
      confirmationPublicRef: string | null;
      status: BookingConfirmationStatus | null;
      redirectTo: string | null;
      message: string;
    };

const mapConfirmationResult = (input: {
  confirmation: NonNullable<
    Awaited<ReturnType<typeof getBookingConfirmationForBookingRun>>
  >;
  created: boolean;
  message?: string;
}): CheckoutConfirmationActionResult => {
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
  };
};

export const createBookingConfirmationFromCheckout = async (
  checkoutSessionId: string,
): Promise<CheckoutConfirmationActionResult> => {
  const bookingRun = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });

  if (!bookingRun) {
    return {
      ok: false,
      code: "CONFIRMATION_INELIGIBLE",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message: "There is no booking run available for confirmation yet.",
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
    return {
      ok: false,
      code: "CONFIRMATION_INELIGIBLE",
      confirmationId: null,
      confirmationPublicRef: null,
      status: null,
      redirectTo: null,
      message: eligibility.message,
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
      return {
        ok: false,
        code: "CONFIRMATION_INELIGIBLE",
        confirmationId: null,
        confirmationPublicRef: null,
        status: null,
        redirectTo: null,
        message: "There is no confirmation-ready booking run to refresh yet.",
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
    }
  | {
      ok: false;
      code: "ITINERARY_INELIGIBLE" | "ITINERARY_CREATE_FAILED";
      itineraryId: string | null;
      itineraryRef: string | null;
      status: ItineraryStatus | null;
      message: string;
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
    return {
      ok: false,
      code: "ITINERARY_INELIGIBLE",
      itineraryId: null,
      itineraryRef: null,
      status: null,
      message:
        "Booking confirmation could not be found for itinerary creation.",
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
    };
  }

  const eligibility = await canCreateItineraryFromConfirmation({
    confirmation,
    allowExisting: true,
  });
  if (!eligibility.ok) {
    return {
      ok: false,
      code: "ITINERARY_INELIGIBLE",
      itineraryId: null,
      itineraryRef: null,
      status: null,
      message: eligibility.message,
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
    };
  } catch (error) {
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
    };
  }
};
