import { createOrResumeNotification } from "~/fns/notifications/createOrResumeNotification";
import { sendNotificationRecord } from "~/fns/notifications/sendNotificationRecord";
import type { SendNotificationInput, SendNotificationResult } from "~/types/notifications";

export const createAndSendNotification = async (
  input: SendNotificationInput,
): Promise<{
  notification: Awaited<
    ReturnType<typeof createOrResumeNotification>
  >["notification"];
  created: boolean;
  resumed: boolean;
  sent: boolean;
  result: SendNotificationResult;
}> => {
  const createdOrResumed = await createOrResumeNotification(input);
  const immutableStatus =
    createdOrResumed.notification.status === "sent" ||
    createdOrResumed.notification.status === "delivered" ||
    createdOrResumed.notification.status === "skipped" ||
    createdOrResumed.notification.status === "canceled";

  if (immutableStatus && !input.resend) {
    return {
      ...createdOrResumed,
      sent: false,
      result: {
        ok:
          createdOrResumed.notification.status === "sent" ||
          createdOrResumed.notification.status === "delivered",
        provider: createdOrResumed.notification.provider,
        providerMessageId: createdOrResumed.notification.providerMessageId,
        status: createdOrResumed.notification.status,
        message:
          createdOrResumed.notification.skipReason ||
          createdOrResumed.notification.failureMessage ||
          "Notification already finalized.",
        providerMetadata: createdOrResumed.notification.providerMetadata,
        notificationId: createdOrResumed.notification.id,
        skippedReason: createdOrResumed.notification.skipReason,
      },
    };
  }

  const sent = await sendNotificationRecord(createdOrResumed.notification.id, {
    force: Boolean(input.resend),
  });

  return {
    notification: sent.notification,
    created: createdOrResumed.created,
    resumed: createdOrResumed.resumed,
    sent: true,
    result: sent.result,
  };
};
