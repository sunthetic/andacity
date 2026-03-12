import { component$, type QRL } from "@builder.io/qwik";
import {
  markBookingStageProgress,
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";

export const SaveButton = component$((props: SaveButtonProps) => {
  const base =
    "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition";
  const stateClass = props.saved
    ? "border-[color:var(--color-action)] bg-[color:var(--color-action-soft)] text-[color:var(--color-action)]"
    : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-strong)]";

  return (
    <button
      type="button"
      aria-pressed={props.saved}
      onClick$={() => {
        if (props.telemetry) {
          trackBookingEvent("booking_shortlist_toggled", {
            vertical: props.telemetry.vertical,
            surface: props.telemetry.surface,
            item_id: props.telemetry.itemId,
            item_position: props.telemetry.itemPosition ?? undefined,
            action: props.saved ? "remove" : "add",
          });

          if (props.telemetry.surface === "detail") {
            markBookingStageProgress("detail");
          }
        }

        return props.onToggle$();
      }}
      disabled={props.disabled}
      class={[base, stateClass, props.class]}
    >
      {props.saved
        ? props.activeLabel || "Saved"
        : props.idleLabel || "Save"}
    </button>
  );
});

type SaveButtonProps = {
  saved: boolean;
  onToggle$: QRL<() => void>;
  class?: string;
  idleLabel?: string;
  activeLabel?: string;
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    itemId: string;
    surface: string;
    itemPosition?: number | null;
  };
};
