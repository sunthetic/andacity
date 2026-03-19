import { createNotificationRecord } from "~/fns/notifications/createNotificationRecord";
import { getExistingNotificationByDedupeKey } from "~/fns/notifications/getExistingNotificationByDedupeKey";
import type { NotificationRecord, SendNotificationInput } from "~/types/notifications";

const isUniqueViolationError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const source = error as { code?: string; cause?: { code?: string } };
  return source.code === "23505" || source.cause?.code === "23505";
};

export const createOrResumeNotification = async (
  input: SendNotificationInput,
): Promise<{
  notification: NotificationRecord;
  created: boolean;
  resumed: boolean;
}> => {
  const dedupeKey = input.dedupeKey ? String(input.dedupeKey).trim() : null;

  if (dedupeKey && !input.resend) {
    const existing = await getExistingNotificationByDedupeKey(dedupeKey);
    if (existing) {
      return {
        notification: existing,
        created: false,
        resumed: true,
      };
    }
  }

  try {
    const created = await createNotificationRecord({
      eventType: input.eventType,
      channel: input.channel,
      provider: input.provider,
      recipient: input.recipient,
      subject: input.subject,
      payload: input.payload,
      dedupeKey: dedupeKey,
      relatedConfirmationId: input.relatedConfirmationId || null,
      relatedItineraryId: input.relatedItineraryId || null,
      relatedCheckoutSessionId: input.relatedCheckoutSessionId || null,
      status: "draft",
    });

    return {
      notification: created,
      created: true,
      resumed: false,
    };
  } catch (error) {
    if (dedupeKey && !input.resend && isUniqueViolationError(error)) {
      const existing = await getExistingNotificationByDedupeKey(dedupeKey);
      if (existing) {
        return {
          notification: existing,
          created: false,
          resumed: true,
        };
      }
    }

    throw error;
  }
};
