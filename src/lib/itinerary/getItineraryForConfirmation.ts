import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getItinerary } from "~/lib/itinerary/getItinerary";

export const getItineraryForConfirmation = async (confirmationId: string) => {
  const normalizedId = String(confirmationId || "").trim();
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select({ id: itineraries.id })
      .from(itineraries)
      .where(eq(itineraries.confirmationId, normalizedId))
      .limit(1);

    return row ? getItinerary(row.id) : null;
  });
};

