import { getBookingEligibility } from "~/lib/booking/getBookingEligibility";
import { getLatestBookingRunForCheckout } from "~/lib/booking/getBookingRun";
import type { CheckoutBookingSummary } from "~/types/booking";

const toTitleCase = (value: string) => {
  return String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const describeBookingStatus = (summary: {
  status: CheckoutBookingSummary["status"];
  canExecute: boolean;
  eligibilityMessage: string;
  hasCompletedBooking: boolean;
  pendingProviderConfirmationCount: number;
}) => {
  if (summary.hasCompletedBooking) {
    return "All checkout items have been booked successfully.";
  }

  switch (summary.status) {
    case "processing":
      return summary.pendingProviderConfirmationCount > 0
        ? "At least one item is waiting on provider confirmation."
        : "Booking is in progress. Items may complete at different times.";
    case "pending":
      return "Booking is ready to begin.";
    case "partial":
      return "Some items were booked successfully, while others still need attention.";
    case "succeeded":
      return "All items are booked.";
    case "failed":
      return "Booking failed before all items could be confirmed.";
    case "requires_manual_review":
      return "Booking needs manual review before it can be considered complete.";
    case "idle":
    default:
      return summary.canExecute
        ? "Payment is ready. Complete booking to confirm your checkout items."
        : summary.eligibilityMessage;
  }
};

export const getBookingSummary = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
): Promise<CheckoutBookingSummary> => {
  const eligibility = await getBookingEligibility(checkoutSessionId, options);
  const latestRun =
    eligibility.activeBookingRun ||
    eligibility.completedBookingRun ||
    (await getLatestBookingRunForCheckout(checkoutSessionId, {
      includeTerminal: true,
    }));
  const hasMatchingLatestRun =
    eligibility.ok &&
    latestRun != null &&
    latestRun.executionKey === eligibility.executionKey;
  const status = latestRun?.summary?.overallStatus || "idle";
  const hasCompletedBooking =
    latestRun?.summary?.overallStatus === "succeeded" ||
    Boolean(latestRun && latestRun.status === "succeeded");

  return {
    checkoutSessionId,
    bookingRunId: eligibility.activeBookingRun?.id || latestRun?.id || null,
    latestBookingRunId: latestRun?.id || null,
    status,
    statusLabel: toTitleCase(status),
    statusDescription: describeBookingStatus({
      status,
      canExecute: eligibility.ok && !hasMatchingLatestRun,
      eligibilityMessage: eligibility.message,
      hasCompletedBooking,
      pendingProviderConfirmationCount:
        latestRun?.summary?.pendingProviderConfirmationCount || 0,
    }),
    canExecute: eligibility.ok && !hasMatchingLatestRun,
    canRefresh: Boolean(latestRun),
    isProcessing: status === "processing" || status === "pending",
    hasCompletedBooking,
    eligibilityCode: eligibility.code,
    eligibilityMessage: eligibility.message,
    updatedAt: latestRun?.updatedAt || null,
    run: latestRun || null,
  };
};
