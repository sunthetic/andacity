import {
  BOOKING_CONFIRMATION_STATUSES,
  CONFIRMATION_ITEM_STATUSES,
  type BookingConfirmationStatus,
  type ConfirmationItemStatus,
} from "~/types/confirmation";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const toNonNegativeInteger = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
};

export const toStringList = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => toNullableText(entry))
    .filter((entry): entry is string => Boolean(entry));
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

export const createBookingConfirmationId = () => createOpaqueId("cnf_");

export const createBookingConfirmationItemId = () => createOpaqueId("cfi_");

export const normalizeBookingConfirmationStatus = (
  value: unknown,
): BookingConfirmationStatus => {
  return BOOKING_CONFIRMATION_STATUSES.includes(
    value as BookingConfirmationStatus,
  )
    ? (value as BookingConfirmationStatus)
    : "pending";
};

export const normalizeConfirmationItemStatus = (
  value: unknown,
): ConfirmationItemStatus => {
  return CONFIRMATION_ITEM_STATUSES.includes(value as ConfirmationItemStatus)
    ? (value as ConfirmationItemStatus)
    : "pending";
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
