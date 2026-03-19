import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import {
  checkoutTravelerAssignments,
  checkoutTravelerProfiles,
} from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";

export const deleteCheckoutTravelerProfile = async (input: {
  checkoutSessionId: string;
  travelerProfileId: string;
}) => {
  const checkoutSessionId = String(input.checkoutSessionId || "").trim();
  const travelerProfileId = String(input.travelerProfileId || "").trim();
  if (!checkoutSessionId || !travelerProfileId) return false;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db
      .delete(checkoutTravelerAssignments)
      .where(
        and(
          eq(checkoutTravelerAssignments.checkoutSessionId, checkoutSessionId),
          eq(checkoutTravelerAssignments.travelerProfileId, travelerProfileId),
        ),
      );

    const deleted = await db
      .delete(checkoutTravelerProfiles)
      .where(
        and(
          eq(checkoutTravelerProfiles.checkoutSessionId, checkoutSessionId),
          eq(checkoutTravelerProfiles.id, travelerProfileId),
        ),
      )
      .returning({ id: checkoutTravelerProfiles.id });

    return deleted.length > 0;
  });
};
