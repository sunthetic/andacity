import { renderBaseNotificationEmail } from "~/components/notifications/email/shared";
import type {
  NotificationRenderModel,
  NotificationRenderedEmail,
} from "~/types/notifications";

export const renderBookingConfirmationEmail = (
  model: NotificationRenderModel,
): NotificationRenderedEmail => {
  return renderBaseNotificationEmail(model);
};
