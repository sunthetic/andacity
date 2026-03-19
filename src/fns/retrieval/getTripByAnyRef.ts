import { getBookingConfirmation } from "~/lib/confirmation/getBookingConfirmation";
import { getItineraryForConfirmation } from "~/lib/itinerary/getItineraryForConfirmation";
import {
  isConfirmationRef,
  normalizeConfirmationRef,
} from "~/types/confirmation";
import { isItineraryRef, normalizeItineraryRef } from "~/types/itinerary";
import { getConfirmationByRef } from "~/fns/retrieval/getConfirmationByRef";
import { getItineraryByRef } from "~/fns/retrieval/getItineraryByRef";
import type { TripByAnyRefResult } from "~/fns/retrieval/types";

const normalizeIncomingRef = (value: string) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

const detectRefType = (
  ref: string,
): TripByAnyRefResult["incomingRefType"] => {
  if (isConfirmationRef(ref)) return "confirmation";
  if (isItineraryRef(ref)) return "itinerary";
  return "unknown";
};

export const getTripByAnyRef = async (
  incomingRef: string,
  deps: {
    getConfirmationByRef?: typeof getConfirmationByRef;
    getItineraryByRef?: typeof getItineraryByRef;
    getItineraryForConfirmation?: typeof getItineraryForConfirmation;
    getBookingConfirmation?: typeof getBookingConfirmation;
  } = {},
): Promise<TripByAnyRefResult> => {
  const normalizedRef = normalizeIncomingRef(incomingRef);
  const incomingRefType = detectRefType(normalizedRef);

  const loadConfirmationByRef = deps.getConfirmationByRef || getConfirmationByRef;
  const loadItineraryByRef = deps.getItineraryByRef || getItineraryByRef;
  const loadItineraryForConfirmation =
    deps.getItineraryForConfirmation || getItineraryForConfirmation;
  const loadConfirmationById =
    deps.getBookingConfirmation || getBookingConfirmation;

  let confirmation = null;
  let itinerary = null;

  if (incomingRefType === "confirmation") {
    confirmation = await loadConfirmationByRef(normalizeConfirmationRef(normalizedRef));

    if (confirmation) {
      itinerary = confirmation.summaryJson?.itineraryRef
        ? await loadItineraryByRef(
            normalizeItineraryRef(confirmation.summaryJson.itineraryRef),
          )
        : null;

      if (!itinerary) {
        itinerary = await loadItineraryForConfirmation(confirmation.id);
      }
    }
  } else if (incomingRefType === "itinerary") {
    itinerary = await loadItineraryByRef(normalizeItineraryRef(normalizedRef));

    if (itinerary?.confirmationId) {
      confirmation = await loadConfirmationById(itinerary.confirmationId);
    }
  } else {
    const [maybeConfirmation, maybeItinerary] = await Promise.all([
      loadConfirmationByRef(normalizedRef),
      loadItineraryByRef(normalizedRef),
    ]);

    confirmation = maybeConfirmation;
    itinerary = maybeItinerary;

    if (!itinerary && confirmation) {
      itinerary = await loadItineraryForConfirmation(confirmation.id);
    }

    if (!confirmation && itinerary?.confirmationId) {
      confirmation = await loadConfirmationById(itinerary.confirmationId);
    }
  }

  const matchedRefType = itinerary
    ? "itinerary"
    : confirmation
      ? "confirmation"
      : null;

  return {
    incomingRef: normalizedRef,
    incomingRefType,
    matchedRefType,
    confirmation,
    itinerary,
  };
};
