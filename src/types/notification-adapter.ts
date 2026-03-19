import type {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
  NotificationRecipient,
  NotificationStatus,
} from "~/types/notifications";

export type SendNotificationAdapterInput = {
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  subject: string;
  payload: NotificationPayload;
};

export type SendNotificationAdapterResult = {
  provider: NotificationProvider;
  providerMessageId: string | null;
  status: NotificationStatus;
  message: string;
  providerMetadata: Record<string, unknown> | null;
};

export interface NotificationAdapter {
  provider: NotificationProvider;
  sendNotification(
    input: SendNotificationAdapterInput,
  ): Promise<SendNotificationAdapterResult>;
}
