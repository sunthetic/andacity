import type {
  CheckoutTravelerProfile,
  TravelerDocumentType,
  TravelerRole,
  TravelerType,
} from "~/types/travelers";
import {
  TRAVELER_DOCUMENT_TYPES,
  TRAVELER_ROLES,
  TRAVELER_TYPES,
} from "~/types/travelers";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const toNullableText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

export const toNullableDate = (value: unknown) => {
  const text = toNullableText(value);
  if (!text) return null;
  if (ISO_DATE_RE.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export const toNullableEmail = (value: unknown) => {
  const text = toNullableText(value);
  return text ? text.toLowerCase() : null;
};

export const toNullablePhone = (value: unknown) => {
  const text = toNullableText(value);
  if (!text) return null;
  return text.replace(/\s+/g, " ");
};

export const toNullablePositiveInteger = (value: unknown) => {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

export const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const parsed =
    value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

export const normalizeTravelerType = (value: unknown): TravelerType => {
  return TRAVELER_TYPES.includes(value as TravelerType)
    ? (value as TravelerType)
    : "adult";
};

export const normalizeTravelerRole = (value: unknown): TravelerRole => {
  return TRAVELER_ROLES.includes(value as TravelerRole)
    ? (value as TravelerRole)
    : "passenger";
};

export const normalizeTravelerDocumentType = (
  value: unknown,
): TravelerDocumentType | null => {
  return TRAVELER_DOCUMENT_TYPES.includes(value as TravelerDocumentType)
    ? (value as TravelerDocumentType)
    : null;
};

export const createCheckoutTravelerProfileId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `trv_${globalThis.crypto.randomUUID()}`;
  }
  return `trv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const createCheckoutTravelerAssignmentId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `tra_${globalThis.crypto.randomUUID()}`;
  }
  return `tra_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const checkoutItemKeyFromSnapshot = (input: {
  tripItemId: number;
  inventoryId: string;
}) => `trip-item:${input.tripItemId}:${input.inventoryId}`;

export const withProfileDefaults = (
  value: Partial<CheckoutTravelerProfile> & {
    id: string;
    checkoutSessionId: string;
  },
): CheckoutTravelerProfile => {
  const now = normalizeTimestamp(null);
  return {
    id: value.id,
    checkoutSessionId: value.checkoutSessionId,
    type: normalizeTravelerType(value.type),
    role: normalizeTravelerRole(value.role),
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
    createdAt: normalizeTimestamp(value.createdAt || now),
    updatedAt: normalizeTimestamp(value.updatedAt || now),
  };
};
