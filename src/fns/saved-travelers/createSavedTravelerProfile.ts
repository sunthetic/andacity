import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { savedTravelerProfiles } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getSavedTravelerProfile } from "~/fns/saved-travelers/getSavedTravelerProfile";
import {
  createSavedTravelerProfileId,
  normalizeSavedTravelerProfileStatus,
  normalizeSavedTravelerProfileType,
  SavedTravelerProfileError,
} from "~/fns/saved-travelers/shared";
import { validateSavedTravelerProfile } from "~/fns/saved-travelers/validateSavedTravelerProfile";
import type {
  CreateSavedTravelerProfileInput,
  SavedTravelerProfile,
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

export const createSavedTravelerProfile = async (
  input: CreateSavedTravelerProfileInput,
): Promise<SavedTravelerProfile> => {
  const ownerUserId = toNullableText(input.ownerUserId);
  const now = normalizeTimestamp(input.now);

  const payload = {
    ownerUserId: ownerUserId || "",
    status: normalizeSavedTravelerProfileStatus(input.status),
    type: normalizeSavedTravelerProfileType(input.type),
    firstName: toNullableText(input.firstName) || "",
    middleName: toNullableText(input.middleName),
    lastName: toNullableText(input.lastName) || "",
    dateOfBirth: toNullableDate(input.dateOfBirth),
    email: toNullableEmail(input.email),
    phone: toNullablePhone(input.phone),
    nationality: toNullableText(input.nationality),
    documentType: normalizeTravelerDocumentType(input.documentType),
    documentNumber: toNullableText(input.documentNumber),
    documentExpiryDate: toNullableDate(input.documentExpiryDate),
    issuingCountry: toNullableText(input.issuingCountry),
    knownTravelerNumber: toNullableText(input.knownTravelerNumber),
    redressNumber: toNullableText(input.redressNumber),
    driverAge: toNullablePositiveInteger(input.driverAge),
    label: toNullableText(input.label),
    isDefault:
      normalizeSavedTravelerProfileStatus(input.status) === "archived"
        ? false
        : Boolean(input.isDefault),
    updatedAt: new Date(now),
  };

  const validation = validateSavedTravelerProfile(payload);
  if (!validation.ok) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_INVALID",
      validation.issues[0]?.message || "Saved traveler profile is invalid.",
    );
  }

  const id = createSavedTravelerProfileId();

  await withCheckoutSchemaGuard(async () => {
    const db = getDb();
    await db.transaction(async (tx) => {
      if (payload.isDefault) {
        await tx
          .update(savedTravelerProfiles)
          .set({
            isDefault: false,
            updatedAt: new Date(now),
          })
          .where(eq(savedTravelerProfiles.ownerUserId, payload.ownerUserId));
      }

      await tx.insert(savedTravelerProfiles).values({
        id,
        ...payload,
        createdAt: new Date(now),
      });
    });
  });

  const created = await getSavedTravelerProfile({
    id,
    ownerUserId: payload.ownerUserId,
    includeArchived: true,
  });

  if (!created) {
    throw new SavedTravelerProfileError(
      "SAVED_TRAVELER_NOT_FOUND",
      `Saved traveler profile ${id} could not be loaded after save.`,
    );
  }

  return created;
};
