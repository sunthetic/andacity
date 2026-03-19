import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { savedTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getSavedTravelerProfile } from "~/fns/saved-travelers/getSavedTravelerProfile";
import {
  normalizeSavedTravelerProfileStatus,
  normalizeSavedTravelerProfileType,
  SavedTravelerProfileError,
} from "~/fns/saved-travelers/shared";
import { validateSavedTravelerProfile } from "~/fns/saved-travelers/validateSavedTravelerProfile";
import type {
  SavedTravelerProfile,
  UpdateSavedTravelerProfileInput,
} from "~/types/saved-travelers";
import {
  normalizeTimestamp,
  normalizeTravelerDocumentType,
  toNullableDate,
  toNullableEmail,
  toNullablePhone,
  toNullablePositiveInteger,
  toNullableText,
} from "~/fns/travelers/shared";

const hasOwn = <T extends object>(value: T, key: keyof T) =>
  Object.prototype.hasOwnProperty.call(value, key);

export const updateSavedTravelerProfile = async (input: {
  ownerUserId: string;
  profile: UpdateSavedTravelerProfileInput;
}): Promise<SavedTravelerProfile> => {
  const ownerUserId = toNullableText(input.ownerUserId);
  const id = String(input.profile.id || "").trim();

  if (!ownerUserId) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_UNAUTHORIZED",
      "Saved traveler profiles require an authenticated account context.",
    );
  }

  const existing = await getSavedTravelerProfile({
    id,
    ownerUserId,
    includeArchived: true,
  });
  if (!existing) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      "Saved traveler profile could not be found.",
    );
  }

  const now = normalizeTimestamp(input.profile.now);
  const nextStatus = hasOwn(input.profile, "status")
    ? normalizeSavedTravelerProfileStatus(input.profile.status)
    : existing.status;

  const next = {
    status: nextStatus,
    type: hasOwn(input.profile, "type")
      ? normalizeSavedTravelerProfileType(input.profile.type)
      : existing.type,
    firstName: hasOwn(input.profile, "firstName")
      ? toNullableText(input.profile.firstName) || ""
      : existing.firstName,
    middleName: hasOwn(input.profile, "middleName")
      ? toNullableText(input.profile.middleName)
      : existing.middleName,
    lastName: hasOwn(input.profile, "lastName")
      ? toNullableText(input.profile.lastName) || ""
      : existing.lastName,
    dateOfBirth: hasOwn(input.profile, "dateOfBirth")
      ? toNullableDate(input.profile.dateOfBirth)
      : existing.dateOfBirth,
    email: hasOwn(input.profile, "email")
      ? toNullableEmail(input.profile.email)
      : existing.email,
    phone: hasOwn(input.profile, "phone")
      ? toNullablePhone(input.profile.phone)
      : existing.phone,
    nationality: hasOwn(input.profile, "nationality")
      ? toNullableText(input.profile.nationality)
      : existing.nationality,
    documentType: hasOwn(input.profile, "documentType")
      ? normalizeTravelerDocumentType(input.profile.documentType)
      : existing.documentType,
    documentNumber: hasOwn(input.profile, "documentNumber")
      ? toNullableText(input.profile.documentNumber)
      : existing.documentNumber,
    documentExpiryDate: hasOwn(input.profile, "documentExpiryDate")
      ? toNullableDate(input.profile.documentExpiryDate)
      : existing.documentExpiryDate,
    issuingCountry: hasOwn(input.profile, "issuingCountry")
      ? toNullableText(input.profile.issuingCountry)
      : existing.issuingCountry,
    knownTravelerNumber: hasOwn(input.profile, "knownTravelerNumber")
      ? toNullableText(input.profile.knownTravelerNumber)
      : existing.knownTravelerNumber,
    redressNumber: hasOwn(input.profile, "redressNumber")
      ? toNullableText(input.profile.redressNumber)
      : existing.redressNumber,
    driverAge: hasOwn(input.profile, "driverAge")
      ? toNullablePositiveInteger(input.profile.driverAge)
      : existing.driverAge,
    label: hasOwn(input.profile, "label")
      ? toNullableText(input.profile.label)
      : existing.label,
    isDefault:
      nextStatus === "archived"
        ? false
        : hasOwn(input.profile, "isDefault")
          ? Boolean(input.profile.isDefault)
          : existing.isDefault,
    updatedAt: new Date(now),
  };

  const validation = validateSavedTravelerProfile({
    ownerUserId,
    firstName: next.firstName,
    lastName: next.lastName,
    dateOfBirth: next.dateOfBirth,
    email: next.email,
    phone: next.phone,
    documentExpiryDate: next.documentExpiryDate,
  });
  if (!validation.ok) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_INVALID",
      validation.issues[0]?.message || "Saved traveler profile is invalid.",
    );
  }

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db.transaction(async (tx) => {
      if (next.isDefault) {
        await tx
          .update(savedTravelerProfiles)
          .set({
            isDefault: false,
            updatedAt: new Date(now),
          })
          .where(eq(savedTravelerProfiles.ownerUserId, ownerUserId));
      }

      await tx
        .update(savedTravelerProfiles)
        .set(next)
        .where(
          and(
            eq(savedTravelerProfiles.id, id),
            eq(savedTravelerProfiles.ownerUserId, ownerUserId),
          ),
        );
    });
  });

  const updated = await getSavedTravelerProfile({
    id,
    ownerUserId,
    includeArchived: true,
  });
  if (!updated) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      "Saved traveler profile could not be loaded after update.",
    );
  }

  return updated;
};
