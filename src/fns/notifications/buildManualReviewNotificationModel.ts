import { buildConfirmationItemSummaries } from "~/fns/notifications/buildNotificationItemSummaries";
import { getNotificationLinks } from "~/fns/notifications/getNotificationLinks";
import type { BookingConfirmation } from "~/types/confirmation";
import type {
  NotificationRecipient,
  NotificationRenderModel,
} from "~/types/notifications";

export const buildManualReviewNotificationModel = (input: {
  confirmation: BookingConfirmation;
  recipient: NotificationRecipient;
}): NotificationRenderModel => {
  const links = getNotificationLinks({
    confirmationRef: input.confirmation.publicRef,
    itineraryRef: input.confirmation.summaryJson?.itineraryRef || null,
  });

  return {
    eventType: "booking_manual_review",
    subject: `Booking requires manual review - ${input.confirmation.publicRef}`,
    recipient: input.recipient,
    greetingName: input.recipient.name || null,
    headline: "Your booking needs manual review.",
    intro:
      "At least one item still needs manual provider follow-up. Confirmed items remain saved in your confirmation.",
    referenceLabel: "Confirmation reference",
    referenceValue: input.confirmation.publicRef,
    itemSummaries: buildConfirmationItemSummaries(input.confirmation.items),
    primaryCtaLabel: "Open confirmation",
    primaryCtaHref:
      links.confirmationUrl || `/confirmation/${input.confirmation.publicRef}`,
    secondaryCtaLabel: links.resumeUrl ? "Resume this trip" : null,
    secondaryCtaHref: links.resumeUrl,
    ownershipMode: null,
    links,
  };
};
