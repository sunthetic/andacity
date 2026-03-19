import type { RecoveryState } from "~/types/recovery";
import type { ItineraryAccessResult } from "~/types/ownership";
import type { BookingConfirmation } from "~/types/confirmation";
import type { OwnedItinerary } from "~/types/itinerary";
import type { ResumeTarget } from "~/fns/retrieval/types";

export const getResumeTarget = (input: {
  confirmation?: BookingConfirmation | null;
  itinerary?: OwnedItinerary | null;
  access?: ItineraryAccessResult | null;
  recoveryState?: RecoveryState | null;
  incomingRefType?: "confirmation" | "itinerary" | "unknown";
}): ResumeTarget => {
  const confirmation = input.confirmation || null;
  const itinerary = input.itinerary || null;
  const access = input.access || null;
  const recoveryState = input.recoveryState || null;
  const incomingRefType = input.incomingRefType || "unknown";

  if (!confirmation && !itinerary) {
    return {
      type: "not_found",
      ref: null,
      reason: "no_record_for_reference",
      requiresClaim: false,
      requiresRecovery: false,
      surface: null,
    };
  }

  if (incomingRefType === "confirmation" && confirmation) {
    if (recoveryState) {
      return {
        type: "recovery",
        ref: confirmation.publicRef,
        reason: "confirmation_recovery_required",
        requiresClaim: false,
        requiresRecovery: true,
        surface: "confirmation",
      };
    }

    return {
      type: "confirmation",
      ref: confirmation.publicRef,
      reason: "confirmation_entrypoint",
      requiresClaim: false,
      requiresRecovery: false,
      surface: "confirmation",
    };
  }

  if (itinerary) {
    if (access?.isClaimable) {
      return {
        type: "claim",
        ref: itinerary.publicRef,
        reason: recoveryState
          ? "itinerary_claimable_with_recovery"
          : "itinerary_claimable",
        requiresClaim: true,
        requiresRecovery: Boolean(recoveryState),
        surface: "itinerary",
      };
    }

    if (recoveryState) {
      return {
        type: "recovery",
        ref: itinerary.publicRef,
        reason: "itinerary_recovery_required",
        requiresClaim: false,
        requiresRecovery: true,
        surface: "itinerary",
      };
    }

    return {
      type: "itinerary",
      ref: itinerary.publicRef,
      reason: access?.isOwner
        ? "itinerary_owned"
        : access && !access.ok
          ? "itinerary_access_denied"
          : "itinerary_available",
      requiresClaim: false,
      requiresRecovery: false,
      surface: "itinerary",
    };
  }

  if (confirmation && recoveryState) {
    return {
      type: "recovery",
      ref: confirmation.publicRef,
      reason: "confirmation_recovery_required",
      requiresClaim: false,
      requiresRecovery: true,
      surface: "confirmation",
    };
  }

  if (confirmation) {
    return {
      type: "confirmation",
      ref: confirmation.publicRef,
      reason: "confirmation_available",
      requiresClaim: false,
      requiresRecovery: false,
      surface: "confirmation",
    };
  }

  return {
    type: "not_found",
    ref: null,
    reason: "no_resume_target",
    requiresClaim: false,
    requiresRecovery: false,
    surface: null,
  };
};
