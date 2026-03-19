import { sendConfirmationLifecycleNotifications } from "~/fns/notifications/sendConfirmationLifecycleNotifications";
import { getBookingConfirmationByPublicRef } from "~/lib/confirmation/getBookingConfirmationByPublicRef";

export type ConfirmationNotificationActionResult = {
  ok: boolean;
  status: string;
  message: string;
  code:
    | "NOTIFICATION_SENT"
    | "NOTIFICATION_SKIPPED"
    | "NOTIFICATION_FAILED"
    | "NOTIFICATION_RESENT";
};

export const resendConfirmationNotification = async (
  confirmationRef: string,
): Promise<ConfirmationNotificationActionResult> => {
  const normalizedRef = String(confirmationRef || "").trim().toUpperCase();
  const confirmation = await getBookingConfirmationByPublicRef(normalizedRef);
  if (!confirmation) {
    return {
      ok: false,
      status: "failed",
      message: "Confirmation could not be found for resend.",
      code: "NOTIFICATION_FAILED",
    };
  }

  try {
    const result = await sendConfirmationLifecycleNotifications(confirmation, {
      resend: true,
    });

    if (result.status === "sent" || result.status === "delivered") {
      return {
        ok: true,
        status: result.status,
        message: "Confirmation notification resent.",
        code: "NOTIFICATION_RESENT",
      };
    }

    if (result.status === "skipped") {
      return {
        ok: false,
        status: result.status,
        message: result.message,
        code: "NOTIFICATION_SKIPPED",
      };
    }

    return {
      ok: false,
      status: result.status,
      message: result.message,
      code: "NOTIFICATION_FAILED",
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Confirmation notification resend failed.",
      code: "NOTIFICATION_FAILED",
    };
  }
};
