import { component$ } from "@builder.io/qwik";
import { RecoveryActionList } from "~/components/recovery/RecoveryActionList";
import { RecoveryStatusBadge } from "~/components/recovery/RecoveryStatusBadge";
import type { RecoveryState } from "~/types/recovery";

const classesForSeverity = (severity: RecoveryState["severity"]) => {
  if (severity === "critical") {
    return "border-[color:rgba(127,29,29,0.24)] bg-[color:rgba(254,226,226,0.96)]";
  }

  if (severity === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]";
  }

  if (severity === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)]";
};

export const RecoveryNotice = component$(
  (props: {
    recoveryState: RecoveryState | null;
    class?: string;
    hideActions?: boolean;
  }) => {
    if (!props.recoveryState) return null;

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          classesForSeverity(props.recoveryState.severity),
          props.class,
        ]}
        role={
          props.recoveryState.severity === "error" ||
          props.recoveryState.severity === "critical"
            ? "alert"
            : "status"
        }
        aria-live="polite"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.recoveryState.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.recoveryState.message}
            </p>
          </div>

          <RecoveryStatusBadge
            severity={props.recoveryState.severity}
            stage={props.recoveryState.stage}
          />
        </div>

        {!props.hideActions && props.recoveryState.actions.length ? (
          <RecoveryActionList
            actions={props.recoveryState.actions}
            class="mt-4"
          />
        ) : null}
      </section>
    );
  },
);
