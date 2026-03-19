import { getNotificationProviderConfig } from "~/fns/notifications/getNotificationProviderConfig";
import { mapProviderNotificationStatus } from "~/fns/notifications/mapProviderNotificationStatus";
import { renderNotificationEmail } from "~/fns/notifications/renderNotificationEmail";
import type {
  SendNotificationAdapterInput,
  SendNotificationAdapterResult,
} from "~/types/notification-adapter";

type ResendSendResponse = {
  id?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export const sendResendEmail = async (
  input: SendNotificationAdapterInput,
): Promise<SendNotificationAdapterResult> => {
  if (input.channel !== "email") {
    return {
      provider: "resend",
      providerMessageId: null,
      status: "skipped",
      message: `Resend adapter only supports email channel, received "${input.channel}".`,
      providerMetadata: {
        reason: "unsupported_channel",
      },
    };
  }

  const recipientEmail = String(input.recipient.email || "").trim();
  if (!recipientEmail) {
    return {
      provider: "resend",
      providerMessageId: null,
      status: "skipped",
      message: "No recipient email address was provided.",
      providerMetadata: {
        reason: "missing_recipient_email",
      },
    };
  }

  const config = getNotificationProviderConfig("resend");
  const rendered = renderNotificationEmail(input.payload.renderModel);
  const from = config.fromName
    ? `${config.fromName} <${config.fromEmail}>`
    : config.fromEmail;

  const response = await fetch(`${config.apiBase}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipientEmail],
      subject: rendered.subject || input.subject,
      html: rendered.html,
      text: rendered.text,
    }),
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as ResendSendResponse;

  if (!response.ok || payload.error) {
    const errorMessage =
      payload.error?.message ||
      `Resend request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return {
    provider: "resend",
    providerMessageId: payload.id || null,
    status: mapProviderNotificationStatus({
      provider: "resend",
      providerStatus: "sent",
    }),
    message: "Notification accepted by Resend.",
    providerMetadata: {
      recipientEmail,
      responseStatus: response.status,
      responseId: payload.id || null,
    },
  };
};
