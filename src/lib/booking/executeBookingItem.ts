import { createBooking } from "~/lib/booking/adapters/createBooking";
import { mapBookingAdapterError } from "~/lib/booking/mapBookingAdapterError";
import { updateBookingItemExecution } from "~/lib/booking/getBookingRun";
import type { BookingItemExecution, BookingRun } from "~/types/booking";
import type { CheckoutItemSnapshot, CheckoutSession } from "~/types/checkout";
import type { CheckoutPaymentSession } from "~/types/payment";

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const executeBookingItem = async (input: {
  bookingRun: BookingRun;
  bookingItemExecution: BookingItemExecution;
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  checkoutItem: CheckoutItemSnapshot;
  now?: Date | string | null;
}) => {
  const startedAt =
    input.bookingItemExecution.startedAt || normalizeTimestamp(input.now);
  const provider = String(
    input.bookingItemExecution.provider ||
      input.checkoutItem.inventory.bookableEntity?.provider ||
      input.checkoutItem.inventory.providerMetadata?.provider ||
      input.checkoutItem.vertical,
  )
    .trim()
    .toLowerCase();
  const idempotencyKey = `${input.bookingRun.executionKey}:${input.bookingItemExecution.checkoutItemKey}`;

  await updateBookingItemExecution(input.bookingItemExecution.id, {
    status: "processing",
    provider,
    startedAt,
    updatedAt: startedAt,
  });

  try {
    const result = await createBooking({
      checkoutSession: input.checkoutSession,
      paymentSession: input.paymentSession,
      checkoutItem: input.checkoutItem,
      bookingRun: input.bookingRun,
      bookingItemExecution: {
        ...input.bookingItemExecution,
        startedAt,
        status: "processing",
      },
      provider:
        provider,
      idempotencyKey,
      metadata: {
        checkoutItemKey: input.bookingItemExecution.checkoutItemKey,
      },
    });

    const completedAt =
      result.status === "pending" ? null : normalizeTimestamp(input.now);

    return updateBookingItemExecution(input.bookingItemExecution.id, {
      status:
        result.status === "pending" ? "processing" : result.status,
      provider: result.provider,
      providerBookingReference: result.providerBookingReference,
      providerConfirmationCode: result.providerConfirmationCode,
      requestSnapshotJson: result.requestSnapshot,
      responseSnapshotJson: result.responseSnapshot,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage || result.message,
      startedAt,
      completedAt,
      updatedAt: completedAt || startedAt,
    });
  } catch (error) {
    const normalized = mapBookingAdapterError(error);
    const completedAt = normalizeTimestamp(input.now);

    return updateBookingItemExecution(input.bookingItemExecution.id, {
      status: "failed",
      errorCode: normalized.errorCode,
      errorMessage: normalized.errorMessage,
      startedAt,
      completedAt,
      updatedAt: completedAt,
    });
  }
};
