import { formatConfirmationDateRange } from "~/lib/confirmation/formatConfirmationDates";
import { formatItineraryDateRange } from "~/fns/itinerary/formatItineraryDates";
import type { BookingConfirmationItem } from "~/types/confirmation";
import type { NotificationRenderItemSummary } from "~/types/notifications";
import type { OwnedItineraryItem } from "~/types/itinerary";

export const buildConfirmationItemSummaries = (
  items: BookingConfirmationItem[],
): NotificationRenderItemSummary[] => {
  return items.slice(0, 6).map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    when: formatConfirmationDateRange(item.startAt, item.endAt),
    where: item.locationSummary,
    status:
      item.status === "requires_manual_review"
        ? "Manual review"
        : item.status === "confirmed"
          ? "Confirmed"
          : item.status === "failed"
            ? "Failed"
            : "Pending",
  }));
};

export const buildItineraryItemSummaries = (
  items: OwnedItineraryItem[],
): NotificationRenderItemSummary[] => {
  return items.slice(0, 6).map((item) => ({
    title: item.title,
    subtitle: item.subtitle,
    when: formatItineraryDateRange(item.startAt, item.endAt),
    where: item.locationSummary,
    status:
      item.status === "confirmed"
        ? "Confirmed"
        : item.status === "completed"
          ? "Completed"
          : item.status === "in_progress"
            ? "In progress"
            : item.status === "pending"
              ? "Pending"
              : item.status === "canceled"
                ? "Canceled"
                : "Failed",
  }));
};
