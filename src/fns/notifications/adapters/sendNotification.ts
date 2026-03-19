import { NOTIFICATION_ADAPTERS } from "~/fns/notifications/adapters/index";
import type { SendNotificationAdapterInput } from "~/types/notification-adapter";
import type { NotificationProvider } from "~/types/notifications";

export const sendNotification = async (
  provider: NotificationProvider,
  input: SendNotificationAdapterInput,
) => {
  const adapter = NOTIFICATION_ADAPTERS[provider];
  if (!adapter) {
    throw new Error(`Notification provider "${provider}" does not have an adapter.`);
  }

  return adapter.sendNotification(input);
};
