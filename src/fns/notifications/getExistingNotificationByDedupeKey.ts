import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { mapNotificationRow } from "~/fns/notifications/getNotification";
import type { NotificationRecord } from "~/types/notifications";

export const getExistingNotificationByDedupeKey = async (
  dedupeKey: string | null | undefined,
): Promise<NotificationRecord | null> => {
  const normalizedKey = String(dedupeKey || "").trim();
  if (!normalizedKey) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.dedupeKey, normalizedKey))
      .limit(1);

    return row ? mapNotificationRow(row) : null;
  });
};
