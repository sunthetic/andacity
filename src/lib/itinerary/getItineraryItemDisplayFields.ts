import {
  formatConfirmationDateRange,
} from "~/lib/confirmation/formatConfirmationDates";
import type {
  ItineraryItemDisplayFields,
  OwnedItineraryItem,
} from "~/types/itinerary";

const toTitleCase = (value: string | null | undefined) => {
  return String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const getStatusDisplay = (
  item: OwnedItineraryItem,
): Pick<ItineraryItemDisplayFields, "statusLabel" | "statusTone"> => {
  const sourceStatus = String(item.detailsJson?.sourceConfirmationStatus || "")
    .trim()
    .toLowerCase();

  if (sourceStatus === "requires_manual_review") {
    return { statusLabel: "Manual review", statusTone: "warning" };
  }

  const { status } = item;

  switch (status) {
    case "completed":
      return { statusLabel: "Completed", statusTone: "success" };
    case "in_progress":
      return { statusLabel: "In progress", statusTone: "info" };
    case "canceled":
      return { statusLabel: "Canceled", statusTone: "warning" };
    case "failed":
      return { statusLabel: "Failed", statusTone: "error" };
    case "pending":
      return { statusLabel: "Pending", statusTone: "info" };
    default:
      return { statusLabel: "Confirmed", statusTone: "success" };
  }
};

export const getItineraryItemDisplayFields = (
  item: OwnedItineraryItem,
): ItineraryItemDisplayFields => {
  const status = getStatusDisplay(item);

  return {
    title: item.title,
    subtitle: item.subtitle,
    dateLabel: formatConfirmationDateRange(item.startAt, item.endAt),
    locationLabel: item.locationSummary,
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    providerLabel: toTitleCase(item.provider),
    confirmationCode: item.providerConfirmationCode,
    bookingReference: item.providerBookingReference,
  };
};
