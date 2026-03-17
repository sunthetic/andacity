import { component$ } from "@builder.io/qwik";

export const TripEmptyState = component$((props: { continueHref: string }) => {
  return (
    <section class="rounded-[var(--radius-xl)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-center">
      <h2 class="text-xl font-semibold text-[color:var(--color-text-strong)]">
        This trip is empty
      </h2>
      <p class="mx-auto mt-2 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
        The persisted trip exists, but it does not contain any saved flights,
        hotels, or cars yet. Add and mutation flows will attach to this surface
        in the next tasks.
      </p>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <a
          href={props.continueHref}
          class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
        >
          Continue later
        </a>
        <button
          type="button"
          disabled
          class="cursor-not-allowed rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70"
        >
          Add more items
        </button>
      </div>
    </section>
  );
});
