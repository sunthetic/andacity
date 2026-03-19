import type {
  NotificationEventType,
  NotificationRecord,
  NotificationSummary,
} from "~/types/notifications";

const getStatusLabel = (status: NotificationSummary["status"]) => {
  switch (status) {
    case "sent":
    case "delivered":
      return {
        tone: "success" as const,
        title: "Notification sent",
      };
    case "queued":
      return {
        tone: "info" as const,
        title: "Notification queued",
      };
    case "failed":
      return {
        tone: "error" as const,
        title: "Notification failed",
      };
    case "skipped":
      return {
        tone: "warning" as const,
        title: "Notification skipped",
      };
    case "canceled":
      return {
        tone: "warning" as const,
        title: "Notification canceled",
      };
    case "draft":
      return {
        tone: "info" as const,
        title: "Notification draft",
      };
    default:
      return {
        tone: "info" as const,
        title: "Notification unavailable",
      };
  }
};

const pickLatestRecord = (
  records: NotificationRecord[],
  preferredEventTypes: NotificationEventType[],
) => {
  const byPreference = preferredEventTypes
    .map((eventType) =>
      records.find((record) => record.eventType === eventType) || null,
    )
    .find((record): record is NotificationRecord => Boolean(record));

  if (byPreference) return byPreference;
  return records[0] || null;
};

export const buildNotificationSummary = (input: {
  records: NotificationRecord[] | null | undefined;
  preferredEventTypes?: NotificationEventType[];
}): NotificationSummary => {
  const records = Array.isArray(input.records) ? input.records : [];
  const preferredEventTypes = input.preferredEventTypes || [];
  const latest = pickLatestRecord(records, preferredEventTypes);

  if (!latest) {
    return {
      eventType: null,
      status: null,
      title: "Notification not sent yet",
      message:
        "This page has no persisted notification attempts yet. Sending can be retried from this surface.",
      tone: "info",
      notificationId: null,
      sentAt: null,
      failedAt: null,
      canResend: true,
    };
  }

  const display = getStatusLabel(latest.status);
  const statusMessage =
    latest.status === "sent" || latest.status === "delivered"
      ? "The latest lifecycle notification was delivered to the saved recipient."
      : latest.status === "queued"
        ? "The latest lifecycle notification is queued for delivery."
        : latest.status === "failed"
          ? latest.failureMessage || "Delivery failed and can be retried."
          : latest.status === "skipped"
            ? latest.skipReason || "Delivery was skipped."
            : latest.status === "canceled"
              ? "Delivery was canceled."
              : "Notification exists as a draft.";

  return {
    eventType: latest.eventType,
    status: latest.status,
    title: display.title,
    message: statusMessage,
    tone: display.tone,
    notificationId: latest.id,
    sentAt: latest.sentAt,
    failedAt: latest.failedAt,
    canResend: latest.status !== "queued",
  };
};
