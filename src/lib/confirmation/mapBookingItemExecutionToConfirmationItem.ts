import { getConfirmationItemDisplayFields } from "~/lib/confirmation/getConfirmationItemDisplayFields";
import {
  createBookingConfirmationItemId,
  normalizeTimestamp,
} from "~/lib/confirmation/shared";
import type {
  ConfirmationItemStatus,
  MapBookingItemExecutionToConfirmationItemInput,
} from "~/types/confirmation";

const buildCheckoutItemKey = (tripItemId: number, inventoryId: string) => {
  return `trip-item:${tripItemId}:${inventoryId}`;
};

const mapItemStatus = (
  status: MapBookingItemExecutionToConfirmationItemInput["bookingItemExecution"]["status"],
): ConfirmationItemStatus => {
  switch (status) {
    case "succeeded":
      return "confirmed";
    case "requires_manual_review":
      return "requires_manual_review";
    case "failed":
    case "skipped":
      return "failed";
    case "pending":
    case "processing":
    default:
      return "pending";
  }
};

export const mapBookingItemExecutionToConfirmationItem = (
  input: MapBookingItemExecutionToConfirmationItemInput,
) => {
  const { bookingItemExecution, confirmationId } = input;
  const checkoutItem =
    input.checkoutSession.items.find(
      (item) =>
        buildCheckoutItemKey(item.tripItemId, item.inventory.inventoryId) ===
        bookingItemExecution.checkoutItemKey,
    ) || null;
  const display = getConfirmationItemDisplayFields({
    bookingItemExecution,
    checkoutItem,
  });
  const timestamp =
    normalizeTimestamp(input.now) ||
    bookingItemExecution.updatedAt ||
    bookingItemExecution.createdAt ||
    new Date().toISOString();

  return {
    id: createBookingConfirmationItemId(),
    confirmationId,
    bookingItemExecutionId: bookingItemExecution.id,
    checkoutItemKey: bookingItemExecution.checkoutItemKey,
    vertical: bookingItemExecution.vertical,
    status: mapItemStatus(bookingItemExecution.status),
    title: display.title,
    subtitle: display.subtitle,
    startAt: display.startAt,
    endAt: display.endAt,
    locationSummary: display.locationSummary,
    provider: bookingItemExecution.provider,
    providerBookingReference: bookingItemExecution.providerBookingReference,
    providerConfirmationCode: bookingItemExecution.providerConfirmationCode,
    detailsJson: display.detailsJson,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
