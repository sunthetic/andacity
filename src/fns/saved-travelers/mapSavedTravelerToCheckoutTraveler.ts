import type { UpsertCheckoutTravelerProfileInput } from "~/fns/travelers/upsertCheckoutTravelerProfile";
import type { SavedTravelerProfile } from "~/types/saved-travelers";

export type SavedTravelerToCheckoutTravelerPayload = Omit<
  UpsertCheckoutTravelerProfileInput,
  "id" | "checkoutSessionId" | "now"
>;

export const mapSavedTravelerToCheckoutTraveler = (input: {
  traveler: SavedTravelerProfile;
  role?: UpsertCheckoutTravelerProfileInput["role"];
}): SavedTravelerToCheckoutTravelerPayload => {
  const { traveler } = input;

  return {
    type: traveler.type,
    role: input.role || "passenger",
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
  };
};
