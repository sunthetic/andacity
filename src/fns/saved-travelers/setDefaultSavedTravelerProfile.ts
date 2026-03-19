import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { savedTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getSavedTravelerProfile } from "~/fns/saved-travelers/getSavedTravelerProfile";
import { SavedTravelerProfileError } from "~/fns/saved-travelers/shared";
import type { SavedTravelerProfile } from "~/types/saved-travelers";
import { normalizeTimestamp, toNullableText } from "~/fns/travelers/shared";

export const setDefaultSavedTravelerProfile = async (input: {
  id: string;
  ownerUserId: string;
  now?: Date | string | null;
}): Promise<SavedTravelerProfile> => {
  const id = String(input.id || "").trim();
  const ownerUserId = toNullableText(input.ownerUserId);

  if (!id || !ownerUserId) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_UNAUTHORIZED",
      "Saved traveler profiles require an authenticated account context.",
    );
  }

  const existing = await getSavedTravelerProfile({
    id,
    ownerUserId,
    includeArchived: false,
  });
  if (!existing) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      "Active saved traveler profile could not be found.",
    );
  }

  const now = normalizeTimestamp(input.now);

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx
        .update(savedTravelerProfiles)
        .set({
          isDefault: false,
          updatedAt: new Date(now),
        })
        .where(eq(savedTravelerProfiles.ownerUserId, ownerUserId));

      await tx
        .update(savedTravelerProfiles)
        .set({
          isDefault: true,
          status: "active",
          updatedAt: new Date(now),
        })
        .where(
          and(
            eq(savedTravelerProfiles.id, id),
            eq(savedTravelerProfiles.ownerUserId, ownerUserId),
          ),
        );
    });
  });

  const updated = await getSavedTravelerProfile({
    id,
    ownerUserId,
    includeArchived: false,
  });
  if (!updated) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      "Saved traveler profile could not be loaded after setting default.",
    );
  }

  return updated;
};
