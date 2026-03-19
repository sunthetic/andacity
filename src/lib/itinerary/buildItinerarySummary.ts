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

const readNumeric = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readItemCheckoutTotal = (item: OwnedItineraryItem) => {
  const checkoutSnapshot =
    item.detailsJson && typeof item.detailsJson.checkoutSnapshot === "object"
      ? (item.detailsJson.checkoutSnapshot as Record<string, unknown>)
      : null;
  const pricing =
    checkoutSnapshot && typeof checkoutSnapshot.pricing === "object"
      ? (checkoutSnapshot.pricing as Record<string, unknown>)
      : null;
  const value = readNumeric(pricing?.totalAmountCents);

  return value == null ? null : Math.round(value);
};

const readSourceConfirmationStatus = (item: OwnedItineraryItem) => {
  const value = item.detailsJson?.sourceConfirmationStatus;
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized || null;
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
  const totalAmountFromItems = itinerary.items.reduce((acc, item) => {
    const next = readItemCheckoutTotal(item);
    return next == null ? acc : acc + next;
  }, 0);
  const hasItemTotals = itinerary.items.some(
    (item) => readItemCheckoutTotal(item) != null,
  );
  const confirmedItemCount = itinerary.items.filter(
    (item) =>
      item.status === "confirmed" ||
      item.status === "in_progress" ||
      item.status === "completed",
  ).length;
  const manualReviewItemCount = itinerary.items.filter(
    (item) => readSourceConfirmationStatus(item) === "requires_manual_review",
  ).length;
  const pendingItemCount = itinerary.items.filter((item) => {
    return (
      item.status === "pending" &&
      readSourceConfirmationStatus(item) !== "requires_manual_review"
    );
  }).length;
  const failedItemCount = itinerary.items.filter(
    (item) => item.status === "failed" || item.status === "canceled",
  ).length;
  const unresolvedItemCount =
    pendingItemCount + failedItemCount + manualReviewItemCount;
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
    totalAmountCents: hasItemTotals ? totalAmountFromItems : null,
    confirmedItemCount,
    pendingItemCount,
    failedItemCount,
    manualReviewItemCount,
    unresolvedItemCount,
    title:
      itinerary.items.length === 1
        ? itinerary.items[0]?.title || "Booked itinerary"
        : `${itinerary.items.length} booked items`,
    tripDescription: locationSummary,
    locationSummary,
    startAt: range.startAt,
    endAt: range.endAt,
    ownerUserId: itinerary.ownerUserId,
    ownerSessionId: itinerary.ownerSessionId,
    createdAt: itinerary.createdAt,
    updatedAt: itinerary.updatedAt,
  };
};
