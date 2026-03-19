import { getServerRuntimeEnvValue } from "~/lib/server/runtime-env.server";
import type { NotificationProvider } from "~/types/notifications";

export const getNotificationProvider = (): NotificationProvider => {
  const configured = String(
    getServerRuntimeEnvValue("NOTIFICATION_PROVIDER") || "resend",
  )
    .trim()
    .toLowerCase();

  if (configured === "resend") return "resend";
  if (configured === "sendgrid") return "sendgrid";

  throw new Error(
    `Unsupported notification provider "${configured || "(empty)"}".`,
  );
};
