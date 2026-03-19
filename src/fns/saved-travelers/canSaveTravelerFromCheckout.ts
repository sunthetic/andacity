import { mapCheckoutTravelerToSavedTraveler } from "~/fns/saved-travelers/mapCheckoutTravelerToSavedTraveler";
import { validateSavedTravelerProfile } from "~/fns/saved-travelers/validateSavedTravelerProfile";
import type { CheckoutTravelerProfile } from "~/types/travelers";

export const canSaveTravelerFromCheckout = (input: {
  traveler: CheckoutTravelerProfile;
  ownerUserId: string | null | undefined;
}) => {
  return validateSavedTravelerProfile(
    mapCheckoutTravelerToSavedTraveler({
      traveler: input.traveler,
      ownerUserId: String(input.ownerUserId || "").trim(),
    }),
  );
};
