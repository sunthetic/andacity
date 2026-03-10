import { component$ } from "@builder.io/qwik";

export const FlightFilters = component$((props: FlightFiltersProps) => {
  return (
    <div class="grid gap-5">
      {props.groups.map((group) => (
        <section key={group.title}>
          <h4 class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            {group.title}
          </h4>
          <div class="mt-2 flex flex-wrap gap-2">
            {group.options.map((option) => (
              <a
                key={`${group.title}-${option.label}`}
                href={option.href}
                aria-disabled={props.disabled || undefined}
                tabIndex={props.disabled ? -1 : undefined}
                class={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  option.active
                    ? "border-[color:var(--color-action)] bg-[color:var(--color-primary-50)] text-[color:var(--color-action)]"
                    : "border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text)] hover:bg-white",
                  props.disabled
                    ? "pointer-events-none cursor-not-allowed opacity-60"
                    : null,
                ]}
                aria-current={option.active ? "page" : undefined}
              >
                {option.label}
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});

export type FlightFilterGroup = {
  title: string;
  options: {
    label: string;
    href: string;
    active?: boolean;
  }[];
};

type FlightFiltersProps = {
  groups: FlightFilterGroup[];
  disabled?: boolean;
};
