import { buildItineraryItemSummaries } from "~/fns/notifications/buildNotificationItemSummaries";
import { getNotificationLinks } from "~/fns/notifications/getNotificationLinks";
import type {
  NotificationRecipient,
  NotificationRenderModel,
} from "~/types/notifications";
import type { OwnedItinerary } from "~/types/itinerary";

export const buildItineraryReadyNotificationModel = (input: {
  itinerary: OwnedItinerary;
  recipient: NotificationRecipient;
}): NotificationRenderModel => {
  const ownershipMode = input.itinerary.ownership?.ownershipMode || null;
  const includeClaimFlow = ownershipMode === "anonymous";
  const links = getNotificationLinks({
    itineraryRef: input.itinerary.publicRef,
    confirmationRef: null,
    ownershipMode,
    includeClaimFlow,
  });
  const eventType =
    ownershipMode === "anonymous" ? "itinerary_claim_available" : "itinerary_ready";

  return {
    eventType,
    subject:
      ownershipMode === "anonymous"
        ? `Your itinerary is ready to claim - ${input.itinerary.publicRef}`
        : `Your itinerary is ready - ${input.itinerary.publicRef}`,
    recipient: input.recipient,
    greetingName: input.recipient.name || null,
    headline:
      ownershipMode === "anonymous"
        ? "Your itinerary is ready and claimable."
        : "Your itinerary is ready.",
    intro:
      ownershipMode === "anonymous"
        ? "Use the claim link to keep ownership and retrieval access tied to your account."
        : "Your itinerary is available with durable post-booking access.",
    referenceLabel: "Itinerary reference",
    referenceValue: input.itinerary.publicRef,
    itemSummaries: buildItineraryItemSummaries(input.itinerary.items),
    primaryCtaLabel:
      ownershipMode === "anonymous" ? "Claim itinerary" : "Open itinerary",
    primaryCtaHref:
      (ownershipMode === "anonymous" ? links.claimUrl : links.itineraryUrl) ||
      `/itinerary/${input.itinerary.publicRef}`,
    secondaryCtaLabel: links.resumeUrl ? "Resume with reference" : null,
    secondaryCtaHref: links.resumeUrl,
    ownershipMode,
    links,
  };
};
