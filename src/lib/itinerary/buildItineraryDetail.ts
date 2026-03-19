import { buildItinerarySummary } from "~/lib/itinerary/buildItinerarySummary";
import { getItineraryDisplayStatus } from "~/lib/itinerary/getItineraryDisplayStatus";
import { getItineraryItemDisplayFields } from "~/lib/itinerary/getItineraryItemDisplayFields";
import type { ItineraryDetail, OwnedItinerary } from "~/types/itinerary";

export const buildItineraryDetail = (itinerary: OwnedItinerary): ItineraryDetail => {
  const summary = buildItinerarySummary(itinerary);
  const display = getItineraryDisplayStatus(itinerary.status);

  return {
    itineraryId: itinerary.id,
    publicRef: itinerary.publicRef,
    tripId: itinerary.tripId,
    tripHref: itinerary.tripId ? `/trips/${itinerary.tripId}` : null,
    status: itinerary.status,
    statusLabel: display.label,
    statusDescription: display.description,
    currency: itinerary.currency,
    confirmationId: itinerary.confirmationId,
    checkoutSessionId: itinerary.checkoutSessionId,
    paymentSessionId: itinerary.paymentSessionId,
    bookingRunId: itinerary.bookingRunId,
    owner: {
      ownerUserId: itinerary.ownerUserId,
      ownerSessionId: itinerary.ownerSessionId,
    },
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
    summary,
    items: itinerary.items.map((item) => ({
      ...item,
      display: getItineraryItemDisplayFields(item),
    })),
  };
};

