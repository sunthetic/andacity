import { component$ } from "@builder.io/qwik";

export const TripNotFoundState = component$(
  (props: { title: string; message: string }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 class="text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {props.title}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          {props.message}
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <a
            href="/trips"
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Back to trips
          </a>
          <a
            href="/"
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Go home
          </a>
        </div>
      </section>
    );
  },
);
