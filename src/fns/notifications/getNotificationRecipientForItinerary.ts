import { getNotificationRecipientForConfirmation } from "~/fns/notifications/getNotificationRecipientForConfirmation";
import type { NotificationRecipient } from "~/types/notifications";
import type { OwnedItinerary } from "~/types/itinerary";

export const getNotificationRecipientForItinerary = async (
  itinerary: Pick<
    OwnedItinerary,
    "checkoutSessionId" | "ownerUserId" | "ownerSessionId"
  >,
): Promise<NotificationRecipient | null> => {
  const baseRecipient = await getNotificationRecipientForConfirmation({
    checkoutSessionId: itinerary.checkoutSessionId,
  });
  if (!baseRecipient) return null;

  return {
    ...baseRecipient,
    ownerUserId: itinerary.ownerUserId || null,
    ownerSessionId: itinerary.ownerSessionId || null,
  };
};
