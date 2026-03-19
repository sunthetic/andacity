import type { RequestEventBase } from "@builder.io/qwik-city";
import { attachAnonymousOwnershipsToUser } from "~/lib/ownership/attachAnonymousOwnershipsToUser";
import { claimAnonymousItineraryOwnership } from "~/lib/ownership/claimAnonymousItineraryOwnership";
import {
  clearOwnershipClaimToken,
  getCurrentOwnershipContext,
} from "~/lib/ownership/getCurrentOwnershipContext";

export const claimItineraryOwnership = async (
  itineraryRef: string,
  event: Pick<RequestEventBase, "cookie" | "request" | "sharedMap" | "url">,
) => {
  const normalizedRef = String(itineraryRef || "")
    .trim()
    .toUpperCase();
  const context = getCurrentOwnershipContext(event);
  const result = await claimAnonymousItineraryOwnership({
    itineraryRef: normalizedRef,
    claimToken: context.claimTokensByItineraryRef[normalizedRef] || null,
    ownerUserId: context.ownerUserId,
    ownerSessionId: context.ownerSessionId,
    source: "manual_claim",
  });

  if (result.ok && result.itineraryRef) {
    clearOwnershipClaimToken(event, result.itineraryRef);
  }

  return result;
};

export const attachAnonymousItinerariesToCurrentUser = async (
  event: Pick<RequestEventBase, "cookie" | "request" | "sharedMap" | "url">,
) => {
  const context = getCurrentOwnershipContext(event);
  const result = await attachAnonymousOwnershipsToUser({
    ownerUserId: context.ownerUserId,
    ownerSessionId: context.ownerSessionId,
    claimTokensByItineraryRef: context.claimTokensByItineraryRef,
  });

  for (const itineraryRef of result.attachedItineraryRefs) {
    clearOwnershipClaimToken(event, itineraryRef);
  }

  return result;
};
