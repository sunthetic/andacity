import { component$, type QRL } from "@builder.io/qwik";
import {
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";

export const AsyncRetryControl = component$((props: AsyncRetryControlProps) => {
  if (!props.onRetry$ && !props.href) {
    return props.message ? (
      <p class={["text-sm text-[color:var(--color-text-muted)]", props.class]}>
        {props.message}
      </p>
    ) : null;
  }

  return (
    <div
      class={[
        "flex flex-wrap items-center gap-3",
        props.compact ? "text-xs" : "text-sm",
        props.class,
      ]}
    >
      {props.message ? (
        <p class="text-[color:var(--color-text-muted)]">{props.message}</p>
      ) : null}

      {props.onRetry$ ? (
        <button
          type="button"
          class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
          onClick$={() => {
            if (props.telemetry) {
              trackBookingEvent("booking_retry_requested", {
                vertical: props.telemetry.vertical,
                surface: props.telemetry.surface,
                retry_type: props.telemetry.retryType,
                context: props.telemetry.context,
              });
            }

            return props.onRetry$?.();
          }}
        >
          {props.label || "Retry"}
        </button>
      ) : props.href ? (
        <a
          class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
          href={props.href}
          onClick$={() => {
            if (!props.telemetry) return;

            trackBookingEvent("booking_retry_requested", {
              vertical: props.telemetry.vertical,
              surface: props.telemetry.surface,
              retry_type: props.telemetry.retryType,
              context: props.telemetry.context,
            });
          }}
        >
          {props.label || "Retry"}
        </a>
      ) : null}
    </div>
  );
});

type AsyncRetryControlProps = {
  message?: string | null;
  label?: string;
  href?: string;
  class?: string;
  compact?: boolean;
  onRetry$?: QRL<() => void>;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
    retryType?: string;
    context?: string;
  };
};
