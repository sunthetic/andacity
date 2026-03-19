import { getServerRuntimeEnvValue } from "~/lib/server/runtime-env.server";
import type { NotificationProvider } from "~/types/notifications";

export type ResendNotificationProviderConfig = {
  provider: "resend";
  apiKey: string;
  apiBase: string;
  fromEmail: string;
  fromName: string | null;
};

export type SendgridNotificationProviderConfig = {
  provider: "sendgrid";
  apiKey: string;
  apiBase: string;
  fromEmail: string;
  fromName: string | null;
};

export type NotificationProviderConfig =
  | ResendNotificationProviderConfig
  | SendgridNotificationProviderConfig;

const readRequired = (key: "RESEND_API_KEY" | "NOTIFICATION_FROM_EMAIL") => {
  const value = String(getServerRuntimeEnvValue(key) || "").trim();
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
};

export const getNotificationProviderConfig = (
  provider: NotificationProvider,
): NotificationProviderConfig => {
  const fromEmail = readRequired("NOTIFICATION_FROM_EMAIL");
  const fromName = String(
    getServerRuntimeEnvValue("NOTIFICATION_FROM_NAME") || "Andacity",
  ).trim();

  if (provider === "resend") {
    return {
      provider: "resend",
      apiKey: readRequired("RESEND_API_KEY"),
      apiBase:
        String(
          getServerRuntimeEnvValue("RESEND_API_BASE") ||
            "https://api.resend.com",
        ).trim() || "https://api.resend.com",
      fromEmail,
      fromName: fromName || null,
    };
  }

  if (provider === "sendgrid") {
    throw new Error(
      'SendGrid adapter is not implemented yet. Configure NOTIFICATION_PROVIDER="resend" for now.',
    );
  }

  throw new Error(`Notification provider "${provider}" is not supported.`);
};
