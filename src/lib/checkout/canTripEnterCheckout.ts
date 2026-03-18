import { getTripCheckoutReadiness } from "~/lib/checkout/getTripCheckoutReadiness";
import type { TripDetails } from "~/types/trips/trip";

export const canTripEnterCheckout = (trip: TripDetails | null | undefined) => {
  return getTripCheckoutReadiness(trip).isReady;
};
