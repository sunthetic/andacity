import { getConfirmationDisplayStatus } from "~/lib/confirmation/getConfirmationDisplayStatus";
import { toNonNegativeInteger } from "~/lib/confirmation/shared";
import type {
  BookingConfirmation,
  BookingConfirmationItem,
  BookingConfirmationSummary,
} from "~/types/confirmation";

const readTotalAmount = (value: Record<string, unknown> | null) => {
  if (!value) return null;
  return toNonNegativeInteger(value.totalAmountCents);
};

export const buildBookingConfirmationSummary = (
  confirmation: Pick<
    BookingConfirmation,
    "id" | "publicRef" | "status" | "currency" | "totalsJson" | "confirmedAt"
  > & {
    items: BookingConfirmationItem[];
  },
): BookingConfirmationSummary => {
  const confirmedItems = confirmation.items.filter(
    (item) => item.status === "confirmed",
  );
  const pendingItems = confirmation.items.filter((item) => item.status === "pending");
  const failedItems = confirmation.items.filter((item) => item.status === "failed");
  const manualReviewItems = confirmation.items.filter(
    (item) => item.status === "requires_manual_review",
  );
  const unresolvedItems = confirmation.items.filter(
    (item) => item.status !== "confirmed",
  );
  const display = getConfirmationDisplayStatus(confirmation.status);

  return {
    confirmationId: confirmation.id,
    publicRef: confirmation.publicRef,
    status: confirmation.status,
    statusLabel: display.label,
    statusDescription: display.description,
    totalItemCount: confirmation.items.length,
    confirmedItemCount: confirmedItems.length,
    pendingItemCount: pendingItems.length,
    failedItemCount: failedItems.length,
    requiresManualReviewCount: manualReviewItems.length,
    unresolvedItemCount: unresolvedItems.length,
    confirmedItemTitles: confirmedItems.map((item) => item.title),
    unresolvedItemTitles: unresolvedItems.map((item) => item.title),
    currency: confirmation.currency,
    totalAmountCents: readTotalAmount(confirmation.totalsJson),
    confirmedAt: confirmation.confirmedAt,
  };
};
