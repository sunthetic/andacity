import type { ItineraryAccessResult } from "~/types/ownership";

export const canClaimItinerary = (result: ItineraryAccessResult | null) => {
  return Boolean(result?.isClaimable);
};
