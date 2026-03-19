import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import {
  isRecord,
  normalizeNotificationChannel,
  normalizeNotificationEventType,
  normalizeNotificationProvider,
  normalizeNotificationStatus,
  normalizeTimestamp,
  toNullableText,
} from "~/fns/notifications/shared";
import type { NotificationRecord } from "~/types/notifications";

type NotificationRow = typeof notifications.$inferSelect;

export const mapNotificationRow = (row: NotificationRow): NotificationRecord => {
  return {
    id: row.id,
    eventType: normalizeNotificationEventType(row.eventType),
    channel: normalizeNotificationChannel(row.channel),
    provider: normalizeNotificationProvider(row.provider),
    status: normalizeNotificationStatus(row.status),
    recipientJson: isRecord(row.recipientJson)
      ? {
          email: toNullableText(row.recipientJson.email),
          name: toNullableText(row.recipientJson.name),
          ownerUserId: toNullableText(row.recipientJson.ownerUserId),
          ownerSessionId: toNullableText(row.recipientJson.ownerSessionId),
        }
      : {
          email: null,
          name: null,
          ownerUserId: null,
          ownerSessionId: null,
        },
    subject: row.subject,
    payloadJson: isRecord(row.payloadJson)
      ? (row.payloadJson as NotificationRecord["payloadJson"])
      : {
          version: "v1",
          renderModel: {
            eventType: normalizeNotificationEventType(row.eventType),
            subject: row.subject,
            recipient: {
              email: null,
              name: null,
            },
            greetingName: null,
            headline: "Notification",
            intro: "Notification payload unavailable.",
            referenceLabel: "Reference",
            referenceValue: "N/A",
            itemSummaries: [],
            primaryCtaLabel: "Open",
            primaryCtaHref: "/",
            secondaryCtaLabel: null,
            secondaryCtaHref: null,
            ownershipMode: null,
            links: {
              confirmationUrl: null,
              itineraryUrl: null,
              resumeUrl: null,
              claimUrl: null,
            },
          },
        },
    providerMessageId: toNullableText(row.providerMessageId),
    providerMetadata: isRecord(row.providerMetadataJson)
      ? row.providerMetadataJson
      : null,
    dedupeKey: toNullableText(row.dedupeKey),
    relatedConfirmationId: toNullableText(row.relatedConfirmationId),
    relatedItineraryId: toNullableText(row.relatedItineraryId),
    relatedCheckoutSessionId: toNullableText(row.relatedCheckoutSessionId),
    sentAt: normalizeTimestamp(row.sentAt),
    deliveredAt: normalizeTimestamp(row.deliveredAt),
    failedAt: normalizeTimestamp(row.failedAt),
    failureMessage: toNullableText(row.failureMessage),
    skipReason: toNullableText(row.skipReason),
    createdAt: normalizeTimestamp(row.createdAt) || new Date().toISOString(),
    updatedAt: normalizeTimestamp(row.updatedAt) || new Date().toISOString(),
  };
};

export const getNotification = async (
  notificationId: string,
): Promise<NotificationRecord | null> => {
  const normalizedId = String(notificationId || "").trim();
  if (!normalizedId) return null;

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, normalizedId))
      .limit(1);

    return row ? mapNotificationRow(row) : null;
  });
};
