import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { mapNotificationRow } from "~/fns/notifications/getNotification";
import type {
  NotificationEventType,
  NotificationRecord,
} from "~/types/notifications";

export const getNotificationsForEntity = async (input: {
  confirmationId?: string | null;
  itineraryId?: string | null;
  checkoutSessionId?: string | null;
  eventTypes?: NotificationEventType[] | null;
  limit?: number;
}): Promise<NotificationRecord[]> => {
  const confirmationId = String(input.confirmationId || "").trim();
  const itineraryId = String(input.itineraryId || "").trim();
  const checkoutSessionId = String(input.checkoutSessionId || "").trim();
  const eventTypes = input.eventTypes || null;
  const limit = Math.max(1, Math.min(100, input.limit || 50));

  if (!confirmationId && !itineraryId && !checkoutSessionId) return [];

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const filters = [];

    if (confirmationId) {
      filters.push(eq(notifications.relatedConfirmationId, confirmationId));
    }

    if (itineraryId) {
      filters.push(eq(notifications.relatedItineraryId, itineraryId));
    }

    if (checkoutSessionId) {
      filters.push(eq(notifications.relatedCheckoutSessionId, checkoutSessionId));
    }

    const clauses = [...filters];
    if (eventTypes && eventTypes.length > 0) {
      clauses.push(inArray(notifications.eventType, eventTypes));
    }

    const predicate =
      clauses.length === 1
        ? clauses[0]
        : clauses.length > 1
          ? and(...clauses)
          : null;

    const baseQuery = db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
    const rows = predicate
      ? await baseQuery.where(predicate).limit(limit)
      : await baseQuery.limit(limit);

    return rows.map((row) => mapNotificationRow(row));
  });
};
