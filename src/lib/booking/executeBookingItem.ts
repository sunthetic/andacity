import { createBooking } from "~/lib/booking/adapters/createBooking";
import { mapBookingAdapterError } from "~/lib/booking/mapBookingAdapterError";
import { sanitizeBookingRequestSnapshot } from "~/lib/booking/sanitizeBookingRequestSnapshot";
import { sanitizeBookingResponseSnapshot } from "~/lib/booking/sanitizeBookingResponseSnapshot";
import { updateBookingItemExecution } from "~/lib/booking/getBookingRun";
import type { BookingItemExecution, BookingRun } from "~/types/booking";
import type { CheckoutItemSnapshot, CheckoutSession } from "~/types/checkout";
import type { CheckoutPaymentSession } from "~/types/payment";

const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

const buildPaymentContext = (paymentSession: CheckoutPaymentSession) => ({
  paymentSessionId: paymentSession.id,
  provider: paymentSession.provider,
  status: paymentSession.status,
  providerPaymentIntentId: paymentSession.providerPaymentIntentId,
  currency: paymentSession.currency,
  amount: paymentSession.amountSnapshot.totalAmountCents,
  authorizedAt: paymentSession.authorizedAt,
  metadata: paymentSession.providerMetadata,
});

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
      checkoutSessionId: input.checkoutSession.id,
      bookingRunId: input.bookingRun.id,
      checkoutItemKey: input.bookingItemExecution.checkoutItemKey,
      vertical: input.checkoutItem.vertical,
      provider,
      canonicalEntityId: input.checkoutItem.entityId,
      canonicalBookableEntityId: input.checkoutItem.bookableEntityId,
      canonicalInventoryId: input.checkoutItem.inventory.inventoryId,
      checkoutItem: input.checkoutItem,
      inventorySnapshot: {
        inventoryId: input.checkoutItem.inventory.inventoryId,
        providerInventoryId: input.checkoutItem.inventory.providerInventoryId,
        snapshotTimestamp: input.checkoutItem.snapshotTimestamp,
        pricing: input.checkoutItem.pricing,
        providerMetadata: input.checkoutItem.inventory.providerMetadata,
        bookableEntity: input.checkoutItem.inventory.bookableEntity,
        availability: input.checkoutItem.inventory.availability,
      },
      travelerContext: null,
      paymentContext: buildPaymentContext(input.paymentSession),
      idempotencyKey,
      currency:
        toNullableText(input.checkoutItem.pricing.currencyCode)?.toUpperCase() ||
        input.paymentSession.currency,
      amount:
        input.checkoutItem.pricing.totalAmountCents ??
        input.paymentSession.amountSnapshot.items.find(
          (item) => item.inventoryId === input.checkoutItem.inventory.inventoryId,
        )?.totalAmountCents ??
        null,
      metadata: {
        checkoutItemKey: input.bookingItemExecution.checkoutItemKey,
        bookingItemExecutionId: input.bookingItemExecution.id,
      },
    });

    const completedAt =
      result.status === "pending" ? null : normalizeTimestamp(input.now);
    const requestSnapshot = sanitizeBookingRequestSnapshot(result.requestSnapshot);
    const responseSnapshot = sanitizeBookingResponseSnapshot(result.responseSnapshot);

    return updateBookingItemExecution(input.bookingItemExecution.id, {
      status:
        result.status === "pending" ? "processing" : result.status,
      provider: result.provider,
      providerBookingReference: result.providerBookingReference,
      providerConfirmationCode: result.providerConfirmationCode,
      requestSnapshotJson: requestSnapshot,
      responseSnapshotJson: responseSnapshot,
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
