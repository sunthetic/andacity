import { getOwnedItineraryList } from "~/lib/itinerary/getOwnedItineraryList";
import type { RecentItineraryList } from "~/fns/retrieval/types";
import type { ItineraryStatus } from "~/types/itinerary";

const normalizeLimit = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3;
  return Math.min(20, Math.floor(parsed));
};

export const getRecentSessionItineraries = async (
  ownerSessionId: string,
  options: {
    limit?: number;
    statuses?: ItineraryStatus[];
  } = {},
): Promise<RecentItineraryList> => {
  const normalizedSessionId = String(ownerSessionId || "").trim();

  if (!normalizedSessionId) {
    return {
      ownerType: "session",
      ownerId: "",
      itineraries: [],
    };
  }

  const itineraries = await getOwnedItineraryList({
    ownerSessionId: normalizedSessionId,
    statuses: options.statuses,
  });

  return {
    ownerType: "session",
    ownerId: normalizedSessionId,
    itineraries: itineraries.slice(0, normalizeLimit(options.limit)),
  };
};
