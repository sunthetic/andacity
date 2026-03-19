import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryOwnerships } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  getLegacyItineraryOwnershipSeed,
  mapItineraryOwnershipRow,
} from "~/lib/ownership/getItineraryOwnership";
import { createAnonymousItineraryOwnership } from "~/lib/ownership/createAnonymousItineraryOwnership";
import { createUserItineraryOwnership } from "~/lib/ownership/createUserItineraryOwnership";
import { toNullableText } from "~/lib/ownership/shared";
import type { ItineraryOwnership } from "~/types/ownership";

export const getItineraryOwnershipByItineraryId = async (
  itineraryId: string,
): Promise<ItineraryOwnership | null> => {
  const normalizedId = toNullableText(itineraryId);
  if (!normalizedId) return null;

  const lookup = async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(itineraryOwnerships)
      .where(eq(itineraryOwnerships.itineraryId, normalizedId))
      .limit(1);

    return row ? mapItineraryOwnershipRow(row) : null;
  };

  const existing = await withCheckoutSchemaGuard(lookup);
  if (existing) {
    return existing;
  }

  // Legacy itinerary rows may still carry summary ownership without a bridge row.
  const legacySeed = await getLegacyItineraryOwnershipSeed(normalizedId);
  if (!legacySeed) return null;

  if (legacySeed.ownershipMode === "user" && legacySeed.ownerUserId) {
    try {
      return await createUserItineraryOwnership({
        itineraryId: normalizedId,
        ownerUserId: legacySeed.ownerUserId,
        ownerSessionId: legacySeed.ownerSessionId,
        source: "confirmation_flow",
        now: legacySeed.updatedAt,
      });
    } catch {
      return getItineraryOwnershipByItineraryId(normalizedId);
    }
  }

  try {
    return (
      await createAnonymousItineraryOwnership({
        itineraryId: normalizedId,
        ownerSessionId: legacySeed.ownerSessionId,
        source: "confirmation_flow",
        now: legacySeed.updatedAt,
      })
    ).ownership;
  } catch {
    return getItineraryOwnershipByItineraryId(normalizedId);
  }
};
