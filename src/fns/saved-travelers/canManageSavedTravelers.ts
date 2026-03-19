import { toNullableText } from "~/fns/travelers/shared";

export const canManageSavedTravelers = (
  ownerUserId: string | null | undefined,
) => {
  const normalizedOwnerUserId = toNullableText(ownerUserId);

  return {
    ok: Boolean(normalizedOwnerUserId),
    ownerUserId: normalizedOwnerUserId,
    code: normalizedOwnerUserId
      ? ("SAVED_TRAVELER_AUTHORIZED" as const)
      : ("SAVED_TRAVELER_UNAUTHORIZED" as const),
    message: normalizedOwnerUserId
      ? "Authenticated user context resolved for saved travelers."
      : "Saved traveler profiles require an authenticated account context.",
  };
};
