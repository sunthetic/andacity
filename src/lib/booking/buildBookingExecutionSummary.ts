import type {
  BookingExecutionStatus,
  BookingExecutionSummary,
  BookingItemExecution,
  BookingRunStatus,
} from "~/types/booking";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const readProviderStatus = (item: BookingItemExecution) => {
  const response = isRecord(item.responseSnapshotJson) ? item.responseSnapshotJson : null;
  return toNullableText(response?.providerStatus) || toNullableText(response?.status);
};

const readItemMessage = (item: BookingItemExecution) => {
  const response = isRecord(item.responseSnapshotJson) ? item.responseSnapshotJson : null;
  return toNullableText(response?.message) || item.errorMessage || null;
};

const isPendingProviderConfirmation = (item: BookingItemExecution) => {
  if (item.status !== "processing") return false;
  const providerStatus = readProviderStatus(item);
  return /pending|awaiting|confirmation/i.test(providerStatus || "");
};

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
  if (input.manualReviewCount > 0) {
    return input.succeededCount > 0 || input.failedCount > 0 ? "partial" : "failed";
  }
  if (input.failedCount > 0) {
    return input.succeededCount > 0 ? "partial" : "failed";
  }
  if (input.succeededCount === input.totalItemCount && input.totalItemCount > 0) {
    return "succeeded";
  }
  if (input.succeededCount > 0 && input.succeededCount < input.totalItemCount) {
    return "partial";
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
  if (input.manualReviewCount > 0) return "requires_manual_review";
  if (input.runStatus === "succeeded") return "succeeded";
  if (input.succeededCount > 0 && input.succeededCount < input.totalItemCount) {
    return "partial";
  }
  if (input.failedCount > 0) return "failed";
  return "idle";
};

const buildMessage = (
  overallStatus: BookingExecutionStatus,
  totalItemCount: number,
  pendingProviderConfirmationCount: number,
) => {
  switch (overallStatus) {
    case "processing":
      return pendingProviderConfirmationCount > 0
        ? "At least one booking is awaiting provider confirmation."
        : "We are completing your bookings item by item.";
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
  const pendingProviderConfirmationCount = itemExecutions.filter(
    (item) => isPendingProviderConfirmation(item),
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
    pendingProviderConfirmationCount,
    message: buildMessage(
      overallStatus,
      totalItemCount,
      pendingProviderConfirmationCount,
    ),
    items: itemExecutions.map((item) => ({
      checkoutItemKey: item.checkoutItemKey,
      tripItemId: item.tripItemId,
      title: item.title,
      vertical: item.vertical,
      provider: item.provider,
      status: item.status,
      providerBookingReference: item.providerBookingReference,
      providerConfirmationCode: item.providerConfirmationCode,
      providerStatus: readProviderStatus(item),
      message: readItemMessage(item),
      errorCode: item.errorCode,
      errorMessage: item.errorMessage,
      requiresManualReview: item.status === "requires_manual_review",
      isPendingConfirmation: isPendingProviderConfirmation(item),
    })),
  };
};
