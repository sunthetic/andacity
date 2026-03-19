import { component$ } from "@builder.io/qwik";
import { RecoveryNotice } from "~/components/recovery/RecoveryNotice";
import type { ConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";

const getToneClasses = (
  tone: NonNullable<ConfirmationPageModel["itineraryNotice"]>["tone"],
) => {
  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)]";
};

export const ConfirmationItineraryNotice = component$(
  (props: {
    notice: ConfirmationPageModel["itineraryNotice"];
    recoveryState?: ConfirmationPageModel["itineraryRecovery"];
  }) => {
    if (props.recoveryState) {
      return <RecoveryNotice recoveryState={props.recoveryState} />;
    }

    if (!props.notice) return null;

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          getToneClasses(props.notice.tone),
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.notice.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.notice.message}
            </p>
          </div>

          {props.notice.href ? (
            <a
              href={props.notice.href}
              class="rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {props.notice.label}
            </a>
          ) : (
            <span class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)]">
              {props.notice.label}
            </span>
          )}
        </div>
      </section>
    );
  },
);
