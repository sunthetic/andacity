import type { ItineraryAccessResult } from "~/types/ownership";

export const canAccessItinerary = (result: ItineraryAccessResult | null) => {
  return Boolean(result?.ok && (result.isOwner || result.isClaimable));
};
