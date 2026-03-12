import { useVisibleTask$ } from "@builder.io/qwik";
import {
  clearBookingStageProgress,
  resetBookingStageProgress,
  shouldTrackBookingStageAbandonment,
  trackBookingEvent,
  type BookingTelemetryPayload,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";

export const useBookingAbandonmentTelemetry = (input: {
  vertical: BookingVertical;
  stage: string;
  enabled?: boolean;
  payload?: BookingTelemetryPayload;
  trackOnCleanup?: boolean;
}) => {
  useVisibleTask$(({ cleanup }) => {
    if (input.enabled === false) {
      clearBookingStageProgress(input.stage);
      return;
    }

    resetBookingStageProgress(input.stage);
    let tracked = false;

    const trackAbandonment = () => {
      if (tracked || !shouldTrackBookingStageAbandonment(input.stage)) return;

      trackBookingEvent("booking_abandonment", {
        vertical: input.vertical,
        stage: input.stage,
        ...(input.payload || {}),
      });
      tracked = true;
      clearBookingStageProgress(input.stage);
    };

    window.addEventListener("pagehide", trackAbandonment);

    cleanup(() => {
      window.removeEventListener("pagehide", trackAbandonment);
      if (input.trackOnCleanup !== false) {
        trackAbandonment();
      }
      clearBookingStageProgress(input.stage);
    });
  });
};
