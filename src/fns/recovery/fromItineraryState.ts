import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import type { RecoveryMetadata, RecoveryState } from "~/types/recovery";

export const fromItineraryState = (input: {
  hasItinerary: boolean;
  itineraryRef?: string | null;
  confirmationRef?: string | null;
  tripHref?: string | null;
  canCreate: boolean;
  failed?: boolean;
  metadata?: RecoveryMetadata;
}): RecoveryState | null => {
  if (input.hasItinerary || !input.failed) return null;

  return buildRecoveryState({
    stage: "itinerary",
    reasonCode: "ITINERARY_CREATE_FAILED",
    metadata: {
      itineraryRef: input.itineraryRef || null,
      confirmationRef: input.confirmationRef || null,
      tripHref: input.tripHref || null,
      hasConfirmedItems: input.canCreate,
      ...input.metadata,
    },
  });
};
