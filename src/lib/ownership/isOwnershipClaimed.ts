import type { ItineraryOwnership } from "~/types/ownership";

export const isOwnershipClaimed = (ownership: ItineraryOwnership | null) => {
  return Boolean(
    ownership &&
      ownership.ownershipMode === "user" &&
      (ownership.claimedAt || ownership.source === "manual_claim"),
  );
};
