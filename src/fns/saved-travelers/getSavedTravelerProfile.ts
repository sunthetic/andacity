import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { savedTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { withSavedTravelerDefaults } from "~/fns/saved-travelers/shared";
import type { SavedTravelerProfile } from "~/types/saved-travelers";
import { normalizeTimestamp } from "~/fns/travelers/shared";

type SavedTravelerProfileRow = typeof savedTravelerProfiles.$inferSelect;

export const mapSavedTravelerProfileRow = (
  row: SavedTravelerProfileRow,
): SavedTravelerProfile => {
  return withSavedTravelerDefaults({
    id: row.id,
    ownerUserId: row.ownerUserId,
    status: row.status,
    type: row.type,
    firstName: row.firstName,
    middleName: row.middleName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    email: row.email,
    phone: row.phone,
    nationality: row.nationality,
    documentType: row.documentType,
    documentNumber: row.documentNumber,
    documentExpiryDate: row.documentExpiryDate,
    issuingCountry: row.issuingCountry,
    knownTravelerNumber: row.knownTravelerNumber,
    redressNumber: row.redressNumber,
    driverAge: row.driverAge,
    label: row.label,
    isDefault: row.isDefault,
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
  });
};

export const getSavedTravelerProfile = async (input: {
  id: string;
  ownerUserId?: string | null;
  includeArchived?: boolean;
}): Promise<SavedTravelerProfile | null> => {
  const id = String(input.id || "").trim();
  if (!id) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const conditions = [eq(savedTravelerProfiles.id, id)];
    const ownerUserId = String(input.ownerUserId || "").trim();

    if (ownerUserId) {
      conditions.push(eq(savedTravelerProfiles.ownerUserId, ownerUserId));
    }

    const [row] = await db
      .select()
      .from(savedTravelerProfiles)
      .where(and(...conditions))
      .limit(1);

    if (!row) return null;
    if (!input.includeArchived && row.status === "archived") return null;

    return mapSavedTravelerProfileRow(row);
  });
};
