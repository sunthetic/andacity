import type { RequestEventBase } from "@builder.io/qwik-city";
import { sendItineraryLifecycleNotifications } from "~/fns/notifications/sendItineraryLifecycleNotifications";
import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { attachAnonymousOwnershipsToUser } from "~/lib/ownership/attachAnonymousOwnershipsToUser";
import { claimAnonymousItineraryOwnership } from "~/lib/ownership/claimAnonymousItineraryOwnership";
import {
  clearOwnershipClaimToken,
  getCurrentOwnershipContext,
} from "~/lib/ownership/getCurrentOwnershipContext";

export const claimItineraryOwnership = async (
  itineraryRef: string,
  event: Pick<RequestEventBase, "cookie" | "request" | "sharedMap" | "url">,
) => {
  const normalizedRef = String(itineraryRef || "")
    .trim()
    .toUpperCase();
  const context = getCurrentOwnershipContext(event);
  const result = await claimAnonymousItineraryOwnership({
    itineraryRef: normalizedRef,
    claimToken: context.claimTokensByItineraryRef[normalizedRef] || null,
    ownerUserId: context.ownerUserId,
    ownerSessionId: context.ownerSessionId,
    source: "manual_claim",
  });

  if (result.ok && result.itineraryRef) {
    clearOwnershipClaimToken(event, result.itineraryRef);
  }

  return result;
};

export const attachAnonymousItinerariesToCurrentUser = async (
  event: Pick<RequestEventBase, "cookie" | "request" | "sharedMap" | "url">,
) => {
  const context = getCurrentOwnershipContext(event);
  const result = await attachAnonymousOwnershipsToUser({
    ownerUserId: context.ownerUserId,
    ownerSessionId: context.ownerSessionId,
    claimTokensByItineraryRef: context.claimTokensByItineraryRef,
  });

  for (const itineraryRef of result.attachedItineraryRefs) {
    clearOwnershipClaimToken(event, itineraryRef);
  }

  return result;
};

export type ItineraryNotificationActionResult = {
  ok: boolean;
  status: string;
  message: string;
  code:
    | "NOTIFICATION_SENT"
    | "NOTIFICATION_SKIPPED"
    | "NOTIFICATION_FAILED"
    | "NOTIFICATION_RESENT";
};

export const resendItineraryNotification = async (
  itineraryRef: string,
): Promise<ItineraryNotificationActionResult> => {
  const normalizedRef = String(itineraryRef || "").trim().toUpperCase();
  const itinerary = await getItineraryByPublicRef(normalizedRef);
  if (!itinerary) {
    return {
      ok: false,
      status: "failed",
      message: "Itinerary could not be found for resend.",
      code: "NOTIFICATION_FAILED",
    };
  }

  try {
    const result = await sendItineraryLifecycleNotifications(itinerary, {
      resend: true,
    });

    if (result.status === "sent" || result.status === "delivered") {
      return {
        ok: true,
        status: result.status,
        message: "Itinerary notification resent.",
        code: "NOTIFICATION_RESENT",
      };
    }

    if (result.status === "skipped") {
      return {
        ok: false,
        status: result.status,
        message: result.message,
        code: "NOTIFICATION_SKIPPED",
      };
    }

    return {
      ok: false,
      status: result.status,
      message: result.message,
      code: "NOTIFICATION_FAILED",
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Itinerary notification resend failed.",
      code: "NOTIFICATION_FAILED",
    };
  }
};
