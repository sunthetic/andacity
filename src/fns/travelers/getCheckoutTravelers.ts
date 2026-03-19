import { asc, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { checkoutTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import type { CheckoutTravelerProfile } from "~/types/travelers";
import {
  normalizeTimestamp,
  withProfileDefaults,
} from "~/fns/travelers/shared";

type CheckoutTravelerProfileRow = typeof checkoutTravelerProfiles.$inferSelect;

const mapCheckoutTravelerProfileRow = (
  row: CheckoutTravelerProfileRow,
): CheckoutTravelerProfile => {
  return withProfileDefaults({
    id: row.id,
    checkoutSessionId: row.checkoutSessionId,
    type: row.type,
    role: row.role,
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
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
  });
};

export const getCheckoutTravelers = async (
  checkoutSessionId: string,
): Promise<CheckoutTravelerProfile[]> => {
  const normalizedId = String(checkoutSessionId || "").trim();
  if (!normalizedId) return [];

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(checkoutTravelerProfiles)
      .where(eq(checkoutTravelerProfiles.checkoutSessionId, normalizedId))
      .orderBy(
        asc(checkoutTravelerProfiles.createdAt),
        asc(checkoutTravelerProfiles.id),
      );

    return rows.map((row) => mapCheckoutTravelerProfileRow(row));
  });
};
