import { buildSavedTravelerSummary } from "~/fns/saved-travelers/buildSavedTravelerSummary";
import { getSavedTravelerProfilesForUser } from "~/fns/saved-travelers/getSavedTravelerProfilesForUser";
import { getCheckoutTravelerRequirements } from "~/fns/travelers/getCheckoutTravelerRequirements";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import type {
  CheckoutSavedTravelerSuggestion,
  SavedTravelerProfile,
} from "~/types/saved-travelers";

const scoreSavedTraveler = (
  traveler: SavedTravelerProfile,
  checkoutItems: CheckoutItemSnapshot[],
) => {
  let score = 0;
  const reasons: string[] = [];
  const requirements = getCheckoutTravelerRequirements(checkoutItems);
  const roles = new Set(requirements.map((requirement) => requirement.role));

  if (traveler.isDefault) {
    score += 40;
    reasons.push("Default profile");
  }

  if (traveler.email || traveler.phone) {
    score += 10;
    if (
      roles.has("primary_contact") ||
      roles.has("guest") ||
      roles.has("driver")
    ) {
      reasons.push("Includes reusable contact details");
    }
  }

  if (traveler.driverAge != null && roles.has("driver")) {
    score += 20;
    reasons.push("Includes driver details");
  }

  if (
    traveler.documentType === "passport" &&
    requirements.some((requirement) =>
      Boolean(requirement.metadata?.requiresPassport),
    )
  ) {
    score += 20;
    reasons.push("Includes passport details");
  }

  if (traveler.dateOfBirth) {
    score += 10;
  }

  if (
    requirements.some(
      (requirement) =>
        requirement.travelerType == null ||
        requirement.travelerType === traveler.type,
    )
  ) {
    score += 10;
    reasons.push("Matches current checkout traveler type");
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)),
  };
};

export const rankSavedTravelersForCheckout = (input: {
  profiles: SavedTravelerProfile[];
  checkoutItems: CheckoutItemSnapshot[];
}): CheckoutSavedTravelerSuggestion[] => {
  return input.profiles
    .map((profile) => {
      const scoring = scoreSavedTraveler(profile, input.checkoutItems);
      return {
        profile,
        summary: buildSavedTravelerSummary(profile),
        reasons: scoring.reasons,
        score: scoring.score,
      } satisfies CheckoutSavedTravelerSuggestion;
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.profile.isDefault !== right.profile.isDefault) {
        return Number(right.profile.isDefault) - Number(left.profile.isDefault);
      }
      return right.profile.updatedAt.localeCompare(left.profile.updatedAt);
    });
};

export const getCheckoutSavedTravelerSuggestions = async (input: {
  ownerUserId: string;
  checkoutItems: CheckoutItemSnapshot[];
}): Promise<CheckoutSavedTravelerSuggestion[]> => {
  const profiles = await getSavedTravelerProfilesForUser({
    ownerUserId: input.ownerUserId,
  });

  return rankSavedTravelersForCheckout({
    profiles,
    checkoutItems: input.checkoutItems,
  });
};
