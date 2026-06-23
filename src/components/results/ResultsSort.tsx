import { component$ } from "@builder.io/qwik";

export const ResultsSort = component$((props: ResultsSortProps) => {
  return (
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
    >
      <p class="text-sm" style="color:var(--ui-text-muted)">
        {props.resultCountLabel}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        {props.options.map((option) => (
          <a
            key={option.value}
            href={option.href}
            aria-disabled={props.disabled || undefined}
            tabIndex={props.disabled ? -1 : undefined}
            class={[
              "rounded-full px-3 py-1 text-xs font-medium transition",
              props.disabled
                ? "pointer-events-none cursor-not-allowed opacity-60"
                : null,
            ]}
            style={
              option.active
                ? "background:var(--ui-accent-soft);border:1px solid var(--ui-primary);color:var(--ui-primary)"
                : "background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
            }
            aria-current={option.active ? "page" : undefined}
          >
            {option.label}
          </a>
        ))}
      </div>
    </div>
  );
});

export type ResultsSortOption = {
  label: string;
  value: string;
  href: string;
  active?: boolean;
};

type ResultsSortProps = {
  resultCountLabel: string;
  options: ResultsSortOption[];
  disabled?: boolean;
};
