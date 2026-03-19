import { component$ } from "@builder.io/qwik";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsHeader = component$(
  (props: { header: MyTripsPageModel["header"] }) => {
    const { header } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
          {header.eyebrow}
        </p>

        <div class="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-3xl font-semibold text-[color:var(--color-text-strong)]">
              {header.title}
            </h1>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {header.helper}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold uppercase tracking-[0.08em]">
              {header.modeLabel}
            </span>
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold">
              {header.countLabel}
            </span>
          </div>
        </div>
      </section>
    );
  },
);
