import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryOwnerships, itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import { resolveItineraryAccess } from "~/lib/ownership/resolveItineraryAccess";
import {
  normalizeTimestamp,
  toNullableText,
} from "~/lib/ownership/shared";
import { verifyOwnershipClaimToken } from "~/lib/ownership/verifyOwnershipClaimToken";
import type {
  ClaimItineraryOwnershipInput,
  ClaimItineraryOwnershipResult,
} from "~/types/ownership";

export const claimAnonymousItineraryOwnership = async (
  input: ClaimItineraryOwnershipInput,
  deps: {
    getItineraryByPublicRef?: typeof getItineraryByPublicRef;
    getItineraryOwnershipByItineraryId?: typeof getItineraryOwnershipByItineraryId;
    resolveItineraryAccess?: typeof resolveItineraryAccess;
    persistClaimToUser?: (input: {
      itineraryId: string;
      ownerUserId: string;
      claimedAt: string;
      source: NonNullable<ClaimItineraryOwnershipInput["source"]>;
    }) => Promise<void>;
  } = {},
): Promise<ClaimItineraryOwnershipResult> => {
  const ownerUserId = toNullableText(input.ownerUserId);
  if (!ownerUserId) {
    return {
      ok: false,
      reasonCode: "CLAIM_UNAUTHORIZED",
      ownershipMode: null,
      itineraryRef: toNullableText(input.itineraryRef),
      message: "Sign in before claiming this itinerary.",
    };
  }

  const loadItinerary = deps.getItineraryByPublicRef || getItineraryByPublicRef;
  const loadOwnership =
    deps.getItineraryOwnershipByItineraryId || getItineraryOwnershipByItineraryId;
  const checkAccess = deps.resolveItineraryAccess || resolveItineraryAccess;
  const itinerary = await loadItinerary(input.itineraryRef);

  if (!itinerary) {
    return {
      ok: false,
      reasonCode: "CLAIM_NOT_AVAILABLE",
      ownershipMode: null,
      itineraryRef: null,
      message: "This itinerary does not exist.",
    };
  }

  const ownership =
    itinerary.ownership || (await loadOwnership(itinerary.id));
  if (!ownership) {
    return {
      ok: false,
      reasonCode: "CLAIM_NOT_AVAILABLE",
      ownershipMode: null,
      itineraryRef: itinerary.publicRef,
      message: "This itinerary cannot be claimed yet.",
    };
  }

  if (ownership.ownershipMode === "user") {
    return {
      ok: ownership.ownerUserId === ownerUserId,
      reasonCode: "CLAIM_ALREADY_OWNED",
      ownershipMode: ownership.ownershipMode,
      itineraryRef: itinerary.publicRef,
      message:
        ownership.ownerUserId === ownerUserId
          ? "This itinerary is already attached to your account."
          : "This itinerary is already attached to another account.",
    };
  }

  const claimToken = toNullableText(input.claimToken);
  const access = await checkAccess(itinerary.publicRef, {
    ownerUserId,
    ownerSessionId: input.ownerSessionId || null,
    claimTokensByItineraryRef: claimToken
      ? { [itinerary.publicRef]: claimToken }
      : {},
  });

  if (!access.isClaimable) {
    const hasInvalidExplicitToken =
      Boolean(claimToken) &&
      Boolean(ownership.ownerClaimTokenHash) &&
      !verifyOwnershipClaimToken(claimToken, ownership.ownerClaimTokenHash);

    return {
      ok: false,
      reasonCode: hasInvalidExplicitToken
        ? "CLAIM_INVALID_TOKEN"
        : "CLAIM_NOT_AVAILABLE",
      ownershipMode: ownership.ownershipMode,
      itineraryRef: itinerary.publicRef,
      message: hasInvalidExplicitToken
        ? "This itinerary claim token is invalid."
        : "This itinerary is not available to claim from the current context.",
    };
  }

  const timestamp = normalizeTimestamp(input.now) || new Date().toISOString();

  const persistClaimToUser =
    deps.persistClaimToUser ||
    (async (persistInput: {
      itineraryId: string;
      ownerUserId: string;
      claimedAt: string;
      source: NonNullable<ClaimItineraryOwnershipInput["source"]>;
    }) => {
      // Keep the ownership bridge canonical and only mirror current-owner summary fields onto itineraries.
      await withCheckoutSchemaGuard(async () => {
        const db = getDb();

        await db
          .update(itineraryOwnerships)
          .set({
            ownershipMode: "user",
            ownerUserId: persistInput.ownerUserId,
            source: persistInput.source,
            claimedAt: new Date(persistInput.claimedAt),
            updatedAt: new Date(persistInput.claimedAt),
          })
          .where(eq(itineraryOwnerships.itineraryId, persistInput.itineraryId));

        await db
          .update(itineraries)
          .set({
            ownerUserId: persistInput.ownerUserId,
            ownerSessionId: null,
            updatedAt: new Date(persistInput.claimedAt),
          })
          .where(eq(itineraries.id, persistInput.itineraryId));
      });
    });

  await persistClaimToUser({
    itineraryId: itinerary.id,
    ownerUserId,
    claimedAt: timestamp,
    source: input.source || "manual_claim",
  });

  return {
    ok: true,
    reasonCode: "CLAIM_SUCCEEDED",
    ownershipMode: "user",
    itineraryRef: itinerary.publicRef,
    message: "This itinerary is now attached to your account.",
  };
};
