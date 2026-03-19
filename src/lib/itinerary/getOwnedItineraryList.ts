import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraries, itineraryOwnerships } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { buildItinerarySummary } from "~/lib/itinerary/buildItinerarySummary";
import { mapItineraryRow } from "~/lib/itinerary/getItinerary";
import { mapItineraryOwnershipRow } from "~/lib/ownership/getItineraryOwnership";
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
      predicates.push(eq(itineraryOwnerships.ownerUserId, filters.ownerUserId));
    }

    if (filters.ownerSessionId) {
      predicates.push(
        eq(itineraryOwnerships.ownerSessionId, filters.ownerSessionId),
      );
    }

    if (filters.statuses?.length) {
      predicates.push(inArray(itineraries.status, filters.statuses));
    }

    const rows = await db
      .select({
        itinerary: itineraries,
        ownership: itineraryOwnerships,
      })
      .from(itineraries)
      .leftJoin(
        itineraryOwnerships,
        eq(itineraryOwnerships.itineraryId, itineraries.id),
      )
      .where(predicates.length ? and(...predicates) : undefined)
      .orderBy(desc(itineraries.updatedAt), desc(itineraries.createdAt));

    return rows.map((row) => {
      const itinerary = mapItineraryRow(
        row.itinerary,
        [],
        row.ownership ? mapItineraryOwnershipRow(row.ownership) : null,
      );
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
          ownershipMode: itinerary.ownership?.ownershipMode || null,
          isOwnedByCurrentContext: false,
          isClaimable: false,
          canAttachToUser: false,
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
