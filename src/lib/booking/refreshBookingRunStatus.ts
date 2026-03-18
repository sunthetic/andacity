import { buildBookingExecutionSummary } from "~/lib/booking/buildBookingExecutionSummary";
import {
  getLatestBookingRunForCheckout,
  updateBookingRun,
} from "~/lib/booking/getBookingRun";

const normalizeTimestamp = (value: Date | string | number | null | undefined) => {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const refreshBookingRunStatus = async (
  checkoutSessionId: string,
  options: {
    now?: Date | string | number;
  } = {},
) => {
  const run = await getLatestBookingRunForCheckout(checkoutSessionId, {
    includeTerminal: true,
  });
  if (!run) return null;

  const summary = buildBookingExecutionSummary(run.itemExecutions);
  return (
    (await updateBookingRun(run.id, {
      status: summary.runStatus,
      summary,
      completedAt:
        summary.overallStatus === "processing" || summary.overallStatus === "pending"
          ? null
          : normalizeTimestamp(options.now) || new Date().toISOString(),
      updatedAt: normalizeTimestamp(options.now) || new Date().toISOString(),
    })) || run
  );
};
