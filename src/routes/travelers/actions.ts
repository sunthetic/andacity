import { archiveSavedTravelerProfile } from "~/fns/saved-travelers/archiveSavedTravelerProfile";
import { canManageSavedTravelers } from "~/fns/saved-travelers/canManageSavedTravelers";
import { createSavedTravelerProfile } from "~/fns/saved-travelers/createSavedTravelerProfile";
import { SavedTravelerProfileError } from "~/fns/saved-travelers/shared";
import { setDefaultSavedTravelerProfile } from "~/fns/saved-travelers/setDefaultSavedTravelerProfile";
import { updateSavedTravelerProfile } from "~/fns/saved-travelers/updateSavedTravelerProfile";

export type SavedTravelerActionResult = {
  ok: boolean;
  code:
    | "SAVED_TRAVELER_CREATED"
    | "SAVED_TRAVELER_UPDATED"
    | "SAVED_TRAVELER_ARCHIVED"
    | "SAVED_TRAVELER_UNAUTHORIZED"
    | "SAVED_TRAVELER_INVALID";
  message: string;
  savedTravelerId: string | null;
};

const unauthorizedResult = (): SavedTravelerActionResult => ({
  ok: false,
  code: "SAVED_TRAVELER_UNAUTHORIZED",
  message: "Saved traveler profiles require an authenticated account context.",
  savedTravelerId: null,
});

const errorResult = (error: unknown): SavedTravelerActionResult => ({
  ok: false,
  code:
    error instanceof SavedTravelerProfileError &&
    error.code === "SAVED_TRAVELER_UNAUTHORIZED"
      ? "SAVED_TRAVELER_UNAUTHORIZED"
      : "SAVED_TRAVELER_INVALID",
  message:
    error instanceof Error ? error.message : "Saved traveler action failed.",
  savedTravelerId: null,
});

export const createSavedTravelerProfileAction = async (input: {
  ownerUserId: string | null | undefined;
  payload: Omit<
    Parameters<typeof createSavedTravelerProfile>[0],
    "ownerUserId"
  >;
}): Promise<SavedTravelerActionResult> => {
  const access = canManageSavedTravelers(input.ownerUserId);
  if (!access.ok) return unauthorizedResult();

  try {
    const savedTraveler = await createSavedTravelerProfile({
      ...input.payload,
      ownerUserId: access.ownerUserId!,
    });

    return {
      ok: true,
      code: "SAVED_TRAVELER_CREATED",
      message: "Saved traveler profile created.",
      savedTravelerId: savedTraveler.id,
    };
  } catch (error) {
    return errorResult(error);
  }
};

export const updateSavedTravelerProfileAction = async (input: {
  ownerUserId: string | null | undefined;
  savedTravelerId: string;
  payload: Omit<
    Parameters<typeof updateSavedTravelerProfile>[0]["profile"],
    "id"
  >;
}): Promise<SavedTravelerActionResult> => {
  const access = canManageSavedTravelers(input.ownerUserId);
  if (!access.ok) return unauthorizedResult();

  try {
    const savedTraveler = await updateSavedTravelerProfile({
      ownerUserId: access.ownerUserId!,
      profile: {
        id: input.savedTravelerId,
        ...input.payload,
      },
    });

    return {
      ok: true,
      code: "SAVED_TRAVELER_UPDATED",
      message: "Saved traveler profile updated.",
      savedTravelerId: savedTraveler.id,
    };
  } catch (error) {
    return errorResult(error);
  }
};

export const archiveSavedTravelerProfileAction = async (input: {
  ownerUserId: string | null | undefined;
  savedTravelerId: string;
}): Promise<SavedTravelerActionResult> => {
  const access = canManageSavedTravelers(input.ownerUserId);
  if (!access.ok) return unauthorizedResult();

  try {
    const savedTraveler = await archiveSavedTravelerProfile({
      id: input.savedTravelerId,
      ownerUserId: access.ownerUserId!,
    });

    return {
      ok: true,
      code: "SAVED_TRAVELER_ARCHIVED",
      message: "Saved traveler profile archived.",
      savedTravelerId: savedTraveler.id,
    };
  } catch (error) {
    return errorResult(error);
  }
};

export const setDefaultSavedTravelerProfileAction = async (input: {
  ownerUserId: string | null | undefined;
  savedTravelerId: string;
}): Promise<SavedTravelerActionResult> => {
  const access = canManageSavedTravelers(input.ownerUserId);
  if (!access.ok) return unauthorizedResult();

  try {
    const savedTraveler = await setDefaultSavedTravelerProfile({
      id: input.savedTravelerId,
      ownerUserId: access.ownerUserId!,
    });

    return {
      ok: true,
      code: "SAVED_TRAVELER_UPDATED",
      message: "Default saved traveler updated.",
      savedTravelerId: savedTraveler.id,
    };
  } catch (error) {
    return errorResult(error);
  }
};
