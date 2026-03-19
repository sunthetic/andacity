import { component$ } from "@builder.io/qwik";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsEmptyState = component$(
  (props: { emptyState: NonNullable<MyTripsPageModel["emptyState"]> }) => {
    const { emptyState } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-8 text-center">
        <h2 class="text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {emptyState.title}
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          {emptyState.message}
        </p>
        {emptyState.detail ? (
          <p class="mx-auto mt-2 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
            {emptyState.detail}
          </p>
        ) : null}

        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={emptyState.primaryAction.href}
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {emptyState.primaryAction.label}
          </a>
          {emptyState.secondaryAction ? (
            <a
              href={emptyState.secondaryAction.href}
              class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              {emptyState.secondaryAction.label}
            </a>
          ) : null}
        </div>
      </section>
    );
  },
);
