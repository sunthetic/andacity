import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { sendNotification } from "~/fns/notifications/adapters/sendNotification";
import { getNotification } from "~/fns/notifications/getNotification";
import { getNotificationProviderConfig } from "~/fns/notifications/getNotificationProviderConfig";
import { getNotificationSkipReason } from "~/fns/notifications/getNotificationSkipReason";
import type { NotificationStatus, SendNotificationResult } from "~/types/notifications";

const updateNotificationStatus = async (input: {
  notificationId: string;
  status: NotificationStatus;
  providerMessageId?: string | null;
  providerMetadata?: Record<string, unknown> | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  failureMessage?: string | null;
  skipReason?: string | null;
  now?: Date;
}) => {
  const now = input.now || new Date();

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db
      .update(notifications)
      .set({
        status: input.status,
        providerMessageId: input.providerMessageId ?? null,
        providerMetadataJson: input.providerMetadata ?? {},
        sentAt: input.sentAt ?? null,
        deliveredAt: input.deliveredAt ?? null,
        failedAt: input.failedAt ?? null,
        failureMessage: input.failureMessage ?? null,
        skipReason: input.skipReason ?? null,
        updatedAt: now,
      })
      .where(eq(notifications.id, input.notificationId));
  });
};

export const sendNotificationRecord = async (
  notificationId: string,
  options: {
    force?: boolean;
    now?: Date | string | null;
  } = {},
): Promise<{
  notification: NonNullable<Awaited<ReturnType<typeof getNotification>>>;
  result: SendNotificationResult;
}> => {
  const record = await getNotification(notificationId);
  if (!record) {
    throw new Error(`Notification ${notificationId} does not exist.`);
  }

  const now = options.now ? new Date(options.now) : new Date();
  const immutableStatus =
    record.status === "sent" ||
    record.status === "delivered" ||
    record.status === "skipped" ||
    record.status === "canceled";

  if (immutableStatus && !options.force) {
    return {
      notification: record,
      result: {
        ok: record.status === "sent" || record.status === "delivered",
        provider: record.provider,
        providerMessageId: record.providerMessageId,
        status: record.status,
        message:
          record.status === "skipped"
            ? record.skipReason || "Notification was previously skipped."
            : "Notification already finalized.",
        providerMetadata: record.providerMetadata,
        notificationId: record.id,
        skippedReason: record.skipReason,
      },
    };
  }

  const recipientEmail = String(record.recipientJson.email || "").trim();
  if (!recipientEmail) {
    const skipReason = getNotificationSkipReason({
      noRecipient: true,
    });
    await updateNotificationStatus({
      notificationId: record.id,
      status: skipReason?.status || "skipped",
      skipReason: skipReason?.message || "Recipient email missing.",
      now,
    });
    const updated = await getNotification(record.id);
    if (!updated) {
      throw new Error(`Notification ${record.id} could not be loaded after skip.`);
    }
    return {
      notification: updated,
      result: {
        ok: false,
        provider: updated.provider,
        providerMessageId: null,
        status: updated.status,
        message: skipReason?.message || "Recipient email missing.",
        providerMetadata: updated.providerMetadata,
        notificationId: updated.id,
        skippedReason: updated.skipReason,
      },
    };
  }

  try {
    getNotificationProviderConfig(record.provider);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Notification provider configuration is unavailable.";
    await updateNotificationStatus({
      notificationId: record.id,
      status: "failed",
      failedAt: now,
      failureMessage: message,
      now,
    });
    const updated = await getNotification(record.id);
    if (!updated) {
      throw new Error(`Notification ${record.id} could not be loaded after failure.`);
    }
    return {
      notification: updated,
      result: {
        ok: false,
        provider: updated.provider,
        providerMessageId: null,
        status: "failed",
        message,
        providerMetadata: updated.providerMetadata,
        notificationId: updated.id,
        skippedReason: null,
      },
    };
  }

  await updateNotificationStatus({
    notificationId: record.id,
    status: "queued",
    now,
  });

  try {
    const adapterResult = await sendNotification(record.provider, {
      channel: record.channel,
      recipient: record.recipientJson,
      subject: record.subject,
      payload: record.payloadJson,
    });

    const nextStatus =
      adapterResult.status === "failed" || adapterResult.status === "skipped"
        ? adapterResult.status
        : adapterResult.status === "delivered"
          ? "delivered"
          : "sent";
    await updateNotificationStatus({
      notificationId: record.id,
      status: nextStatus,
      providerMessageId: adapterResult.providerMessageId,
      providerMetadata: adapterResult.providerMetadata,
      sentAt: nextStatus === "sent" || nextStatus === "delivered" ? now : null,
      deliveredAt: nextStatus === "delivered" ? now : null,
      failedAt: nextStatus === "failed" ? now : null,
      failureMessage: nextStatus === "failed" ? adapterResult.message : null,
      skipReason: nextStatus === "skipped" ? adapterResult.message : null,
      now,
    });

    const updated = await getNotification(record.id);
    if (!updated) {
      throw new Error(`Notification ${record.id} could not be loaded after send.`);
    }

    return {
      notification: updated,
      result: {
        ok: nextStatus === "sent" || nextStatus === "delivered",
        provider: updated.provider,
        providerMessageId: updated.providerMessageId,
        status: updated.status,
        message: adapterResult.message,
        providerMetadata: updated.providerMetadata,
        notificationId: updated.id,
        skippedReason: updated.skipReason,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Notification delivery failed.";
    await updateNotificationStatus({
      notificationId: record.id,
      status: "failed",
      failedAt: now,
      failureMessage: message,
      now,
    });
    const updated = await getNotification(record.id);
    if (!updated) {
      throw new Error(`Notification ${record.id} could not be loaded after send failure.`);
    }

    return {
      notification: updated,
      result: {
        ok: false,
        provider: updated.provider,
        providerMessageId: updated.providerMessageId,
        status: "failed",
        message,
        providerMetadata: updated.providerMetadata,
        notificationId: updated.id,
        skippedReason: null,
      },
    };
  }
};
