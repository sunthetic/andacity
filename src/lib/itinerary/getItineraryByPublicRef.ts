import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getItinerary } from "~/lib/itinerary/getItinerary";

export const getItineraryByPublicRef = async (publicRef: string) => {
  const normalizedRef = String(publicRef || "").trim().toUpperCase();
  if (!normalizedRef) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select({ id: itineraries.id })
      .from(itineraries)
      .where(eq(itineraries.publicRef, normalizedRef))
      .limit(1);

    return row ? getItinerary(row.id) : null;
  });
};

