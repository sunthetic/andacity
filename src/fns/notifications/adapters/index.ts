import { sendResendEmail } from "~/fns/notifications/adapters/resend/sendResendEmail";
import type { NotificationAdapter } from "~/types/notification-adapter";

// Register providers here. The notification lifecycle should stay provider-agnostic.
export const NOTIFICATION_ADAPTERS: Record<string, NotificationAdapter> = {
  resend: {
    provider: "resend",
    sendNotification: sendResendEmail,
  },
};
