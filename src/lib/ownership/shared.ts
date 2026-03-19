import {
  OWNERSHIP_MODES,
  OWNERSHIP_SOURCES,
  type OwnershipMode,
  type OwnershipSource,
} from "~/types/ownership";

export const OWNERSHIP_SESSION_COOKIE = "andacity_ownership_session";
export const OWNERSHIP_CLAIMS_COOKIE = "andacity_itinerary_claims";
export const OWNERSHIP_USER_COOKIE = "andacity_user_id";

const createOpaqueId = (prefix: string) => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const createItineraryOwnershipId = () => createOpaqueId("ito_");

export const createAnonymousOwnershipSessionId = () => createOpaqueId("ios_");

export const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const normalizeOwnershipMode = (value: unknown): OwnershipMode => {
  return OWNERSHIP_MODES.includes(value as OwnershipMode)
    ? (value as OwnershipMode)
    : "anonymous";
};

export const normalizeOwnershipSource = (value: unknown): OwnershipSource => {
  return OWNERSHIP_SOURCES.includes(value as OwnershipSource)
    ? (value as OwnershipSource)
    : "confirmation_flow";
};
