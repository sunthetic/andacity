import type {
  BookingExecutionStatus,
  BookingExecutionSummary,
  BookingItemExecution,
  BookingRunStatus,
} from "~/types/booking";

const buildRunStatus = (input: {
  pendingCount: number;
  processingCount: number;
  succeededCount: number;
  failedCount: number;
  manualReviewCount: number;
  totalItemCount: number;
}): BookingRunStatus => {
  if (input.processingCount > 0) return "processing";
  if (input.pendingCount > 0) return "pending";
  if (input.succeededCount === input.totalItemCount && input.totalItemCount > 0) {
    return "succeeded";
  }
  if (input.succeededCount > 0 && input.succeededCount < input.totalItemCount) {
    return "partial";
  }
  if (input.manualReviewCount > 0 && input.failedCount === 0) {
    return "failed";
  }
  if (input.failedCount > 0 || input.manualReviewCount > 0) {
    return "failed";
  }
  return "pending";
};

const buildOverallStatus = (input: {
  runStatus: BookingRunStatus;
  pendingCount: number;
  processingCount: number;
  succeededCount: number;
  failedCount: number;
  manualReviewCount: number;
  totalItemCount: number;
}): BookingExecutionStatus => {
  if (input.runStatus === "processing") return "processing";
  if (input.runStatus === "pending") return "pending";
  if (input.runStatus === "succeeded") return "succeeded";
  if (input.succeededCount > 0 && input.succeededCount < input.totalItemCount) {
    return "partial";
  }
  if (input.manualReviewCount > 0) return "requires_manual_review";
  if (input.failedCount > 0) return "failed";
  return "idle";
};

const buildMessage = (
  overallStatus: BookingExecutionStatus,
  totalItemCount: number,
) => {
  switch (overallStatus) {
    case "processing":
      return "We are completing your bookings item by item.";
    case "pending":
      return "Your booking run is ready to begin.";
    case "partial":
      return "Some items booked successfully, but at least one still needs follow-up.";
    case "succeeded":
      return `All ${totalItemCount} checkout item${totalItemCount === 1 ? "" : "s"} booked successfully.`;
    case "requires_manual_review":
      return "At least one item needs manual review before this checkout is fully resolved.";
    case "failed":
      return "Booking did not complete successfully.";
    default:
      return "Booking has not started yet.";
  }
};

export const buildBookingExecutionSummary = (
  itemExecutions: BookingItemExecution[],
): BookingExecutionSummary => {
  const pendingCount = itemExecutions.filter(
    (item) => item.status === "pending",
  ).length;
  const processingCount = itemExecutions.filter(
    (item) => item.status === "processing",
  ).length;
  const succeededCount = itemExecutions.filter(
    (item) => item.status === "succeeded",
  ).length;
  const failedCount = itemExecutions.filter(
    (item) => item.status === "failed",
  ).length;
  const manualReviewCount = itemExecutions.filter(
    (item) => item.status === "requires_manual_review",
  ).length;
  const skippedCount = itemExecutions.filter(
    (item) => item.status === "skipped",
  ).length;
  const totalItemCount = itemExecutions.length;
  const completedCount =
    succeededCount + failedCount + manualReviewCount + skippedCount;
  const runStatus = buildRunStatus({
    pendingCount,
    processingCount,
    succeededCount,
    failedCount,
    manualReviewCount,
    totalItemCount,
  });
  const overallStatus = buildOverallStatus({
    runStatus,
    pendingCount,
    processingCount,
    succeededCount,
    failedCount,
    manualReviewCount,
    totalItemCount,
  });

  return {
    overallStatus,
    runStatus,
    totalItemCount,
    pendingCount,
    processingCount,
    succeededCount,
    failedCount,
    manualReviewCount,
    skippedCount,
    completedCount,
    message: buildMessage(overallStatus, totalItemCount),
    items: itemExecutions.map((item) => ({
      checkoutItemKey: item.checkoutItemKey,
      tripItemId: item.tripItemId,
      title: item.title,
      vertical: item.vertical,
      provider: item.provider,
      status: item.status,
      providerBookingReference: item.providerBookingReference,
      providerConfirmationCode: item.providerConfirmationCode,
      errorCode: item.errorCode,
      errorMessage: item.errorMessage,
    })),
  };
};
