import type { ItineraryStatus } from "~/types/itinerary";

export const getItineraryDisplayStatus = (status: ItineraryStatus) => {
  switch (status) {
    case "partial":
      return {
        label: "Partially owned",
        description:
          "Only the confirmed items from this booking are part of the durable itinerary.",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        description: "This itinerary is booked and scheduled for future travel.",
      };
    case "in_progress":
      return {
        label: "In progress",
        description: "At least one itinerary item is currently underway.",
      };
    case "completed":
      return {
        label: "Completed",
        description: "All itinerary items have finished.",
      };
    case "canceled":
      return {
        label: "Canceled",
        description: "This itinerary has been canceled.",
      };
    case "archived":
      return {
        label: "Archived",
        description: "This itinerary has been archived for long-term reference.",
      };
    case "active":
      return {
        label: "Active",
        description: "This itinerary is part of the durable owned-booking record.",
      };
    default:
      return {
        label: "Active",
        description: "This itinerary is part of the durable owned-booking record.",
      };
  }
};

