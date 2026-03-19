import { buildItineraryStatus } from "~/lib/itinerary/buildItineraryStatus";
import { buildItinerarySummary } from "~/lib/itinerary/buildItinerarySummary";
import { mapConfirmationItemToItineraryItem } from "~/lib/itinerary/mapConfirmationItemToItineraryItem";
import {
  createItineraryId,
  normalizeCurrencyCode,
  normalizeTimestamp,
} from "~/lib/itinerary/shared";
import type { CreateItineraryFromConfirmationInput } from "~/types/itinerary";

export const mapConfirmationToItinerary = (
  input: CreateItineraryFromConfirmationInput & {
    itineraryId?: string | null;
    publicRef: string;
  },
) => {
  const itineraryId = input.itineraryId || createItineraryId();
  const timestamp =
    normalizeTimestamp(input.now) ||
    input.confirmation.updatedAt ||
    input.confirmation.createdAt ||
    new Date().toISOString();
  const bookingItemsById = new Map(
    input.bookingRun.itemExecutions.map((item) => [item.id, item]),
  );
  const items = input.confirmation.items.map((confirmationItem) =>
    mapConfirmationItemToItineraryItem({
      itineraryId,
      confirmationItem,
      bookingItemExecution:
        bookingItemsById.get(confirmationItem.bookingItemExecutionId) || null,
      checkoutSession: input.checkoutSession,
      now: timestamp,
    }),
  );
  const status = buildItineraryStatus({
    confirmationStatus: input.confirmation.status,
    confirmationItems: input.confirmation.items,
    itineraryItems: items,
    now: timestamp,
  });

  const itinerary = {
    id: itineraryId,
    publicRef: input.publicRef,
    tripId: input.confirmation.tripId,
    checkoutSessionId: input.confirmation.checkoutSessionId,
    paymentSessionId: input.confirmation.paymentSessionId,
    bookingRunId: input.confirmation.bookingRunId,
    confirmationId: input.confirmation.id,
    status,
    currency:
      normalizeCurrencyCode(input.confirmation.currency) ||
      normalizeCurrencyCode(input.checkoutSession.currencyCode) ||
      normalizeCurrencyCode(input.paymentSession.currency),
    summaryJson: null,
    ownerUserId: input.ownerUserId ?? null,
    ownerSessionId: input.ownerSessionId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ownership: null,
    items,
  };

  return {
    itinerary: {
      ...itinerary,
      summaryJson: buildItinerarySummary(itinerary),
    },
    items,
  };
};
