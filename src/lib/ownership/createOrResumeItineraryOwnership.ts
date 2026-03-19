import { createAnonymousItineraryOwnership } from "~/lib/ownership/createAnonymousItineraryOwnership";
import { createUserItineraryOwnership } from "~/lib/ownership/createUserItineraryOwnership";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import { toNullableText } from "~/lib/ownership/shared";
import type { ItineraryOwnership, OwnershipSource } from "~/types/ownership";

export const createOrResumeItineraryOwnership = async (
  input: {
    itineraryId: string;
    ownerUserId?: string | null;
    ownerSessionId?: string | null;
    source?: OwnershipSource;
    now?: Date | string | null;
    db?: any;
  },
  deps: {
    getItineraryOwnershipByItineraryId?: typeof getItineraryOwnershipByItineraryId;
    createAnonymousItineraryOwnership?: typeof createAnonymousItineraryOwnership;
    createUserItineraryOwnership?: typeof createUserItineraryOwnership;
  } = {},
): Promise<{
  ownership: ItineraryOwnership;
  claimToken: string | null;
  created: boolean;
}> => {
  const itineraryId = toNullableText(input.itineraryId);
  if (!itineraryId) {
    throw new Error("Itinerary ownership requires an itinerary id.");
  }

  const loadOwnership =
    deps.getItineraryOwnershipByItineraryId || getItineraryOwnershipByItineraryId;
  const createAnonymous =
    deps.createAnonymousItineraryOwnership || createAnonymousItineraryOwnership;
  const createUser =
    deps.createUserItineraryOwnership || createUserItineraryOwnership;

  const existing = await loadOwnership(itineraryId);
  if (existing) {
    return {
      ownership: existing,
      claimToken: null,
      created: false,
    };
  }

  const ownerUserId = toNullableText(input.ownerUserId);
  if (ownerUserId) {
    const ownership = await createUser({
      itineraryId,
      ownerUserId,
      ownerSessionId: input.ownerSessionId,
      source: input.source || "confirmation_flow",
      now: input.now,
      db: input.db,
    });

    return {
      ownership,
      claimToken: null,
      created: true,
    };
  }

  const created = await createAnonymous({
    itineraryId,
    ownerSessionId: input.ownerSessionId,
    source: input.source || "confirmation_flow",
    now: input.now,
    db: input.db,
  });

  return {
    ownership: created.ownership,
    claimToken: created.claimToken,
    created: true,
  };
};
