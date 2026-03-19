import { component$ } from "@builder.io/qwik";

export const MyTripsLoading = component$(() => {
  return (
    <div class="space-y-6">
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div class="h-3 w-40 rounded bg-[color:var(--color-surface-1)]" />
        <div class="mt-4 h-10 w-56 rounded bg-[color:var(--color-surface-1)]" />
        <div class="mt-3 h-4 w-80 max-w-full rounded bg-[color:var(--color-surface-1)]" />
      </section>

      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div class="h-4 w-48 rounded bg-[color:var(--color-surface-1)]" />
        <div class="mt-4 space-y-4">
          {[1, 2, 3].map((index) => (
            <div
              key={`my-trips-loading-${index}`}
              class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] p-5"
            >
              <div class="h-3 w-28 rounded bg-[color:var(--color-surface-1)]" />
              <div class="mt-3 h-6 w-64 max-w-full rounded bg-[color:var(--color-surface-1)]" />
              <div class="mt-3 h-4 w-full rounded bg-[color:var(--color-surface-1)]" />
              <div class="mt-2 h-4 w-3/4 rounded bg-[color:var(--color-surface-1)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});
