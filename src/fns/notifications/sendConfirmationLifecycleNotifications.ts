import { buildBookingConfirmationNotificationModel } from "~/fns/notifications/buildBookingConfirmationNotificationModel";
import { buildManualReviewNotificationModel } from "~/fns/notifications/buildManualReviewNotificationModel";
import { buildPartialBookingNotificationModel } from "~/fns/notifications/buildPartialBookingNotificationModel";
import { createAndSendNotification } from "~/fns/notifications/createAndSendNotification";
import { createNotificationRecord } from "~/fns/notifications/createNotificationRecord";
import { getNotificationDedupeKey } from "~/fns/notifications/getNotificationDedupeKey";
import { getNotificationProvider } from "~/fns/notifications/getNotificationProvider";
import { getNotificationRecipientForConfirmation } from "~/fns/notifications/getNotificationRecipientForConfirmation";
import { getNotificationSkipReason } from "~/fns/notifications/getNotificationSkipReason";
import type { BookingConfirmation } from "~/types/confirmation";
import type { NotificationEventType, SendNotificationResult } from "~/types/notifications";

const getEventTypeForConfirmation = (
  status: BookingConfirmation["status"],
): NotificationEventType | null => {
  if (status === "confirmed") return "booking_confirmation";
  if (status === "partial") return "booking_partial_confirmation";
  if (status === "requires_manual_review") return "booking_manual_review";
  return null;
};

export const sendConfirmationLifecycleNotifications = async (
  confirmation: BookingConfirmation,
  options: {
    resend?: boolean;
  } = {},
): Promise<{
  ok: boolean;
  eventType: NotificationEventType | null;
  status: SendNotificationResult["status"] | "skipped";
  message: string;
  notificationId: string | null;
}> => {
  const eventType = getEventTypeForConfirmation(confirmation.status);
  if (!eventType) {
    return {
      ok: false,
      eventType: null,
      status: "skipped",
      message: `No lifecycle notification is configured for confirmation status "${confirmation.status}".`,
      notificationId: null,
    };
  }

  const recipient = await getNotificationRecipientForConfirmation(confirmation);
  if (!recipient?.email) {
    const skipReason = getNotificationSkipReason({
      noRecipient: true,
    });
    const skipped = await createNotificationRecord({
      eventType,
      channel: "email",
      provider: getNotificationProvider(),
      recipient: {
        email: null,
        name: recipient?.name || null,
      },
      subject: `Notification skipped - ${confirmation.publicRef}`,
      payload: {
        version: "v1",
        renderModel: {
          eventType,
          subject: `Notification skipped - ${confirmation.publicRef}`,
          recipient: {
            email: null,
            name: recipient?.name || null,
          },
          greetingName: recipient?.name || null,
          headline: "Notification skipped",
          intro: skipReason?.message || "Recipient email is unavailable.",
          referenceLabel: "Confirmation reference",
          referenceValue: confirmation.publicRef,
          itemSummaries: [],
          primaryCtaLabel: "Open confirmation",
          primaryCtaHref: `/confirmation/${confirmation.publicRef}`,
          secondaryCtaLabel: null,
          secondaryCtaHref: null,
          ownershipMode: null,
          links: {
            confirmationUrl: `/confirmation/${confirmation.publicRef}`,
            itineraryUrl: null,
            resumeUrl: `/resume/${confirmation.publicRef}`,
            claimUrl: null,
          },
        },
      },
      relatedConfirmationId: confirmation.id,
      relatedCheckoutSessionId: confirmation.checkoutSessionId,
      dedupeKey: getNotificationDedupeKey({
        eventType,
        confirmationId: confirmation.id,
        recipientEmail: null,
      }),
      status: "skipped",
      skipReason: skipReason?.message || "Recipient email is unavailable.",
    });

    return {
      ok: false,
      eventType,
      status: "skipped",
      message: skipReason?.message || "Recipient email is unavailable.",
      notificationId: skipped.id,
    };
  }

  const model =
    eventType === "booking_confirmation"
      ? buildBookingConfirmationNotificationModel({
          confirmation,
          recipient,
        })
      : eventType === "booking_partial_confirmation"
        ? buildPartialBookingNotificationModel({
            confirmation,
            recipient,
          })
        : buildManualReviewNotificationModel({
            confirmation,
            recipient,
          });

  const dedupeKey = getNotificationDedupeKey({
    eventType,
    confirmationId: confirmation.id,
    checkoutSessionId: confirmation.checkoutSessionId,
    recipientEmail: recipient.email,
    variant: confirmation.status,
  });
  const provider = getNotificationProvider();
  const createAndSend = await createAndSendNotification({
    eventType,
    channel: "email",
    provider,
    recipient,
    subject: model.subject,
    payload: {
      version: "v1",
      renderModel: model,
    },
    dedupeKey: options.resend
      ? `${dedupeKey}:resend:${Date.now().toString(36)}`
      : dedupeKey,
    relatedConfirmationId: confirmation.id,
    relatedCheckoutSessionId: confirmation.checkoutSessionId,
    resend: Boolean(options.resend),
  });

  return {
    ok: createAndSend.result.ok,
    eventType,
    status: createAndSend.result.status,
    message: createAndSend.result.message,
    notificationId: createAndSend.notification.id,
  };
};
