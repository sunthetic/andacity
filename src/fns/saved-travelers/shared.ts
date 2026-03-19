import {
  SAVED_TRAVELER_PROFILE_STATUSES,
  SAVED_TRAVELER_PROFILE_TYPES,
  type SavedTravelerProfile,
  type SavedTravelerProfileStatus,
  type SavedTravelerProfileType,
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

export class SavedTravelerProfileError extends Error {
  readonly code:
    | "SAVED_TRAVELER_INVALID"
    | "SAVED_TRAVELER_NOT_FOUND"
    | "SAVED_TRAVELER_UNAUTHORIZED";

  constructor(
    code:
      | "SAVED_TRAVELER_INVALID"
      | "SAVED_TRAVELER_NOT_FOUND"
      | "SAVED_TRAVELER_UNAUTHORIZED",
    message: string,
  ) {
    super(message);
    this.name = "SavedTravelerProfileError";
    this.code = code;
  }
}

export const createSavedTravelerProfileId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `stv_${globalThis.crypto.randomUUID()}`;
  }

  return `stv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizeSavedTravelerProfileStatus = (
  value: unknown,
): SavedTravelerProfileStatus => {
  return SAVED_TRAVELER_PROFILE_STATUSES.includes(
    value as SavedTravelerProfileStatus,
  )
    ? (value as SavedTravelerProfileStatus)
    : "active";
};

export const normalizeSavedTravelerProfileType = (
  value: unknown,
): SavedTravelerProfileType => {
  return SAVED_TRAVELER_PROFILE_TYPES.includes(
    value as SavedTravelerProfileType,
  )
    ? (value as SavedTravelerProfileType)
    : "adult";
};

export const withSavedTravelerDefaults = (
  value: Partial<SavedTravelerProfile> & {
    id: string;
    ownerUserId: string;
  },
): SavedTravelerProfile => {
  const now = normalizeTimestamp(null);

  return {
    id: value.id,
    ownerUserId: toNullableText(value.ownerUserId) || "",
    status: normalizeSavedTravelerProfileStatus(value.status),
    type: normalizeSavedTravelerProfileType(value.type),
    firstName: toNullableText(value.firstName) || "",
    middleName: toNullableText(value.middleName),
    lastName: toNullableText(value.lastName) || "",
    dateOfBirth: toNullableDate(value.dateOfBirth),
    email: toNullableEmail(value.email),
    phone: toNullablePhone(value.phone),
    nationality: toNullableText(value.nationality),
    documentType: normalizeTravelerDocumentType(value.documentType),
    documentNumber: toNullableText(value.documentNumber),
    documentExpiryDate: toNullableDate(value.documentExpiryDate),
    issuingCountry: toNullableText(value.issuingCountry),
    knownTravelerNumber: toNullableText(value.knownTravelerNumber),
    redressNumber: toNullableText(value.redressNumber),
    driverAge: toNullablePositiveInteger(value.driverAge),
    label: toNullableText(value.label),
    isDefault: Boolean(value.isDefault),
    createdAt: normalizeTimestamp(value.createdAt || now),
    updatedAt: normalizeTimestamp(value.updatedAt || now),
  };
};
