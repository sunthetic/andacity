import type {
  BookingConfirmationStatus,
  BookingConfirmationItem,
} from "~/types/confirmation";
import type { ItineraryItemStatus, ItineraryStatus } from "~/types/itinerary";
import { normalizeTimestamp } from "~/lib/itinerary/shared";

const toMillis = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const deriveConfirmedItemStatus = (
  item: Pick<BookingConfirmationItem, "startAt" | "endAt">,
  nowIso: string,
): ItineraryItemStatus => {
  const now = toMillis(nowIso) ?? Date.now();
  const startAt = toMillis(item.startAt);
  const endAt = toMillis(item.endAt);

  if (endAt != null && endAt < now) return "completed";
  if (startAt != null && startAt <= now && (endAt == null || endAt >= now)) {
    return "in_progress";
  }

  return "confirmed";
};

export const buildItineraryItemStatus = (
  item: Pick<BookingConfirmationItem, "status" | "startAt" | "endAt">,
  options: {
    now?: Date | string | null;
  } = {},
): ItineraryItemStatus => {
  const nowIso = normalizeTimestamp(options.now) || new Date().toISOString();

  if (item.status === "confirmed") {
    return deriveConfirmedItemStatus(item, nowIso);
  }

  if (item.status === "failed") return "failed";
  return "pending";
};

export const buildItineraryStatus = (input: {
  confirmationStatus: BookingConfirmationStatus;
  confirmationItems: Array<Pick<BookingConfirmationItem, "status">>;
  itineraryItems: Array<
    Pick<
      BookingConfirmationItem,
      "startAt" | "endAt"
    > & {
      status: ItineraryItemStatus;
    }
  >;
  now?: Date | string | null;
}): ItineraryStatus => {
  const nowIso = normalizeTimestamp(input.now) || new Date().toISOString();
  const now = toMillis(nowIso) ?? Date.now();
  const confirmedSourceCount = input.confirmationItems.filter(
    (item) => item.status === "confirmed",
  ).length;

  if (
    (input.confirmationStatus === "partial" ||
      input.confirmationStatus === "requires_manual_review") &&
    confirmedSourceCount > 0
  ) {
    return "partial";
  }

  if (!input.itineraryItems.length) {
    return "active";
  }

  const allCanceled = input.itineraryItems.every((item) => item.status === "canceled");
  if (allCanceled) return "canceled";

  const allCompleted = input.itineraryItems.every((item) => item.status === "completed");
  if (allCompleted) return "completed";

  if (input.itineraryItems.some((item) => item.status === "in_progress")) {
    return "in_progress";
  }

  const starts = input.itineraryItems
    .map((item) => toMillis(item.startAt))
    .filter((value): value is number => value != null);
  const ends = input.itineraryItems
    .map((item) => toMillis(item.endAt))
    .filter((value): value is number => value != null);

  if (starts.length > 0 && starts.every((value) => value > now)) {
    return "upcoming";
  }

  if (ends.length > 0 && ends.every((value) => value < now)) {
    return "completed";
  }

  return "active";
};

