import { Slot, component$, type QRL } from "@builder.io/qwik";

export const ResultsFilters = component$((props: ResultsFiltersProps) => {
  return (
    <section
      class={["rounded-xl p-4 backdrop-blur", props.class]}
      style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
    >
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold" style="color:var(--ui-text)">
          {props.title || "Filters"}
        </h3>
        {props.actionLabel ? (
          props.actionHref ? (
            <a
              href={props.actionHref}
              aria-disabled={props.actionDisabled || undefined}
              tabIndex={props.actionDisabled ? -1 : undefined}
              class={[
                "text-xs font-medium hover:underline",
                props.actionDisabled
                  ? "pointer-events-none opacity-60"
                  : null,
              ]}
              style="color:var(--ui-primary)"
            >
              {props.actionLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled={props.actionDisabled}
              class="text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              style="color:var(--ui-primary)"
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
