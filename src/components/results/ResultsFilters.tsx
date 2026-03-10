import { Slot, component$ } from "@builder.io/qwik";

export const ResultsFilters = component$((props: ResultsFiltersProps) => {
  return (
    <section
      class={[
        "rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]",
        props.class,
      ]}
    >
      <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
        {props.title || "Filters"}
      </h3>
      <div class="mt-3">
        <Slot />
      </div>
    </section>
  );
});

type ResultsFiltersProps = {
  title?: string;
  class?: string;
};
