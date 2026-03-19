import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import { verifyOwnershipClaimToken } from "~/lib/ownership/verifyOwnershipClaimToken";
import { toNullableText } from "~/lib/ownership/shared";
import type {
  CurrentOwnershipContext,
  ItineraryAccessResult,
} from "~/types/ownership";

export const resolveItineraryAccess = async (
  itineraryRef: string,
  context: CurrentOwnershipContext,
  deps: {
    getItineraryByPublicRef?: typeof getItineraryByPublicRef;
    getItineraryOwnershipByItineraryId?: typeof getItineraryOwnershipByItineraryId;
  } = {},
): Promise<ItineraryAccessResult> => {
  const loadItinerary = deps.getItineraryByPublicRef || getItineraryByPublicRef;
  const loadOwnership =
    deps.getItineraryOwnershipByItineraryId || getItineraryOwnershipByItineraryId;
  const itinerary = await loadItinerary(itineraryRef);

  if (!itinerary) {
    return {
      ok: false,
      reasonCode: "NOT_FOUND",
      ownershipMode: null,
      isOwner: false,
      isClaimable: false,
      itineraryRef: null,
      message: "This itinerary could not be found.",
    };
  }

  const ownership =
    itinerary.ownership || (await loadOwnership(itinerary.id));

  if (!ownership) {
    return {
      ok: false,
      reasonCode: "UNAUTHORIZED",
      ownershipMode: null,
      isOwner: false,
      isClaimable: false,
      itineraryRef: itinerary.publicRef,
      message: "This itinerary does not have an ownership bridge yet.",
    };
  }

  const ownerUserId = toNullableText(context.ownerUserId);
  const ownerSessionId = toNullableText(context.ownerSessionId);
  const claimToken = toNullableText(
    context.claimTokensByItineraryRef?.[itinerary.publicRef],
  );
  const hasValidClaimToken =
    Boolean(ownership.ownerClaimTokenHash) &&
    Boolean(claimToken) &&
    verifyOwnershipClaimToken(claimToken, ownership.ownerClaimTokenHash);

  if (ownership.ownershipMode === "user") {
    if (ownerUserId && ownership.ownerUserId === ownerUserId) {
      return {
        ok: true,
        reasonCode: "OWNER_MATCH",
        ownershipMode: ownership.ownershipMode,
        isOwner: true,
        isClaimable: false,
        itineraryRef: itinerary.publicRef,
        message: "You own this itinerary.",
      };
    }

    return {
      ok: false,
      reasonCode: ownerUserId ? "ALREADY_CLAIMED_BY_USER" : "UNAUTHORIZED",
      ownershipMode: ownership.ownershipMode,
      isOwner: false,
      isClaimable: false,
      itineraryRef: itinerary.publicRef,
      message: ownerUserId
        ? "This itinerary is already attached to a different user."
        : "Sign in with the owning account to access this itinerary.",
    };
  }

  const sessionMatches =
    Boolean(ownerSessionId) &&
    Boolean(ownership.ownerSessionId) &&
    ownership.ownerSessionId === ownerSessionId;

  if (sessionMatches && !ownerUserId) {
    return {
      ok: true,
      reasonCode: "OWNER_MATCH",
      ownershipMode: ownership.ownershipMode,
      isOwner: true,
      isClaimable: false,
      itineraryRef: itinerary.publicRef,
      message: "This itinerary is saved to your anonymous ownership session.",
    };
  }

  if (sessionMatches || hasValidClaimToken) {
    return {
      ok: true,
      reasonCode: "CLAIMABLE_ANONYMOUS_ITINERARY",
      ownershipMode: ownership.ownershipMode,
      isOwner: false,
      isClaimable: true,
      itineraryRef: itinerary.publicRef,
      message: ownerUserId
        ? "This anonymous itinerary can be attached to your account."
        : "This anonymous itinerary can be claimed after you sign in.",
    };
  }

  return {
    ok: false,
    reasonCode: ownership.ownerSessionId ? "SESSION_MISMATCH" : "UNAUTHORIZED",
    ownershipMode: ownership.ownershipMode,
    isOwner: false,
    isClaimable: false,
    itineraryRef: itinerary.publicRef,
    message: ownership.ownerSessionId
      ? "This itinerary belongs to a different anonymous ownership session."
      : "You do not have access to this itinerary.",
  };
};
