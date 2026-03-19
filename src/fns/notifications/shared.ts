import type {
  NotificationChannel,
  NotificationEventType,
  NotificationProvider,
  NotificationStatus,
} from "~/types/notifications";

export const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export const normalizeTimestamp = (value: Date | string | null | undefined) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const createNotificationId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `ntf_${globalThis.crypto.randomUUID()}`;
  }

  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizeNotificationEventType = (
  value: unknown,
): NotificationEventType => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "booking_confirmation") return "booking_confirmation";
  if (normalized === "booking_partial_confirmation") {
    return "booking_partial_confirmation";
  }
  if (normalized === "booking_manual_review") return "booking_manual_review";
  if (normalized === "itinerary_ready") return "itinerary_ready";
  if (normalized === "itinerary_claim_available") {
    return "itinerary_claim_available";
  }
  return "booking_confirmation";
};

export const normalizeNotificationChannel = (
  value: unknown,
): NotificationChannel => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "sms") return "sms";
  if (normalized === "push") return "push";
  return "email";
};

export const normalizeNotificationProvider = (
  value: unknown,
): NotificationProvider => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "sendgrid") return "sendgrid";
  return "resend";
};

export const normalizeNotificationStatus = (value: unknown): NotificationStatus => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "draft") return "draft";
  if (normalized === "queued") return "queued";
  if (normalized === "sent") return "sent";
  if (normalized === "delivered") return "delivered";
  if (normalized === "failed") return "failed";
  if (normalized === "skipped") return "skipped";
  if (normalized === "canceled") return "canceled";
  return "draft";
};

export const maskEmailForLog = (email: string | null) => {
  const normalized = toNullableText(email);
  if (!normalized) return null;

  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "[invalid-email]";

  const prefix = local.slice(0, 2);
  return `${prefix}***@${domain}`;
};
