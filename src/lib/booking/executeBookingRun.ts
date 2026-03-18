import { buildBookingExecutionSummary } from "~/lib/booking/buildBookingExecutionSummary";
import { executeBookingItem } from "~/lib/booking/executeBookingItem";
import { getBookingRun, updateBookingRun } from "~/lib/booking/getBookingRun";
import { isBookingRunTerminal } from "~/lib/booking/isBookingRunTerminal";
import {
  getCheckoutSession,
  persistCheckoutSessionStatus,
} from "~/lib/checkout/getCheckoutSession";
import { getCheckoutPaymentSession } from "~/lib/payments/getCheckoutPaymentSession";
import type { BookingRun } from "~/types/booking";

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const executeBookingRun = async (
  bookingRunId: string,
  options: {
    now?: Date | string | null;
  } = {},
): Promise<BookingRun> => {
  const bookingRun = await getBookingRun(bookingRunId);
  if (!bookingRun) {
    throw new Error(`Booking run ${bookingRunId} could not be found.`);
  }

  if (isBookingRunTerminal(bookingRun.status)) {
    return bookingRun;
  }

  const startedAt = bookingRun.startedAt || normalizeTimestamp(options.now);
  await updateBookingRun(bookingRun.id, {
    status: "processing",
    startedAt,
    updatedAt: startedAt,
  });

  let refreshed = await getBookingRun(bookingRun.id);
  if (!refreshed) {
    throw new Error(`Booking run ${bookingRun.id} could not be reloaded.`);
  }

  const checkoutSession = await getCheckoutSession(refreshed.checkoutSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });
  const paymentSession = await getCheckoutPaymentSession(refreshed.paymentSessionId, {
    now: options.now ?? undefined,
    includeTerminal: true,
  });

  if (!checkoutSession || !paymentSession) {
    throw new Error("Booking execution lost its checkout or payment session.");
  }

  const checkoutItemsByKey = new Map(
    checkoutSession.items.map((item) => [
      `trip-item:${item.tripItemId}:${item.inventory.inventoryId}`,
      item,
    ]),
  );

  for (const itemExecution of refreshed.itemExecutions) {
    if (
      itemExecution.status !== "pending" &&
      itemExecution.status !== "processing"
    ) {
      continue;
    }

    const checkoutItem = checkoutItemsByKey.get(itemExecution.checkoutItemKey);
    if (!checkoutItem) {
      continue;
    }

    await executeBookingItem({
      bookingRun: refreshed,
      bookingItemExecution: itemExecution,
      checkoutSession,
      paymentSession,
      checkoutItem,
      now: options.now,
    });

    refreshed = (await getBookingRun(refreshed.id)) || refreshed;
  }

  const summary = buildBookingExecutionSummary(refreshed.itemExecutions);
  const completedAt =
    summary.overallStatus === "processing" || summary.overallStatus === "pending"
      ? null
      : normalizeTimestamp(options.now);
  const terminalRun = await updateBookingRun(refreshed.id, {
    status: summary.runStatus,
    summary,
    startedAt,
    completedAt,
    updatedAt: completedAt || startedAt,
  });

  if (summary.overallStatus === "succeeded") {
    await persistCheckoutSessionStatus(refreshed.checkoutSessionId, "completed", {
      now: completedAt || options.now || new Date(),
    });
  }

  return terminalRun || refreshed;
};
