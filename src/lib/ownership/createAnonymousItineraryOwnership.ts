import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryOwnerships, itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { createOwnershipClaimToken } from "~/lib/ownership/createOwnershipClaimToken";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import { hashOwnershipClaimToken } from "~/lib/ownership/hashOwnershipClaimToken";
import {
  createItineraryOwnershipId,
  normalizeTimestamp,
  toNullableText,
} from "~/lib/ownership/shared";
import type { ItineraryOwnership, OwnershipSource } from "~/types/ownership";

type OwnershipDbClient = ReturnType<typeof getDb> | any;

export const createAnonymousItineraryOwnership = async (
  input: {
    itineraryId: string;
    ownerSessionId?: string | null;
    source?: OwnershipSource;
    now?: Date | string | null;
    db?: OwnershipDbClient;
  },
): Promise<{
  ownership: ItineraryOwnership;
  claimToken: string;
}> => {
  const itineraryId = toNullableText(input.itineraryId);
  if (!itineraryId) {
    throw new Error("Anonymous itinerary ownership requires an itinerary id.");
  }

  const timestamp = normalizeTimestamp(input.now) || new Date().toISOString();
  const claimToken = createOwnershipClaimToken();
  const ownerClaimTokenHash = hashOwnershipClaimToken(claimToken);

  const execute = async (db: OwnershipDbClient) => {
    await db.insert(itineraryOwnerships).values({
      id: createItineraryOwnershipId(),
      itineraryId,
      ownershipMode: "anonymous",
      ownerUserId: null,
      ownerSessionId: toNullableText(input.ownerSessionId),
      ownerClaimTokenHash,
      source: input.source || "confirmation_flow",
      claimedAt: null,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    });

    await db
      .update(itineraries)
      .set({
        ownerUserId: null,
        ownerSessionId: toNullableText(input.ownerSessionId),
        updatedAt: new Date(timestamp),
      })
      .where(eq(itineraries.id, itineraryId));
  };

  if (input.db) {
    await execute(input.db);
  } else {
    await withCheckoutSchemaGuard(async () => {
      await execute(getDb());
    });
  }

  const ownership = await getItineraryOwnershipByItineraryId(itineraryId);
  if (!ownership) {
    throw new Error(
      `Anonymous ownership for itinerary ${itineraryId} could not be loaded.`,
    );
  }

  return {
    ownership,
    claimToken,
  };
};
