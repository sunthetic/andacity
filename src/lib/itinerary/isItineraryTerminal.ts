import type { ItineraryStatus } from "~/types/itinerary";

export const isItineraryTerminal = (status: ItineraryStatus) => {
  return (
    status === "completed" || status === "canceled" || status === "archived"
  );
};

