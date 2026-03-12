import { component$ } from "@builder.io/qwik";

export const AsyncInlineSpinner = component$(
  (props: AsyncInlineSpinnerProps) => {
    const sizeClass = props.compact ? "h-3.5 w-3.5 border-[1.5px]" : "h-4 w-4";
    const textClass = props.compact ? "text-xs" : "text-sm";
    const label = props.label || "Loading";

    return (
      <span
        class={[
          "inline-flex items-center gap-2 text-[color:var(--color-text-muted)]",
          props.class,
        ]}
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          class={[
            "inline-block animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-action)]",
            sizeClass,
          ]}
        />
        {props.label ? (
          <span class={textClass}>{props.label}</span>
        ) : (
          <span class="sr-only">{label}</span>
        )}
      </span>
    );
  },
);

type AsyncInlineSpinnerProps = {
  label?: string;
  compact?: boolean;
  class?: string;
};
