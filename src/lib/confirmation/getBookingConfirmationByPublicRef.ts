import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { bookingConfirmations } from "~/lib/db/schema";
import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";

export const getBookingConfirmationByPublicRef = async (publicRef: string) => {
  const normalizedRef = String(publicRef || "").trim().toUpperCase();
  if (!normalizedRef) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select({ id: bookingConfirmations.id })
      .from(bookingConfirmations)
      .where(eq(bookingConfirmations.publicRef, normalizedRef))
      .limit(1);

    return row ? getBookingConfirmation(row.id) : null;
  });
};
