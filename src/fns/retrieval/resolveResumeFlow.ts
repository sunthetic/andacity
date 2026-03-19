import { fromConfirmationState } from "~/fns/recovery/fromConfirmationState";
import { fromItineraryState } from "~/fns/recovery/fromItineraryState";
import { getResumeTarget } from "~/fns/retrieval/getResumeTarget";
import { getTripByAnyRef } from "~/fns/retrieval/getTripByAnyRef";
import { resolveItineraryAccess } from "~/lib/ownership/resolveItineraryAccess";
import type { ResolveResumeFlowResult } from "~/fns/retrieval/types";
import type { RecoveryState } from "~/types/recovery";
import type { CurrentOwnershipContext } from "~/types/ownership";

const shouldTreatMissingItineraryAsRecoverable = (input: {
  confirmationStatus: string | null;
  hasItinerary: boolean;
  confirmedItemCount: number;
  itinerary: unknown;
}) => {
  if (input.itinerary || input.hasItinerary) return false;
  if (input.confirmedItemCount <= 0) return false;

  return (
    input.confirmationStatus === "partial" ||
    input.confirmationStatus === "requires_manual_review"
  );
};

const resolveRecoveryState = (input: {
  confirmation: ResolveResumeFlowResult["confirmation"];
  itinerary: ResolveResumeFlowResult["itinerary"];
  providedRecoveryState?: RecoveryState | null;
}): RecoveryState | null => {
  if (input.providedRecoveryState) {
    return input.providedRecoveryState;
  }

  if (!input.confirmation) {
    return null;
  }

  const confirmation = input.confirmation;
  const summary = confirmation.summaryJson;
  const tripHref = `/trips/${confirmation.tripId}`;

  const confirmationRecovery = fromConfirmationState({
    confirmation,
    tripHref,
  });

  if (confirmationRecovery) {
    return confirmationRecovery;
  }

  const itineraryRecovery = fromItineraryState({
    hasItinerary: Boolean(input.itinerary || summary?.hasItinerary),
    itineraryRef: input.itinerary?.publicRef || summary?.itineraryRef || null,
    confirmationRef: confirmation.publicRef,
    tripHref,
    canCreate: Boolean(summary?.confirmedItemCount && summary.confirmedItemCount > 0),
    failed: shouldTreatMissingItineraryAsRecoverable({
      confirmationStatus: confirmation.status,
      hasItinerary: Boolean(summary?.hasItinerary),
      confirmedItemCount: Number(summary?.confirmedItemCount || 0),
      itinerary: input.itinerary,
    }),
  });

  return itineraryRecovery;
};

export const resolveResumeFlow = async (
  input: {
    incomingRef: string;
    ownershipContext: CurrentOwnershipContext;
    recoveryState?: RecoveryState | null;
  },
  deps: {
    getTripByAnyRef?: typeof getTripByAnyRef;
    resolveItineraryAccess?: typeof resolveItineraryAccess;
  } = {},
): Promise<ResolveResumeFlowResult> => {
  const lookupTripByRef = deps.getTripByAnyRef || getTripByAnyRef;
  const lookupItineraryAccess =
    deps.resolveItineraryAccess || resolveItineraryAccess;

  const retrieval = await lookupTripByRef(input.incomingRef);

  const access = retrieval.itinerary
    ? await lookupItineraryAccess(
        retrieval.itinerary.publicRef,
        input.ownershipContext,
      )
    : null;

  const recoveryState = resolveRecoveryState({
    confirmation: retrieval.confirmation,
    itinerary: retrieval.itinerary,
    providedRecoveryState: input.recoveryState,
  });

  const target = getResumeTarget({
    confirmation: retrieval.confirmation,
    itinerary: retrieval.itinerary,
    access,
    recoveryState,
    incomingRefType: retrieval.incomingRefType,
  });

  return {
    incomingRef: retrieval.incomingRef,
    incomingRefType: retrieval.incomingRefType,
    confirmation: retrieval.confirmation,
    itinerary: retrieval.itinerary,
    access,
    recoveryState,
    target,
  };
};
