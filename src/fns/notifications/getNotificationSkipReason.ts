import type { NotificationRecord, NotificationStatus } from "~/types/notifications";

export type NotificationSkipReasonCode =
  | "NO_RECIPIENT_EMAIL"
  | "PROVIDER_UNAVAILABLE"
  | "UNSUPPORTED_EVENT_TYPE"
  | "DUPLICATE_ALREADY_SENT";

export type NotificationSkipReason = {
  code: NotificationSkipReasonCode;
  status: Extract<NotificationStatus, "skipped" | "failed">;
  message: string;
};

export const getNotificationSkipReason = (input: {
  noRecipient?: boolean;
  providerUnavailable?: boolean;
  unsupportedEventType?: boolean;
  duplicateRecord?: NotificationRecord | null;
}): NotificationSkipReason | null => {
  if (input.noRecipient) {
    return {
      code: "NO_RECIPIENT_EMAIL",
      status: "skipped",
      message: "Notification skipped because recipient email is unavailable.",
    };
  }

  if (input.providerUnavailable) {
    return {
      code: "PROVIDER_UNAVAILABLE",
      status: "failed",
      message: "Notification provider is not configured for this environment.",
    };
  }

  if (input.unsupportedEventType) {
    return {
      code: "UNSUPPORTED_EVENT_TYPE",
      status: "skipped",
      message: "Notification event type is not supported by the renderer.",
    };
  }

  if (
    input.duplicateRecord &&
    (input.duplicateRecord.status === "sent" ||
      input.duplicateRecord.status === "delivered" ||
      input.duplicateRecord.status === "queued")
  ) {
    return {
      code: "DUPLICATE_ALREADY_SENT",
      status: "skipped",
      message:
        "A notification for this event was already sent or is already queued.",
    };
  }

  return null;
};
