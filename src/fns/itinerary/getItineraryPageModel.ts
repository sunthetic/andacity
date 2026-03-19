import { buildRecoveryState } from "~/fns/recovery/buildRecoveryState";
import { formatItineraryCurrency } from "~/fns/itinerary/formatItineraryCurrency";
import {
  formatItineraryDateRange,
  formatItineraryDateTime,
} from "~/fns/itinerary/formatItineraryDates";
import type { ItineraryDetail } from "~/types/itinerary";
import type { RecoveryState } from "~/types/recovery";
import type { OwnershipDisplayState } from "~/types/ownership";

export type ItineraryPageNoticeTone = "success" | "warning" | "error" | "info";

export type ItineraryPageItemStatus =
  | "confirmed"
  | "pending"
  | "failed"
  | "manual_review"
  | "in_progress"
  | "completed"
  | "canceled";

export type ItineraryPageItemModel = {
  id: string;
  typeLabel: string;
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  locationLabel: string | null;
  status: ItineraryPageItemStatus;
  statusLabel: string;
  statusTone: ItineraryPageNoticeTone;
  providerName: string | null;
  confirmationCode: string | null;
  bookingReference: string | null;
};

export type ItineraryPageModel = {
  itineraryRef: string;
  tripHref: string | null;
  homeHref: string;
  previewOnly: boolean;
  ownership: {
    state: "owned" | "claimable";
    tone: ItineraryPageNoticeTone;
    title: string;
    message: string;
    badgeLabel: string;
    showClaimAction: boolean;
    claimActionLabel: string | null;
    hint: string | null;
    hasCurrentUser: boolean;
    claimNotice: {
      code: string;
      message: string;
      tone: ItineraryPageNoticeTone;
    } | null;
  };
  header: {
    title: string;
    itineraryRef: string;
    bookingDateLabel: string | null;
    ownershipLabel: string;
    statusLabel: string;
    statusDescription: string;
  };
  summary: {
    totalPaidLabel: string | null;
    currency: string | null;
    itemCountLabel: string;
    dateRangeLabel: string | null;
    tripDescription: string;
    bookingDateLabel: string | null;
    lastUpdatedLabel: string | null;
    progressLabel: string;
  };
  statusNotice: {
    tone: ItineraryPageNoticeTone;
    title: string;
    message: string;
  } | null;
  recoveryState: RecoveryState | null;
  items: ItineraryPageItemModel[];
  actions: {
    returnToSearchHref: string;
    tripHref: string | null;
    modifyLabel: string;
    cancelLabel: string;
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

const readNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readSourceConfirmationStatus = (
  details: Record<string, unknown> | null,
): string | null => {
  const value = details?.sourceConfirmationStatus;
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || null;
};

const readCheckoutSnapshotTotal = (
  details: Record<string, unknown> | null,
): number | null => {
  const checkoutSnapshot =
    details && typeof details.checkoutSnapshot === "object"
      ? (details.checkoutSnapshot as Record<string, unknown>)
      : null;
  const pricing =
    checkoutSnapshot && typeof checkoutSnapshot.pricing === "object"
      ? (checkoutSnapshot.pricing as Record<string, unknown>)
      : null;
  const value = readNumber(pricing?.totalAmountCents);

  return value == null ? null : Math.round(value);
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const getVerticalLabel = (value: string) => {
  if (value === "hotel") return "Hotel";
  if (value === "car") return "Car rental";
  return "Flight";
};

const mapItemStatus = (item: ItineraryDetail["items"][number]) => {
  const sourceStatus = readSourceConfirmationStatus(item.detailsJson);

  if (sourceStatus === "requires_manual_review") {
    return {
      key: "manual_review" as const,
      label: "Manual review",
      tone: "warning" as const,
      unresolved: true,
    };
  }

  if (item.status === "failed") {
    return {
      key: "failed" as const,
      label: "Failed",
      tone: "error" as const,
      unresolved: true,
    };
  }

  if (item.status === "pending") {
    return {
      key: "pending" as const,
      label: "Pending",
      tone: "info" as const,
      unresolved: true,
    };
  }

  if (item.status === "in_progress") {
    return {
      key: "in_progress" as const,
      label: "In progress",
      tone: "info" as const,
      unresolved: false,
    };
  }

  if (item.status === "completed") {
    return {
      key: "completed" as const,
      label: "Completed",
      tone: "success" as const,
      unresolved: false,
    };
  }

  if (item.status === "canceled") {
    return {
      key: "canceled" as const,
      label: "Canceled",
      tone: "warning" as const,
      unresolved: true,
    };
  }

  return {
    key: "confirmed" as const,
    label: "Confirmed",
    tone: "success" as const,
    unresolved: false,
  };
};

const buildTripDescription = (
  items: ItineraryDetail["items"],
  locationSummary: string | null,
) => {
  if (locationSummary) {
    return locationSummary;
  }

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.vertical] = (acc[item.vertical] || 0) + 1;
    return acc;
  }, {});

  const parts = [
    counts.flight ? pluralize(counts.flight, "flight") : null,
    counts.hotel ? pluralize(counts.hotel, "hotel") : null,
    counts.car ? pluralize(counts.car, "car rental") : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length ? parts.join(" · ") : "Saved itinerary";
};

const buildStatusPresentation = (input: {
  detail: ItineraryDetail;
  mappedItems: Array<
    Pick<ItineraryPageItemModel, "status"> & {
      unresolved: boolean;
    }
  >;
}): {
  statusNotice: ItineraryPageModel["statusNotice"];
  recoveryState: RecoveryState | null;
  progressLabel: string;
} => {
  const manualReviewCount = input.mappedItems.filter(
    (item) => item.status === "manual_review",
  ).length;
  const pendingCount = input.mappedItems.filter(
    (item) => item.status === "pending",
  ).length;
  const failedCount = input.mappedItems.filter(
    (item) => item.status === "failed" || item.status === "canceled",
  ).length;
  const confirmedLikeCount = input.mappedItems.filter(
    (item) =>
      item.status === "confirmed" ||
      item.status === "in_progress" ||
      item.status === "completed",
  ).length;
  const unresolvedCount = input.mappedItems.filter((item) => item.unresolved).length;

  const metadata = {
    itineraryRef: input.detail.publicRef,
    itineraryHref: `/itinerary/${input.detail.publicRef}`,
    tripHref: input.detail.tripHref,
    failedCount,
    manualReviewCount,
    hasConfirmedItems: confirmedLikeCount > 0,
  };

  if (manualReviewCount > 0) {
    return {
      statusNotice: {
        tone: "warning",
        title: "Some items require manual review",
        message:
          manualReviewCount === 1
            ? "One itinerary item needs manual follow-up before this trip is fully settled."
            : `${manualReviewCount} itinerary items need manual follow-up before this trip is fully settled.`,
      },
      recoveryState: buildRecoveryState({
        stage: "booking",
        reasonCode: "BOOKING_REQUIRES_MANUAL_REVIEW",
        metadata,
      }),
      progressLabel: `${confirmedLikeCount} settled · ${unresolvedCount} need attention`,
    };
  }

  if (failedCount > 0 && confirmedLikeCount > 0) {
    return {
      statusNotice: {
        tone: "warning",
        title: "This itinerary is partially settled",
        message:
          "Some items failed or were canceled while others remained confirmed. Review each item before continuing post-booking steps.",
      },
      recoveryState: buildRecoveryState({
        stage: "booking",
        reasonCode: "BOOKING_PARTIAL",
        metadata,
      }),
      progressLabel: `${confirmedLikeCount} settled · ${unresolvedCount} need attention`,
    };
  }

  if (failedCount > 0 && confirmedLikeCount === 0) {
    return {
      statusNotice: {
        tone: "error",
        title: "This itinerary includes failed items",
        message:
          "No itinerary items reached a confirmed state. Use the references below and start a fresh search when you are ready.",
      },
      recoveryState: buildRecoveryState({
        stage: "booking",
        reasonCode: "BOOKING_FAILED",
        metadata,
      }),
      progressLabel: "All items need attention",
    };
  }

  if (pendingCount > 0) {
    return {
      statusNotice: {
        tone: "info",
        title: "This itinerary is still updating",
        message:
          pendingCount === 1
            ? "One item is still pending provider confirmation. Reload to keep the latest persisted state."
            : `${pendingCount} items are still pending provider confirmation. Reload to keep the latest persisted state.`,
      },
      recoveryState: buildRecoveryState({
        stage: "confirmation",
        reasonCode: "CONFIRMATION_PENDING",
        metadata,
      }),
      progressLabel: `${confirmedLikeCount} settled · ${unresolvedCount} pending`,
    };
  }

  if (input.detail.status === "partial") {
    return {
      statusNotice: {
        tone: "info",
        title: "Durable itinerary recovered",
        message:
          "This itinerary reflects the latest persisted recovery state from confirmation and ownership promotion.",
      },
      recoveryState: null,
      progressLabel: "Partially settled",
    };
  }

  return {
    statusNotice: null,
    recoveryState: null,
    progressLabel: "All items settled",
  };
};

const getOwnershipBadge = (detail: ItineraryDetail) => {
  if (detail.isClaimable && !detail.isOwnedByCurrentContext) {
    return "Claimable itinerary";
  }

  if (detail.ownershipMode === "user") {
    return "Account-owned";
  }

  return "Anonymous-owned";
};

const getHeaderTitle = (detail: ItineraryDetail) => {
  if (detail.summary.locationSummary) {
    return `${detail.summary.locationSummary} itinerary`;
  }

  if (detail.summary.title) {
    return detail.summary.title;
  }

  return "Saved itinerary";
};

export const getItineraryPageModel = (
  detail: ItineraryDetail,
  options: {
    hasCurrentUser?: boolean;
    ownershipDisplayState?: OwnershipDisplayState | null;
    claimNotice?: {
      code: string;
      message: string;
      tone: ItineraryPageNoticeTone;
    } | null;
    previewOnly?: boolean;
  } = {},
): ItineraryPageModel => {
  const previewOnly = Boolean(options.previewOnly);
  const hasCurrentUser = Boolean(options.hasCurrentUser);
  const ownershipState =
    detail.isClaimable && !detail.isOwnedByCurrentContext ? "claimable" : "owned";
  const ownershipDisplay = options.ownershipDisplayState;
  const totalAmountCentsFromItems = detail.items.reduce((acc, item) => {
    const next = readCheckoutSnapshotTotal(item.detailsJson);
    return next == null ? acc : acc + next;
  }, 0);
  const hasItemTotals = detail.items.some(
    (item) => readCheckoutSnapshotTotal(item.detailsJson) != null,
  );
  const totalAmountCents =
    detail.summary.totalAmountCents ??
    (hasItemTotals ? totalAmountCentsFromItems : null);

  const mappedItems = detail.items.map((item) => {
    const status = mapItemStatus(item);

    return {
      id: item.id,
      typeLabel: getVerticalLabel(item.vertical),
      title: item.title,
      subtitle: item.subtitle,
      dateLabel: formatItineraryDateRange(item.startAt, item.endAt),
      locationLabel: item.locationSummary,
      status: status.key,
      statusLabel: status.label,
      statusTone: status.tone,
      providerName: toTitleCase(item.provider),
      confirmationCode: previewOnly ? null : item.providerConfirmationCode,
      bookingReference: previewOnly ? null : item.providerBookingReference,
      unresolved: status.unresolved,
    };
  });

  const statusPresentation = buildStatusPresentation({
    detail,
    mappedItems,
  });

  const unresolvedCount = mappedItems.filter((item) => item.unresolved).length;
  const tripDescription = buildTripDescription(
    detail.items,
    detail.summary.locationSummary,
  );

  return {
    itineraryRef: detail.publicRef,
    tripHref: detail.tripHref,
    homeHref: "/",
    previewOnly,
    ownership: {
      state: ownershipState,
      tone: ownershipDisplay?.tone || (ownershipState === "claimable" ? "warning" : "success"),
      title:
        ownershipDisplay?.title ||
        (ownershipState === "claimable"
          ? "Claim this itinerary"
          : "You own this itinerary"),
      message:
        ownershipDisplay?.message ||
        (ownershipState === "claimable"
          ? "Attach this itinerary to your account to unlock full post-booking management."
          : "This itinerary is attached to your ownership context and can be reopened any time."),
      badgeLabel: getOwnershipBadge(detail),
      showClaimAction: ownershipState === "claimable" && hasCurrentUser,
      claimActionLabel:
        ownershipState === "claimable" && hasCurrentUser
          ? ownershipDisplay?.label || "Claim itinerary"
          : null,
      hint:
        ownershipState === "claimable" && !hasCurrentUser
          ? "Sign in with the owning account to claim this itinerary."
          : null,
      hasCurrentUser,
      claimNotice: options.claimNotice || null,
    },
    header: {
      title: getHeaderTitle(detail),
      itineraryRef: detail.publicRef,
      bookingDateLabel: formatItineraryDateTime(detail.createdAt),
      ownershipLabel: getOwnershipBadge(detail),
      statusLabel: detail.statusLabel,
      statusDescription: detail.statusDescription,
    },
    summary: {
      totalPaidLabel: formatItineraryCurrency(totalAmountCents, detail.currency, {
        emptyLabel: "Unavailable",
      }),
      currency: detail.currency,
      itemCountLabel: pluralize(mappedItems.length, "booked item"),
      dateRangeLabel: formatItineraryDateRange(
        detail.summary.startAt,
        detail.summary.endAt,
        {
          emptyLabel: "Unavailable",
        },
      ),
      tripDescription,
      bookingDateLabel: formatItineraryDateTime(detail.createdAt),
      lastUpdatedLabel: formatItineraryDateTime(detail.updatedAt),
      progressLabel:
        unresolvedCount === 0
          ? "All items settled"
          : statusPresentation.progressLabel,
    },
    statusNotice: statusPresentation.statusNotice,
    recoveryState: statusPresentation.recoveryState,
    items: mappedItems.map((item) => ({
      id: item.id,
      typeLabel: item.typeLabel,
      title: item.title,
      subtitle: item.subtitle,
      dateLabel: item.dateLabel,
      locationLabel: item.locationLabel,
      status: item.status,
      statusLabel: item.statusLabel,
      statusTone: item.statusTone,
      providerName: item.providerName,
      confirmationCode: item.confirmationCode,
      bookingReference: item.bookingReference,
    })),
    actions: {
      returnToSearchHref: "/",
      tripHref: detail.tripHref,
      modifyLabel: "Modify itinerary (Coming soon)",
      cancelLabel: "Cancel itinerary (Coming soon)",
    },
  };
};
