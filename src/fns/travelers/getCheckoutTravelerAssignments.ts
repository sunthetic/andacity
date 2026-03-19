import { asc, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { checkoutTravelerAssignments } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import type { CheckoutTravelerAssignment } from "~/types/travelers";
import { normalizeTimestamp, toNullableText } from "~/fns/travelers/shared";

type CheckoutTravelerAssignmentRow = typeof checkoutTravelerAssignments.$inferSelect;

const mapCheckoutTravelerAssignmentRow = (
  row: CheckoutTravelerAssignmentRow,
): CheckoutTravelerAssignment => {
  return {
    id: row.id,
    checkoutSessionId: row.checkoutSessionId,
    checkoutItemKey: toNullableText(row.checkoutItemKey),
    travelerProfileId: row.travelerProfileId,
    role: row.role,
    isPrimary: Boolean(row.isPrimary),
    createdAt: normalizeTimestamp(row.createdAt),
    updatedAt: normalizeTimestamp(row.updatedAt),
  };
};

export const getCheckoutTravelerAssignments = async (
  checkoutSessionId: string,
): Promise<CheckoutTravelerAssignment[]> => {
  const normalizedId = String(checkoutSessionId || "").trim();
  if (!normalizedId) return [];

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(checkoutTravelerAssignments)
      .where(eq(checkoutTravelerAssignments.checkoutSessionId, normalizedId))
      .orderBy(
        asc(checkoutTravelerAssignments.createdAt),
        asc(checkoutTravelerAssignments.id),
      );

    return rows.map((row) => mapCheckoutTravelerAssignmentRow(row));
  });
};
