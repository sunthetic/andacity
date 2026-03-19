import { component$ } from "@builder.io/qwik";

export const ResumeLoading = component$(() => {
  return (
    <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
      <div class="animate-pulse space-y-4">
        <div class="h-4 w-1/3 rounded bg-[color:rgba(148,163,184,0.3)]" />
        <div class="h-3 w-3/4 rounded bg-[color:rgba(148,163,184,0.22)]" />
        <div class="h-3 w-2/3 rounded bg-[color:rgba(148,163,184,0.22)]" />
        <div class="h-10 w-40 rounded bg-[color:rgba(148,163,184,0.25)]" />
      </div>
    </section>
  );
});
