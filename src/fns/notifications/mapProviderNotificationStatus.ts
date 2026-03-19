import type {
  NotificationProvider,
  NotificationStatus,
} from "~/types/notifications";

export const mapProviderNotificationStatus = (input: {
  provider: NotificationProvider;
  providerStatus: string | null | undefined;
}): NotificationStatus => {
  const providerStatus = String(input.providerStatus || "").trim().toLowerCase();

  if (!providerStatus) return "sent";

  if (
    providerStatus === "delivered" ||
    providerStatus === "delivery_success" ||
    providerStatus === "success"
  ) {
    return "delivered";
  }

  if (
    providerStatus === "queued" ||
    providerStatus === "processing" ||
    providerStatus === "pending"
  ) {
    return "queued";
  }

  if (
    providerStatus === "failed" ||
    providerStatus === "bounced" ||
    providerStatus === "error"
  ) {
    return "failed";
  }

  return "sent";
};
