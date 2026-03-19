import type {
  BookingConfirmationItem,
  BookingConfirmationStatus,
  ConfirmationItemStatus,
} from "~/types/confirmation";

type ConfirmationStatusLike = Pick<BookingConfirmationItem, "status"> | {
  status: ConfirmationItemStatus;
};

export const buildConfirmationStatus = (
  items: ConfirmationStatusLike[],
): BookingConfirmationStatus => {
  if (!items.length) return "pending";

  const confirmedCount = items.filter((item) => item.status === "confirmed").length;
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const requiresManualReviewCount = items.filter(
    (item) => item.status === "requires_manual_review",
  ).length;

  if (requiresManualReviewCount > 0) {
    return "requires_manual_review";
  }

  if (confirmedCount === items.length) {
    return "confirmed";
  }

  if (confirmedCount > 0) {
    return "partial";
  }

  if (pendingCount > 0) {
    return "pending";
  }

  if (failedCount > 0) {
    return "failed";
  }

  return "pending";
};
