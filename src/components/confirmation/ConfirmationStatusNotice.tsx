import { component$ } from "@builder.io/qwik";
import type { ConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";

const getToneClasses = (
  tone: NonNullable<ConfirmationPageModel["statusNotice"]>["tone"],
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

export const ConfirmationStatusNotice = component$(
  (props: { notice: ConfirmationPageModel["statusNotice"] }) => {
    if (!props.notice) return null;

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          getToneClasses(props.notice.tone),
        ]}
        role="status"
        aria-live="polite"
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.notice.title}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {props.notice.message}
        </p>
      </section>
    );
  },
);
