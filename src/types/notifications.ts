import type { OwnershipMode } from "~/types/ownership";

export const NOTIFICATION_CHANNELS = ["email", "sms", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_PROVIDERS = ["resend", "sendgrid"] as const;
export type NotificationProvider = (typeof NOTIFICATION_PROVIDERS)[number];

export const NOTIFICATION_EVENT_TYPES = [
  "booking_confirmation",
  "booking_partial_confirmation",
  "booking_manual_review",
  "itinerary_ready",
  "itinerary_claim_available",
] as const;
export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const NOTIFICATION_STATUSES = [
  "draft",
  "queued",
  "sent",
  "delivered",
  "failed",
  "skipped",
  "canceled",
] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export type NotificationRecipient = {
  email: string | null;
  name: string | null;
  ownerUserId?: string | null;
  ownerSessionId?: string | null;
};

export type NotificationLinks = {
  confirmationUrl: string | null;
  itineraryUrl: string | null;
  resumeUrl: string | null;
  claimUrl: string | null;
};

export type NotificationRenderItemSummary = {
  title: string;
  subtitle: string | null;
  when: string | null;
  where: string | null;
  status: string | null;
};

export type NotificationRenderModel = {
  eventType: NotificationEventType;
  subject: string;
  recipient: NotificationRecipient;
  greetingName: string | null;
  headline: string;
  intro: string;
  referenceLabel: string;
  referenceValue: string;
  itemSummaries: NotificationRenderItemSummary[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  ownershipMode: OwnershipMode | null;
  links: NotificationLinks;
};

export type NotificationPayload = {
  version: "v1";
  renderModel: NotificationRenderModel;
  renderMetadata?: Record<string, unknown> | null;
};

export type NotificationRecord = {
  id: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  provider: NotificationProvider;
  status: NotificationStatus;
  recipientJson: NotificationRecipient;
  subject: string;
  payloadJson: NotificationPayload;
  providerMessageId: string | null;
  providerMetadata: Record<string, unknown> | null;
  dedupeKey: string | null;
  relatedConfirmationId: string | null;
  relatedItineraryId: string | null;
  relatedCheckoutSessionId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureMessage: string | null;
  skipReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SendNotificationInput = {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  provider: NotificationProvider;
  recipient: NotificationRecipient;
  subject: string;
  payload: NotificationPayload;
  dedupeKey?: string | null;
  relatedConfirmationId?: string | null;
  relatedItineraryId?: string | null;
  relatedCheckoutSessionId?: string | null;
  resend?: boolean;
};

export type SendNotificationResult = {
  ok: boolean;
  provider: NotificationProvider;
  providerMessageId: string | null;
  status: NotificationStatus;
  message: string;
  providerMetadata: Record<string, unknown> | null;
  notificationId: string | null;
  skippedReason: string | null;
};

export type NotificationSummary = {
  eventType: NotificationEventType | null;
  status: NotificationStatus | null;
  title: string;
  message: string;
  tone: "success" | "warning" | "error" | "info";
  notificationId: string | null;
  sentAt: string | null;
  failedAt: string | null;
  canResend: boolean;
};

export type NotificationRenderedEmail = {
  subject: string;
  html: string;
  text: string;
};
