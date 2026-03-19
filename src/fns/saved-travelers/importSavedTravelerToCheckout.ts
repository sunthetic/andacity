import { getSavedTravelerProfile } from "~/fns/saved-travelers/getSavedTravelerProfile";
import { mapSavedTravelerToCheckoutTraveler } from "~/fns/saved-travelers/mapSavedTravelerToCheckoutTraveler";
import { SavedTravelerProfileError } from "~/fns/saved-travelers/shared";
import { upsertCheckoutTravelerAssignment } from "~/fns/travelers/upsertCheckoutTravelerAssignment";
import { upsertCheckoutTravelerProfile } from "~/fns/travelers/upsertCheckoutTravelerProfile";
import type { ImportSavedTravelerToCheckoutInput } from "~/types/saved-travelers";

export const importSavedTravelerToCheckout = async (
  input: ImportSavedTravelerToCheckoutInput,
) => {
  const savedTraveler = await getSavedTravelerProfile({
    id: input.savedTravelerId,
    ownerUserId: input.ownerUserId,
    includeArchived: false,
  });

  if (!savedTraveler) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      "Saved traveler profile could not be found for this account.",
    );
  }

  const checkoutTraveler = await upsertCheckoutTravelerProfile({
    checkoutSessionId: input.checkoutSessionId,
    ...mapSavedTravelerToCheckoutTraveler({
      traveler: savedTraveler,
      role: input.role,
    }),
    now: input.now,
  });

  const assignment =
    input.checkoutItemKey != null || input.isPrimary != null
      ? await upsertCheckoutTravelerAssignment({
          checkoutSessionId: input.checkoutSessionId,
          checkoutItemKey: input.checkoutItemKey,
          travelerProfileId: checkoutTraveler.id,
          role: input.role,
          isPrimary: input.isPrimary,
          now: input.now,
        })
      : null;

  return {
    savedTraveler,
    checkoutTraveler,
    assignment,
  };
};
