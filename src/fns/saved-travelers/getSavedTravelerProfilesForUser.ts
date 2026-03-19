import { and, desc, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { savedTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { mapSavedTravelerProfileRow } from "~/fns/saved-travelers/getSavedTravelerProfile";
import type { SavedTravelerProfile } from "~/types/saved-travelers";

export const getSavedTravelerProfilesForUser = async (input: {
  ownerUserId: string;
  includeArchived?: boolean;
}): Promise<SavedTravelerProfile[]> => {
  const ownerUserId = String(input.ownerUserId || "").trim();
  if (!ownerUserId) return [];

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const conditions = [eq(savedTravelerProfiles.ownerUserId, ownerUserId)];

    if (!input.includeArchived) {
      conditions.push(eq(savedTravelerProfiles.status, "active"));
    }

    const rows = await db
      .select()
      .from(savedTravelerProfiles)
      .where(and(...conditions))
      .orderBy(
        desc(savedTravelerProfiles.isDefault),
        desc(savedTravelerProfiles.updatedAt),
        desc(savedTravelerProfiles.createdAt),
      );

    return rows.map((row) => mapSavedTravelerProfileRow(row));
  });
};
