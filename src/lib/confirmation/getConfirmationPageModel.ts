import { buildBookingConfirmationSummary } from "~/lib/confirmation/buildBookingConfirmationSummary";
import {
  formatConfirmationDateRange,
  formatConfirmationDateTime,
} from "~/lib/confirmation/formatConfirmationDates";
import { formatConfirmationCurrency } from "~/lib/confirmation/formatConfirmationCurrency";
import { getConfirmationDisplayStatus } from "~/lib/confirmation/getConfirmationDisplayStatus";
import type {
  BookingConfirmation,
  BookingConfirmationItem,
  BookingConfirmationSummary,
  ConfirmationItemStatus,
} from "~/types/confirmation";

export type ConfirmationUiTone = "success" | "warning" | "error" | "info";

export type ConfirmationPageItemReference = {
  label: string;
  value: string;
};

export type ConfirmationPageItemModel = {
  id: string;
  verticalLabel: string;
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  locationLabel: string | null;
  statusLabel: string;
  statusTone: ConfirmationUiTone;
  providerLabel: string | null;
  confirmationCode: string | null;
  bookingReference: string | null;
  references: ConfirmationPageItemReference[];
};

export type ConfirmationReferenceGroup = {
  id: string;
  itemTitle: string;
  providerLabel: string | null;
  references: ConfirmationPageItemReference[];
};

export type ConfirmationPageModel = {
  confirmationRef: string;
  tripId: number;
  tripReference: string;
  tripHref: string;
  homeHref: string;
  header: {
    statusLabel: string;
    statusTone: ConfirmationUiTone;
    title: string;
    message: string;
    confirmationRef: string;
    supportLabel: string;
  };
  summary: {
    totalPaidLabel: string | null;
    currency: string | null;
    itemCountLabel: string;
    tripSummary: string;
    bookingDateLabel: string | null;
    lastUpdatedLabel: string | null;
    progressLabel: string;
  };
  statusNotice: {
    tone: ConfirmationUiTone;
    title: string;
    message: string;
  } | null;
  itineraryNotice: {
    tone: ConfirmationUiTone;
    title: string;
    message: string;
    href: string | null;
    label: string;
  } | null;
  items: ConfirmationPageItemModel[];
  references: ConfirmationReferenceGroup[];
  nextSteps: {
    title: string;
    description: string;
    primaryAction: {
      href: string;
      label: string;
    };
    secondaryAction: {
      href: string;
      label: string;
    };
  };
};

const toTitleCase = (value: string | null | undefined) => {
  return String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const buildTripReference = (tripId: number) => {
  return `TRIP-${String(Math.max(0, tripId)).padStart(6, "0")}`;
};

const getVerticalLabel = (value: BookingConfirmationItem["vertical"]) => {
  if (value === "hotel") return "Hotel";
  if (value === "car") return "Car rental";
  return "Flight";
};

const getItemStatusDisplay = (
  status: ConfirmationItemStatus,
): {
  label: string;
  tone: ConfirmationUiTone;
} => {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      tone: "success",
    };
  }

  if (status === "requires_manual_review") {
    return {
      label: "Manual review",
      tone: "warning",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      tone: "error",
    };
  }

  return {
    label: "Pending",
    tone: "info",
  };
};

const buildItemReferences = (item: BookingConfirmationItem) => {
  const references: ConfirmationPageItemReference[] = [];

  if (item.providerConfirmationCode) {
    references.push({
      label: "Confirmation code",
      value: item.providerConfirmationCode,
    });
  }

  if (item.providerBookingReference) {
    references.push({
      label: "Booking reference",
      value: item.providerBookingReference,
    });
  }

  return references;
};

const describeTripSummary = (items: BookingConfirmationItem[]) => {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.vertical] = (acc[item.vertical] || 0) + 1;
    return acc;
  }, {});

  const parts = [
    counts.flight ? pluralize(counts.flight, "flight") : null,
    counts.hotel ? pluralize(counts.hotel, "hotel") : null,
    counts.car ? pluralize(counts.car, "car rental") : null,
  ].filter((part): part is string => Boolean(part));

  if (parts.length) return parts.join(" · ");

  return items
    .slice(0, 2)
    .map((item) => item.title)
    .filter(Boolean)
    .join(" · ");
};

const buildHeaderTitle = (status: BookingConfirmation["status"]) => {
  if (status === "confirmed") return "Your trip is confirmed";
  if (status === "partial") return "Your trip is partially confirmed";
  if (status === "requires_manual_review") return "Some items need attention";
  if (status === "failed") return "We couldn’t fully confirm this trip";
  return "Your confirmation is still updating";
};

const buildHeaderMessage = (status: BookingConfirmation["status"]) => {
  if (status === "confirmed") {
    return "Everything that completed successfully is saved here and ready to revisit later.";
  }

  if (status === "partial") {
    return "Confirmed items are saved below, and the remaining items still need follow-up.";
  }

  if (status === "requires_manual_review") {
    return "We saved the confirmed details. One or more items still need manual confirmation.";
  }

  if (status === "failed") {
    return "This booking run did not produce a fully confirmed trip, but the latest result is still preserved here.";
  }

  return "This confirmation page will keep the latest persisted booking state as more results settle.";
};

