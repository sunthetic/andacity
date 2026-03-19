import { buildCheckoutTravelerCollection } from "~/fns/travelers/buildCheckoutTravelerCollection";
import {
  checkoutItemKeyFromSnapshot,
  normalizeTravelerRole,
} from "~/fns/travelers/shared";
import type { CheckoutItemSnapshot, CheckoutSession } from "~/types/checkout";
import type {
  CheckoutTravelerProfile,
  BookingTraveler,
  MappedCheckoutTravelersForBooking,
} from "~/types/travelers";

const mapTraveler = (input: {
  profile: CheckoutTravelerProfile;
  role: BookingTraveler["role"];
  isPrimary: boolean;
}): BookingTraveler => {
  return {
    profileId: input.profile.id,
    role: input.role,
    type: input.profile.type,
    isPrimary: input.isPrimary,
    firstName: input.profile.firstName,
    middleName: input.profile.middleName,
    lastName: input.profile.lastName,
    dateOfBirth: input.profile.dateOfBirth,
    email: input.profile.email,
    phone: input.profile.phone,
    nationality: input.profile.nationality,
    documentType: input.profile.documentType,
    documentNumber: input.profile.documentNumber,
    documentExpiryDate: input.profile.documentExpiryDate,
    issuingCountry: input.profile.issuingCountry,
    knownTravelerNumber: input.profile.knownTravelerNumber,
    redressNumber: input.profile.redressNumber,
    driverAge: input.profile.driverAge,
  };
};

const toCheckoutItemKey = (item: CheckoutItemSnapshot) =>
  checkoutItemKeyFromSnapshot({
    tripItemId: item.tripItemId,
    inventoryId: item.inventory.inventoryId,
  });

export const mapCheckoutTravelersForBooking = async (input: {
  checkoutSession: Pick<CheckoutSession, "id" | "items">;
  checkoutItemKey: string;
}): Promise<MappedCheckoutTravelersForBooking> => {
  const collection = await buildCheckoutTravelerCollection({
    checkoutSessionId: input.checkoutSession.id,
    checkoutItems: input.checkoutSession.items,
  });
  const item = input.checkoutSession.items.find(
    (candidate) => toCheckoutItemKey(candidate) === input.checkoutItemKey,
  );
  const roleFromVertical =
    item?.vertical === "flight"
      ? "passenger"
      : item?.vertical === "hotel"
        ? "guest"
        : item?.vertical === "car"
          ? "driver"
          : "passenger";

  const itemAssignments = collection.assignments.filter(
    (assignment) =>
      assignment.checkoutItemKey === input.checkoutItemKey &&
      assignment.role === normalizeTravelerRole(roleFromVertical),
  );
  const itemTravelers = itemAssignments
    .map((assignment) => {
      const profile = collection.profiles.find(
        (candidate) => candidate.id === assignment.travelerProfileId,
      );
      if (!profile) return null;
      return mapTraveler({
        profile,
        role: assignment.role,
        isPrimary: assignment.isPrimary,
      });
    })
    .filter((traveler): traveler is BookingTraveler => Boolean(traveler));

  const primaryContactAssignment = collection.assignments.find(
    (assignment) =>
      assignment.checkoutItemKey == null &&
      assignment.role === "primary_contact" &&
      assignment.isPrimary,
  );
  const fallbackPrimaryContact =
    primaryContactAssignment ||
    collection.assignments.find(
      (assignment) =>
        assignment.checkoutItemKey == null &&
        assignment.role === "primary_contact",
    ) ||
    null;
  const primaryContactProfile = fallbackPrimaryContact
    ? collection.profiles.find(
        (profile) => profile.id === fallbackPrimaryContact.travelerProfileId,
      ) || null
    : null;

  return {
    checkoutSessionId: input.checkoutSession.id,
    checkoutItemKey: input.checkoutItemKey,
    status: collection.validationSummary.status,
    issues: collection.validationSummary.issues,
    travelers: itemTravelers,
    primaryContact: primaryContactProfile
      ? mapTraveler({
          profile: primaryContactProfile,
          role: "primary_contact",
          isPrimary: Boolean(fallbackPrimaryContact?.isPrimary),
        })
      : null,
  };
};
