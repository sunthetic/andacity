import { component$ } from "@builder.io/qwik";

export const ItineraryLoading = component$(() => {
  return (
    <div class="space-y-6" aria-hidden="true">
      <section class="animate-pulse rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="h-3 w-32 rounded bg-[color:rgba(148,163,184,0.24)]" />
        <div class="mt-4 h-8 w-72 max-w-full rounded bg-[color:rgba(148,163,184,0.24)]" />
        <div class="mt-3 h-4 w-full max-w-2xl rounded bg-[color:rgba(148,163,184,0.18)]" />
        <div class="mt-5 flex flex-wrap gap-2">
          <div class="h-8 w-28 rounded-full bg-[color:rgba(148,163,184,0.18)]" />
          <div class="h-8 w-40 rounded-full bg-[color:rgba(148,163,184,0.18)]" />
          <div class="h-8 w-32 rounded-full bg-[color:rgba(148,163,184,0.18)]" />
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div class="space-y-6">
          <section class="animate-pulse rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <div class="h-5 w-40 rounded bg-[color:rgba(148,163,184,0.24)]" />
            <div class="mt-2 h-4 w-72 rounded bg-[color:rgba(148,163,184,0.18)]" />
            <div class="mt-5 space-y-3">
              <div class="h-32 rounded-xl bg-[color:rgba(148,163,184,0.14)]" />
              <div class="h-32 rounded-xl bg-[color:rgba(148,163,184,0.14)]" />
            </div>
          </section>
        </div>

        <section class="animate-pulse rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div class="h-5 w-40 rounded bg-[color:rgba(148,163,184,0.24)]" />
          <div class="mt-4 h-24 rounded-xl bg-[color:rgba(148,163,184,0.14)]" />
          <div class="mt-4 space-y-3">
            <div class="h-4 rounded bg-[color:rgba(148,163,184,0.14)]" />
            <div class="h-4 rounded bg-[color:rgba(148,163,184,0.14)]" />
            <div class="h-4 rounded bg-[color:rgba(148,163,184,0.14)]" />
          </div>
        </section>
      </div>
    </div>
  );
});