const buildStatusNotice = (input: {
  status: BookingConfirmation["status"];
  pendingCount: number;
  failedCount: number;
  requiresManualReviewCount: number;
}): ConfirmationPageModel["statusNotice"] => {
  if (input.status === "confirmed") return null;

  if (input.status === "requires_manual_review") {
    return {
      tone: "warning",
      title: "Some items require manual confirmation",
      message:
        input.requiresManualReviewCount > 0
          ? `${pluralize(input.requiresManualReviewCount, "item")} still require manual review. We’ll update you shortly.`
          : "At least one item still requires manual review before this trip is fully settled.",
    };
  }

  if (input.status === "partial") {
    if (input.failedCount > 0) {
      return {
        tone: "warning",
        title: "Some bookings were not confirmed",
        message:
          "One or more items failed while others succeeded. Review the saved details below and return to your trip if you need to make changes.",
      };
    }

    return {
      tone: "warning",
      title: "Some items are still settling",
      message:
        input.pendingCount > 0
          ? `${pluralize(input.pendingCount, "item")} are still pending final confirmation. Confirmed details remain saved here.`
          : "Some items are still being finalized. Confirmed details remain saved here.",
    };
  }

  if (input.status === "failed") {
    return {
      tone: "error",
      title: "One or more bookings failed",
      message:
        "We couldn’t confirm the requested trip items from this booking run. You can review your trip and start a fresh search if needed.",
    };
  }

  return {
    tone: "info",
    title: "Confirmation is still updating",
    message:
      "Some items require more time before this confirmation is final. Reloading this page will always show the latest persisted state.",
  };
};

const buildNextStepsDescription = (status: BookingConfirmation["status"]) => {
  if (status === "confirmed") {
    return "Your confirmed trip details are saved. Use this page as your durable booking reference any time you return.";
  }

  if (status === "failed") {
    return "Review your saved trip for alternatives or start a fresh search when you’re ready to try again.";
  }

  return "You can return to your trip to review what was saved, or start a new search while this confirmation stays available on reload.";
};

const buildItineraryNotice = (
  summary: BookingConfirmationSummary,
): ConfirmationPageModel["itineraryNotice"] => {
  if (summary.hasItinerary && summary.itineraryRef) {
    return {
      tone: "success",
      title: "Durable itinerary ownership is ready",
      message:
        summary.itineraryStatus === "partial"
          ? "Confirmed items have been promoted into your long-lived itinerary record, while unresolved items remain outside the owned set."
          : "This confirmation has been promoted into a long-lived itinerary record for future trip retrieval.",
      href: `/itinerary/${summary.itineraryRef}`,
      label: "Open itinerary",
    };
  }

  return {
    tone: "info",
    title: "Itinerary ownership is still being prepared",
    message:
      "Your confirmation is saved. We’ll keep promoting confirmed items into a durable itinerary record as soon as ownership is available.",
    href: null,
    label: "Itinerary pending",
  };
};

export const getConfirmationPageModel = (
  confirmation: BookingConfirmation,
): ConfirmationPageModel => {
  if (!confirmation.items.length) {
    throw new Error("Confirmation record is missing booking items.");
  }

  const summary = confirmation.summaryJson || buildBookingConfirmationSummary(confirmation);
  const display = getConfirmationDisplayStatus(confirmation.status);
  const bookingDate =
    confirmation.confirmedAt || summary.confirmedAt || confirmation.createdAt;
  const items = confirmation.items.map((item) => {
    const itemStatus = getItemStatusDisplay(item.status);
    const references = buildItemReferences(item);

    return {
      id: item.id,
      verticalLabel: getVerticalLabel(item.vertical),
      title: item.title,
      subtitle: item.subtitle,
      dateLabel: formatConfirmationDateRange(item.startAt, item.endAt),
      locationLabel: item.locationSummary,
      statusLabel: itemStatus.label,
      statusTone: itemStatus.tone,
      providerLabel: toTitleCase(item.provider),
      confirmationCode: item.providerConfirmationCode,
      bookingReference: item.providerBookingReference,
      references,
    };
  });
  const references = items
    .filter((item) => item.references.length > 0)
    .map((item) => ({
      id: item.id,
      itemTitle: item.title,
      providerLabel: item.providerLabel,
      references: item.references,
    }));

  return {
    confirmationRef: confirmation.publicRef,
    tripId: confirmation.tripId,
    tripReference: buildTripReference(confirmation.tripId),
    tripHref: `/trips/${confirmation.tripId}`,
    homeHref: "/",
    header: {
      statusLabel: display.label,
      statusTone: display.tone,
      title: buildHeaderTitle(confirmation.status),
      message: buildHeaderMessage(confirmation.status),
      confirmationRef: confirmation.publicRef,
      supportLabel: `${summary.confirmedItemCount} of ${summary.totalItemCount} ${summary.totalItemCount === 1 ? "item" : "items"} confirmed`,
    },
    summary: {
      totalPaidLabel: formatConfirmationCurrency(
        summary.totalAmountCents,
        summary.currency || confirmation.currency,
        {
          emptyLabel: "Unavailable",
        },
      ),
      currency: summary.currency || confirmation.currency,
      itemCountLabel: pluralize(summary.totalItemCount, "booked item"),
      tripSummary: describeTripSummary(confirmation.items),
      bookingDateLabel: formatConfirmationDateTime(bookingDate),
      lastUpdatedLabel: formatConfirmationDateTime(confirmation.updatedAt),
      progressLabel:
        summary.unresolvedItemCount === 0
          ? "All items confirmed"
          : `${summary.confirmedItemCount} confirmed · ${summary.unresolvedItemCount} need attention`,
    },
    statusNotice: buildStatusNotice({
      status: confirmation.status,
      pendingCount: summary.pendingItemCount,
      failedCount: summary.failedItemCount,
      requiresManualReviewCount: summary.requiresManualReviewCount,
    }),
    itineraryNotice: buildItineraryNotice(summary),
    items,
    references,
    nextSteps: {
      title: "Next steps",
      description: buildNextStepsDescription(confirmation.status),
      primaryAction: {
        href: `/trips/${confirmation.tripId}`,
        label: "View your trip",
      },
      secondaryAction: {
        href: "/",
        label: "Start a new search",
      },
    },
  };
};
