import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraryOwnerships, itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  normalizeOwnershipMode,
  normalizeOwnershipSource,
  normalizeTimestamp,
  toNullableText,
} from "~/lib/ownership/shared";
import type { ItineraryOwnership } from "~/types/ownership";

type ItineraryOwnershipRow = typeof itineraryOwnerships.$inferSelect;

export const mapItineraryOwnershipRow = (
  row: ItineraryOwnershipRow,
): ItineraryOwnership => {
  return {
    id: row.id,
    itineraryId: row.itineraryId,
    ownershipMode: normalizeOwnershipMode(row.ownershipMode),
    ownerUserId: toNullableText(row.ownerUserId),
    ownerSessionId: toNullableText(row.ownerSessionId),
    ownerClaimTokenHash: toNullableText(row.ownerClaimTokenHash),
    source: normalizeOwnershipSource(row.source),
    claimedAt: normalizeTimestamp(row.claimedAt),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
  };
};

const resolveLegacyOwnershipMode = (input: {
  ownerUserId: string | null;
  ownerSessionId: string | null;
}) => {
  return input.ownerUserId ? "user" : "anonymous";
};

export const getItineraryOwnership = async (
  ownershipId: string,
): Promise<ItineraryOwnership | null> => {
  const normalizedId = toNullableText(ownershipId);
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(itineraryOwnerships)
      .where(eq(itineraryOwnerships.id, normalizedId))
      .limit(1);

    return row ? mapItineraryOwnershipRow(row) : null;
  });
};

export const getLegacyItineraryOwnershipSeed = async (itineraryId: string) => {
  const normalizedId = toNullableText(itineraryId);
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select({
        itineraryId: itineraries.id,
        ownerUserId: itineraries.ownerUserId,
        ownerSessionId: itineraries.ownerSessionId,
        createdAt: itineraries.createdAt,
        updatedAt: itineraries.updatedAt,
      })
      .from(itineraries)
      .where(eq(itineraries.id, normalizedId))
      .limit(1);

    if (!row) return null;

    return {
      itineraryId: row.itineraryId,
      ownershipMode: resolveLegacyOwnershipMode({
        ownerUserId: toNullableText(row.ownerUserId),
        ownerSessionId: toNullableText(row.ownerSessionId),
      }),
      ownerUserId: toNullableText(row.ownerUserId),
      ownerSessionId: toNullableText(row.ownerSessionId),
      createdAt: normalizeTimestamp(row.createdAt),
      updatedAt: normalizeTimestamp(row.updatedAt),
    };
  });
};
