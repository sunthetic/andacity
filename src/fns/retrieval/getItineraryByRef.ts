import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { isItineraryRef, normalizeItineraryRef } from "~/types/itinerary";

export const getItineraryByRef = async (itineraryRef: string) => {
  const normalizedRef = normalizeItineraryRef(itineraryRef);

  if (!isItineraryRef(normalizedRef)) {
    return null;
  }

  return getItineraryByPublicRef(normalizedRef);
};
