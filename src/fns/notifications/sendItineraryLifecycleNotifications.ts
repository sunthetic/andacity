import { buildItineraryReadyNotificationModel } from "~/fns/notifications/buildItineraryReadyNotificationModel";
import { createAndSendNotification } from "~/fns/notifications/createAndSendNotification";
import { createNotificationRecord } from "~/fns/notifications/createNotificationRecord";
import { getNotificationDedupeKey } from "~/fns/notifications/getNotificationDedupeKey";
import { getNotificationProvider } from "~/fns/notifications/getNotificationProvider";
import { getNotificationRecipientForItinerary } from "~/fns/notifications/getNotificationRecipientForItinerary";
import { getNotificationSkipReason } from "~/fns/notifications/getNotificationSkipReason";
import type { OwnedItinerary } from "~/types/itinerary";
import type { NotificationEventType, SendNotificationResult } from "~/types/notifications";

const getItineraryEventType = (itinerary: OwnedItinerary): NotificationEventType => {
  return itinerary.ownership?.ownershipMode === "anonymous"
    ? "itinerary_claim_available"
    : "itinerary_ready";
};

export const sendItineraryLifecycleNotifications = async (
  itinerary: OwnedItinerary,
  options: {
    resend?: boolean;
  } = {},
): Promise<{
  ok: boolean;
  eventType: NotificationEventType;
  status: SendNotificationResult["status"] | "skipped";
  message: string;
  notificationId: string | null;
}> => {
  const eventType = getItineraryEventType(itinerary);
  const recipient = await getNotificationRecipientForItinerary(itinerary);

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
      subject: `Notification skipped - ${itinerary.publicRef}`,
      payload: {
        version: "v1",
        renderModel: {
          eventType,
          subject: `Notification skipped - ${itinerary.publicRef}`,
          recipient: {
            email: null,
            name: recipient?.name || null,
          },
          greetingName: recipient?.name || null,
          headline: "Notification skipped",
          intro: skipReason?.message || "Recipient email is unavailable.",
          referenceLabel: "Itinerary reference",
          referenceValue: itinerary.publicRef,
          itemSummaries: [],
          primaryCtaLabel: "Open itinerary",
          primaryCtaHref: `/itinerary/${itinerary.publicRef}`,
          secondaryCtaLabel: null,
          secondaryCtaHref: null,
          ownershipMode: itinerary.ownership?.ownershipMode || null,
          links: {
            confirmationUrl: null,
            itineraryUrl: `/itinerary/${itinerary.publicRef}`,
            resumeUrl: `/resume/${itinerary.publicRef}`,
            claimUrl:
              itinerary.ownership?.ownershipMode === "anonymous"
                ? `/itinerary/${itinerary.publicRef}?resume=claim`
                : null,
          },
        },
      },
      relatedItineraryId: itinerary.id,
      relatedConfirmationId: itinerary.confirmationId,
      relatedCheckoutSessionId: itinerary.checkoutSessionId,
      dedupeKey: getNotificationDedupeKey({
        eventType,
        itineraryId: itinerary.id,
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

  const model = buildItineraryReadyNotificationModel({
    itinerary,
    recipient,
  });
  const dedupeKey = getNotificationDedupeKey({
    eventType,
    itineraryId: itinerary.id,
    confirmationId: itinerary.confirmationId,
    checkoutSessionId: itinerary.checkoutSessionId,
    recipientEmail: recipient.email,
    ownershipMode: itinerary.ownership?.ownershipMode || null,
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
    relatedItineraryId: itinerary.id,
    relatedConfirmationId: itinerary.confirmationId,
    relatedCheckoutSessionId: itinerary.checkoutSessionId,
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
