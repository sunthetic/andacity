import type { CheckoutTravelerProfile } from "~/types/travelers";

const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const formatTravelerDisplayName = (
  traveler: Pick<
    CheckoutTravelerProfile,
    "firstName" | "middleName" | "lastName" | "email" | "id"
  >,
) => {
  const parts = [
    toNullableText(traveler.firstName),
    toNullableText(traveler.middleName),
    toNullableText(traveler.lastName),
  ].filter((part): part is string => Boolean(part));

  if (parts.length) return parts.join(" ");
  return toNullableText(traveler.email) || `Traveler ${traveler.id.slice(-6)}`;
};
