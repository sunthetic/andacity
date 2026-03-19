import { getItineraryDisplayStatus } from "~/lib/itinerary/getItineraryDisplayStatus";
import type {
  ItinerarySummary,
  OwnedItinerary,
  OwnedItineraryItem,
} from "~/types/itinerary";
import type { ItineraryAccessResult } from "~/types/ownership";

const compactParts = (parts: Array<string | null | undefined>) => {
  const values = parts
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  return values.length ? values.join(" · ") : null;
};

const deriveRange = (items: OwnedItineraryItem[]) => {
  const starts = items
    .map((item) => item.startAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const ends = items
    .map((item) => item.endAt || item.startAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    startAt: starts[0] || null,
    endAt: ends[ends.length - 1] || null,
  };
};

export const buildItinerarySummary = (
  itinerary: Pick<
    OwnedItinerary,
    | "id"
    | "publicRef"
    | "tripId"
    | "confirmationId"
    | "status"
    | "currency"
    | "ownerUserId"
    | "ownerSessionId"
    | "createdAt"
    | "updatedAt"
    | "ownership"
  > & {
    items: OwnedItineraryItem[];
  },
  options: {
    access?: ItineraryAccessResult | null;
    hasCurrentUser?: boolean;
  } = {},
): ItinerarySummary => {
  const display = getItineraryDisplayStatus(itinerary.status);
  const range = deriveRange(itinerary.items);
  const locationSummary = compactParts(
    Array.from(
      new Set(
        itinerary.items
          .map((item) => item.locationSummary)
          .filter((value): value is string => Boolean(value)),
      ),
    ).slice(0, 2),
  );
  const ownershipMode =
    itinerary.ownership?.ownershipMode ||
    (itinerary.ownerUserId
      ? "user"
      : itinerary.ownerSessionId
        ? "anonymous"
        : null);

  return {
    itineraryId: itinerary.id,
    publicRef: itinerary.publicRef,
    tripId: itinerary.tripId,
    confirmationId: itinerary.confirmationId,
    status: itinerary.status,
    statusLabel: display.label,
    statusDescription: display.description,
    currency: itinerary.currency,
    ownershipMode,
    isOwnedByCurrentContext: Boolean(options.access?.isOwner),
    isClaimable: Boolean(options.access?.isClaimable),
    canAttachToUser: Boolean(options.access?.isClaimable && options.hasCurrentUser),
    itemCount: itinerary.items.length,
    title:
      itinerary.items.length === 1
        ? itinerary.items[0]?.title || "Booked itinerary"
        : `${itinerary.items.length} booked items`,
    locationSummary,
    startAt: range.startAt,
    endAt: range.endAt,
    ownerUserId: itinerary.ownerUserId,
    ownerSessionId: itinerary.ownerSessionId,
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
  };
};
