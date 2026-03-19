import type { NotificationEventType } from "~/types/notifications";

const normalizeToken = (value: unknown) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const getNotificationDedupeKey = (input: {
  eventType: NotificationEventType;
  confirmationId?: string | null;
  itineraryId?: string | null;
  checkoutSessionId?: string | null;
  recipientEmail?: string | null;
  ownershipMode?: string | null;
  variant?: string | null;
}) => {
  const eventType = normalizeToken(input.eventType);
  const confirmationId = normalizeToken(input.confirmationId);
  const itineraryId = normalizeToken(input.itineraryId);
  const checkoutSessionId = normalizeToken(input.checkoutSessionId);
  const recipientEmail = normalizeToken(input.recipientEmail);
  const ownershipMode = normalizeToken(input.ownershipMode);
  const variant = normalizeToken(input.variant);

  const entityToken =
    confirmationId ||
    itineraryId ||
    checkoutSessionId ||
    "unknown_entity";

  return [
    "notification",
    eventType || "unknown_event",
    entityToken,
    recipientEmail || "unknown_recipient",
    ownershipMode || "unknown_owner",
    variant || "default",
  ].join(":");
};
