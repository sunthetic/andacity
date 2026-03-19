import { buildConfirmationItemSummaries } from "~/fns/notifications/buildNotificationItemSummaries";
import { getNotificationLinks } from "~/fns/notifications/getNotificationLinks";
import type { BookingConfirmation } from "~/types/confirmation";
import type {
  NotificationRecipient,
  NotificationRenderModel,
} from "~/types/notifications";

export const buildBookingConfirmationNotificationModel = (input: {
  confirmation: BookingConfirmation;
  recipient: NotificationRecipient;
}): NotificationRenderModel => {
  const links = getNotificationLinks({
    confirmationRef: input.confirmation.publicRef,
    itineraryRef: input.confirmation.summaryJson?.itineraryRef || null,
  });

  return {
    eventType: "booking_confirmation",
    subject: `Your booking is confirmed - ${input.confirmation.publicRef}`,
    recipient: input.recipient,
    greetingName: input.recipient.name || null,
    headline: "Your booking is confirmed.",
    intro:
      "Your post-booking confirmation has been saved. You can reopen it any time from the link below.",
    referenceLabel: "Confirmation reference",
    referenceValue: input.confirmation.publicRef,
    itemSummaries: buildConfirmationItemSummaries(input.confirmation.items),
    primaryCtaLabel: "Open confirmation",
    primaryCtaHref:
      links.confirmationUrl || `/confirmation/${input.confirmation.publicRef}`,
    secondaryCtaLabel: links.itineraryUrl ? "Open itinerary" : null,
    secondaryCtaHref: links.itineraryUrl,
    ownershipMode: null,
    links,
  };
};
