import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getNotification } from "~/fns/notifications/getNotification";
import { getNotificationProvider } from "~/fns/notifications/getNotificationProvider";
import { createNotificationId } from "~/fns/notifications/shared";
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationRecord,
  NotificationRecipient,
  NotificationStatus,
} from "~/types/notifications";

export const createNotificationRecord = async (input: {
  eventType: NotificationRecord["eventType"];
  channel?: NotificationChannel;
  provider?: NotificationProvider;
  status?: NotificationStatus;
  recipient: NotificationRecipient;
  subject: string;
  payload: NotificationPayload;
  dedupeKey?: string | null;
  relatedConfirmationId?: string | null;
  relatedItineraryId?: string | null;
  relatedCheckoutSessionId?: string | null;
  skipReason?: string | null;
  failureMessage?: string | null;
  now?: Date | string | null;
}) => {
  const now = input.now ? new Date(input.now) : new Date();
  const id = createNotificationId();
  const provider = input.provider || getNotificationProvider();
  const channel = input.channel || "email";
  const status = input.status || "draft";

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db.insert(notifications).values({
      id,
      eventType: input.eventType,
      channel,
      provider,
      status,
      recipientJson: input.recipient,
      subject: input.subject,
      payloadJson: input.payload,
      providerMessageId: null,
      providerMetadataJson: {},
      dedupeKey: input.dedupeKey || null,
      relatedConfirmationId: input.relatedConfirmationId || null,
      relatedItineraryId: input.relatedItineraryId || null,
      relatedCheckoutSessionId: input.relatedCheckoutSessionId || null,
      sentAt: null,
      deliveredAt: null,
      failedAt: status === "failed" ? now : null,
      failureMessage: input.failureMessage || null,
      skipReason: input.skipReason || null,
      createdAt: now,
      updatedAt: now,
    });
  });

  const created = await getNotification(id);
  if (!created) {
    throw new Error(`Notification ${id} could not be loaded after creation.`);
  }

  return created;
};
