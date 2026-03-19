import { component$ } from "@builder.io/qwik";

export const SavedTravelersEmptyState = component$(
  (props: { title: string; message: string }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-6">
        <h2 class="text-xl font-semibold text-[color:var(--color-text-strong)]">
          {props.title}
        </h2>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {props.message}
        </p>
      </section>
    );
  },
);
