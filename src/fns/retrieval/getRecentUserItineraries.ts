import { getOwnedItineraryList } from "~/lib/itinerary/getOwnedItineraryList";
import type { RecentItineraryList } from "~/fns/retrieval/types";
import type { ItineraryStatus } from "~/types/itinerary";

const normalizeLimit = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 3;
  return Math.min(20, Math.floor(parsed));
};

export const getRecentUserItineraries = async (
  ownerUserId: string,
  options: {
    limit?: number;
    statuses?: ItineraryStatus[];
  } = {},
): Promise<RecentItineraryList> => {
  const normalizedOwnerId = String(ownerUserId || "").trim();

  if (!normalizedOwnerId) {
    return {
      ownerType: "user",
      ownerId: "",
      itineraries: [],
    };
  }

  const itineraries = await getOwnedItineraryList({
    ownerUserId: normalizedOwnerId,
    statuses: options.statuses,
  });

  return {
    ownerType: "user",
    ownerId: normalizedOwnerId,
    itineraries: itineraries.slice(0, normalizeLimit(options.limit)),
  };
};
