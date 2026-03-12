import { Slot, component$, type QRL } from "@builder.io/qwik";

export const ResultsFilters = component$((props: ResultsFiltersProps) => {
  return (
    <section
      class={[
        "rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]",
        props.class,
      ]}
    >
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "Filters"}
        </h3>
        {props.actionLabel ? (
          props.actionHref ? (
            <a
              href={props.actionHref}
              aria-disabled={props.actionDisabled || undefined}
              tabIndex={props.actionDisabled ? -1 : undefined}
              class={[
                "text-xs font-medium text-[color:var(--color-action)] hover:underline",
                props.actionDisabled
                  ? "pointer-events-none opacity-60"
                  : null,
              ]}
            >
              {props.actionLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled={props.actionDisabled}
              class="text-xs font-medium text-[color:var(--color-action)] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              onClick$={props.onAction$}
            >
              {props.actionLabel}
            </button>
          )
        ) : null}
      </div>
      <div class="mt-3">
        <Slot />
      </div>
    </section>
  );
});

type ResultsFiltersProps = {
  title?: string;
  class?: string;
  actionLabel?: string;
  actionHref?: string;
  actionDisabled?: boolean;
  onAction$?: QRL<() => void>;
};
