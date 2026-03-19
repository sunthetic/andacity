import type { CheckoutTravelerProfile } from "~/types/travelers";
import type { CreateSavedTravelerProfileInput } from "~/types/saved-travelers";

export const mapCheckoutTravelerToSavedTraveler = (input: {
  traveler: CheckoutTravelerProfile;
  ownerUserId: string;
  label?: string | null;
  isDefault?: boolean | null;
}): CreateSavedTravelerProfileInput => {
  const { traveler } = input;

  return {
    ownerUserId: input.ownerUserId,
    type: traveler.type,
    firstName: traveler.firstName,
    middleName: traveler.middleName,
    lastName: traveler.lastName,
    dateOfBirth: traveler.dateOfBirth,
    email: traveler.email,
    phone: traveler.phone,
    nationality: traveler.nationality,
    documentType: traveler.documentType,
    documentNumber: traveler.documentNumber,
    documentExpiryDate: traveler.documentExpiryDate,
    issuingCountry: traveler.issuingCountry,
    knownTravelerNumber: traveler.knownTravelerNumber,
    redressNumber: traveler.redressNumber,
    driverAge: traveler.driverAge,
    label: input.label ?? null,
    isDefault: input.isDefault ?? false,
  };
};
