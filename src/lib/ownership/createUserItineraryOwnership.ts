import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryOwnerships, itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getItineraryOwnershipByItineraryId } from "~/lib/ownership/getItineraryOwnershipByItineraryId";
import {
  createItineraryOwnershipId,
  normalizeTimestamp,
  toNullableText,
} from "~/lib/ownership/shared";
import type { ItineraryOwnership, OwnershipSource } from "~/types/ownership";

type OwnershipDbClient = ReturnType<typeof getDb> | any;

export const createUserItineraryOwnership = async (
  input: {
    itineraryId: string;
    ownerUserId: string;
    ownerSessionId?: string | null;
    source?: OwnershipSource;
    claimedAt?: Date | string | null;
    now?: Date | string | null;
    db?: OwnershipDbClient;
  },
): Promise<ItineraryOwnership> => {
  const itineraryId = toNullableText(input.itineraryId);
  const ownerUserId = toNullableText(input.ownerUserId);

  if (!itineraryId || !ownerUserId) {
    throw new Error("User itinerary ownership requires itinerary and user ids.");
  }

  const timestamp = normalizeTimestamp(input.now) || new Date().toISOString();
  const claimedAt = normalizeTimestamp(input.claimedAt);

  const execute = async (db: OwnershipDbClient) => {
    await db.insert(itineraryOwnerships).values({
      id: createItineraryOwnershipId(),
      itineraryId,
      ownershipMode: "user",
      ownerUserId,
      ownerSessionId: toNullableText(input.ownerSessionId),
      ownerClaimTokenHash: null,
      source: input.source || "confirmation_flow",
      claimedAt: claimedAt ? new Date(claimedAt) : null,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    });

    await db
      .update(itineraries)
      .set({
        ownerUserId,
        ownerSessionId: null,
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
      `User ownership for itinerary ${itineraryId} could not be loaded.`,
    );
  }

  return ownership;
};
