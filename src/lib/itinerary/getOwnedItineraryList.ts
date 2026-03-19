import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraries } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { buildItinerarySummary } from "~/lib/itinerary/buildItinerarySummary";
import { mapItineraryRow } from "~/lib/itinerary/getItinerary";
import type { ItineraryStatus, ItinerarySummary } from "~/types/itinerary";

export const getOwnedItineraryList = async (filters: {
  ownerUserId?: string | null;
  ownerSessionId?: string | null;
  statuses?: ItineraryStatus[];
} = {}): Promise<ItinerarySummary[]> => {
  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const predicates = [];

    if (filters.ownerUserId) {
      predicates.push(eq(itineraries.ownerUserId, filters.ownerUserId));
    }

    if (filters.ownerSessionId) {
      predicates.push(eq(itineraries.ownerSessionId, filters.ownerSessionId));
    }

    if (filters.statuses?.length) {
      predicates.push(inArray(itineraries.status, filters.statuses));
    }

    const rows = await db
      .select()
      .from(itineraries)
      .where(predicates.length ? and(...predicates) : undefined)
      .orderBy(desc(itineraries.updatedAt), desc(itineraries.createdAt));

    return rows.map((row) => {
      const itinerary = mapItineraryRow(row, []);
      const summaryFromJson = itinerary.summaryJson;

      if (summaryFromJson) {
        return {
          itineraryId: itinerary.id,
          publicRef: itinerary.publicRef,
          tripId: itinerary.tripId,
          confirmationId: itinerary.confirmationId,
          status: itinerary.status,
          statusLabel: String(summaryFromJson.statusLabel || "Active"),
          statusDescription: String(
            summaryFromJson.statusDescription ||
              "This itinerary is part of the durable owned-booking record.",
          ),
          currency: itinerary.currency,
          itemCount: Number(summaryFromJson.itemCount) || 0,
          title: String(summaryFromJson.title || "Booked itinerary"),
          locationSummary:
            typeof summaryFromJson.locationSummary === "string"
              ? summaryFromJson.locationSummary
              : null,
          startAt:
            typeof summaryFromJson.startAt === "string"
              ? summaryFromJson.startAt
              : null,
          endAt:
            typeof summaryFromJson.endAt === "string"
              ? summaryFromJson.endAt
              : null,
          ownerUserId: itinerary.ownerUserId,
          ownerSessionId: itinerary.ownerSessionId,
          createdAt: itinerary.createdAt,
          updatedAt: itinerary.updatedAt,
        };
      }

      return buildItinerarySummary(itinerary);
    });
  });
};

