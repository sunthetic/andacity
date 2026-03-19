import {
  ITINERARY_ITEM_STATUSES,
  ITINERARY_STATUSES,
  type ItineraryItemStatus,
  type ItineraryStatus,
} from "~/types/itinerary";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
};

export const normalizeTimestamp = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const normalizeCurrencyCode = (value: unknown) => {
  const token = String(value || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(token) ? token : null;
};

const createOpaqueId = (prefix: string) => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const createItineraryId = () => createOpaqueId("itn_");

export const createItineraryItemId = () => createOpaqueId("iti_");

export const normalizeItineraryStatus = (value: unknown): ItineraryStatus => {
  return ITINERARY_STATUSES.includes(value as ItineraryStatus)
    ? (value as ItineraryStatus)
    : "active";
};

export const normalizeItineraryItemStatus = (
  value: unknown,
): ItineraryItemStatus => {
  return ITINERARY_ITEM_STATUSES.includes(value as ItineraryItemStatus)
    ? (value as ItineraryItemStatus)
    : "confirmed";
};

export const isUniqueViolationError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const source = error as {
    code?: string;
    cause?: {
      code?: string;
    };
  };

  return source.code === "23505" || source.cause?.code === "23505";
};

