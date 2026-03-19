import type {
  ItineraryAccessResult,
  OwnershipDisplayState,
} from "~/types/ownership";

export const getOwnershipDisplayState = (
  access: ItineraryAccessResult,
  options: {
    hasCurrentUser?: boolean;
    surface?: "confirmation" | "itinerary";
  } = {},
): OwnershipDisplayState => {
  const itineraryHref = access.itineraryRef
    ? `/itinerary/${access.itineraryRef}`
    : null;

  if (access.isOwner) {
    return {
      tone: "success",
      title: "Durable itinerary ownership is ready",
      message:
        access.ownershipMode === "user"
          ? "This itinerary is attached to your account and ready to reopen any time."
          : "This itinerary is saved to your current anonymous ownership session.",
      href: itineraryHref,
      label: options.surface === "itinerary" ? "Itinerary ready" : "View itinerary",
    };
  }

  if (access.isClaimable) {
    return {
      tone: "warning",
      title: options.hasCurrentUser
        ? "Attach this itinerary to your account"
        : "Claim this itinerary",
      message: options.hasCurrentUser
        ? "We found an anonymous ownership bridge for this itinerary. Attach it to your signed-in account to preserve the lineage."
        : "This itinerary belongs to an anonymous ownership bridge. Sign in to attach it to an account.",
      href: options.surface === "confirmation" ? itineraryHref : null,
      label: options.hasCurrentUser ? "Attach itinerary" : "Claim itinerary",
    };
  }

  if (access.reasonCode === "ALREADY_CLAIMED_BY_USER") {
    return {
      tone: "error",
      title: "This itinerary belongs to another account",
      message: access.message,
      href: null,
      label: "Access denied",
    };
  }

  return {
    tone: "info",
    title: "Itinerary ownership is required",
    message: access.message,
    href: null,
    label: "Ownership required",
  };
};
