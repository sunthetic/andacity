import { buildConfirmationItemSummaries } from "~/fns/notifications/buildNotificationItemSummaries";
import { getNotificationLinks } from "~/fns/notifications/getNotificationLinks";
import type { BookingConfirmation } from "~/types/confirmation";
import type {
  NotificationRecipient,
  NotificationRenderModel,
} from "~/types/notifications";

export const buildPartialBookingNotificationModel = (input: {
  confirmation: BookingConfirmation;
  recipient: NotificationRecipient;
}): NotificationRenderModel => {
  const links = getNotificationLinks({
    confirmationRef: input.confirmation.publicRef,
    itineraryRef: input.confirmation.summaryJson?.itineraryRef || null,
  });
  const summary = input.confirmation.summaryJson;

  return {
    eventType: "booking_partial_confirmation",
    subject: `Your booking is partially confirmed - ${input.confirmation.publicRef}`,
    recipient: input.recipient,
    greetingName: input.recipient.name || null,
    headline: "Your booking is partially confirmed.",
    intro:
      summary && summary.unresolvedItemCount > 0
        ? `${summary.unresolvedItemCount} item(s) still need follow-up. Confirmed details are saved and available now.`
        : "Some items are still pending or need follow-up. Confirmed details are saved and available now.",
    referenceLabel: "Confirmation reference",
    referenceValue: input.confirmation.publicRef,
    itemSummaries: buildConfirmationItemSummaries(input.confirmation.items),
    primaryCtaLabel: "Review confirmation",
    primaryCtaHref:
      links.confirmationUrl || `/confirmation/${input.confirmation.publicRef}`,
    secondaryCtaLabel: links.itineraryUrl ? "Open itinerary" : null,
    secondaryCtaHref: links.itineraryUrl,
    ownershipMode: null,
    links,
  };
};
