import type { BookingConfirmationItem } from "~/types/confirmation";
import type { BookingItemExecution } from "~/types/booking";
import type { CheckoutSession } from "~/types/checkout";
import { buildItineraryItemStatus } from "~/lib/itinerary/buildItineraryStatus";
import {
  createItineraryItemId,
  normalizeTimestamp,
  toNullableText,
} from "~/lib/itinerary/shared";

const getCheckoutItem = (
  checkoutSession: CheckoutSession,
  checkoutItemKey: string,
) => {
  return (
    checkoutSession.items.find(
      (item) =>
        `trip-item:${item.tripItemId}:${item.inventory.inventoryId}` ===
        checkoutItemKey,
    ) || null
  );
};

export const mapConfirmationItemToItineraryItem = (input: {
  itineraryId: string;
  confirmationItem: BookingConfirmationItem;
  bookingItemExecution: BookingItemExecution | null;
  checkoutSession: CheckoutSession;
  now?: Date | string | null;
}) => {
  const { confirmationItem } = input;
  const checkoutItem = getCheckoutItem(
    input.checkoutSession,
    confirmationItem.checkoutItemKey,
  );
  const timestamp =
    normalizeTimestamp(input.now) ||
    confirmationItem.updatedAt ||
    confirmationItem.createdAt ||
    new Date().toISOString();

  return {
    id: createItineraryItemId(),
    itineraryId: input.itineraryId,
    confirmationItemId: confirmationItem.id,
    bookingItemExecutionId:
      input.bookingItemExecution?.id || confirmationItem.bookingItemExecutionId,
    checkoutItemKey: confirmationItem.checkoutItemKey,
    vertical: confirmationItem.vertical,
    status: buildItineraryItemStatus(confirmationItem, {
      now: input.now,
    }),
    canonicalEntityId: checkoutItem?.entityId ?? null,
    canonicalBookableEntityId: checkoutItem?.bookableEntityId ?? null,
    canonicalInventoryId: checkoutItem?.inventory.inventoryId ?? null,
    provider:
      toNullableText(confirmationItem.provider) ||
      toNullableText(input.bookingItemExecution?.provider) ||
      toNullableText(checkoutItem?.inventory.bookableEntity?.provider) ||
      toNullableText(checkoutItem?.inventory.providerMetadata?.provider),
    providerBookingReference:
      toNullableText(confirmationItem.providerBookingReference) ||
      toNullableText(input.bookingItemExecution?.providerBookingReference),
    providerConfirmationCode:
      toNullableText(confirmationItem.providerConfirmationCode) ||
      toNullableText(input.bookingItemExecution?.providerConfirmationCode),
    title: confirmationItem.title,
    subtitle: confirmationItem.subtitle,
    startAt: confirmationItem.startAt,
    endAt: confirmationItem.endAt,
    locationSummary: confirmationItem.locationSummary,
    detailsJson: {
      ...(confirmationItem.detailsJson || {}),
      sourceConfirmationStatus: confirmationItem.status,
      tripItemId: checkoutItem?.tripItemId ?? null,
      sourceConfirmationItemId: confirmationItem.id,
      bookingItemExecutionId:
        input.bookingItemExecution?.id || confirmationItem.bookingItemExecutionId,
      checkoutSnapshot: checkoutItem
        ? {
            entityId: checkoutItem.entityId,
            bookableEntityId: checkoutItem.bookableEntityId,
            inventoryId: checkoutItem.inventory.inventoryId,
            pricing: checkoutItem.pricing,
          }
        : null,
    } satisfies Record<string, unknown>,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
