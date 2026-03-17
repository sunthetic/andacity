import { component$ } from "@builder.io/qwik";
import type { FlightSearchSummaryModel } from "~/types/search-ui";

export const FlightSearchSummary = component$((props: FlightSearchSummaryProps) => {
  return (
    <section class="t-card p-5 md:p-6">
      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
        Flight search
      </p>

      <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] md:text-4xl">
            {props.summary.routeTitle}
          </h1>

          <dl class="mt-4 grid gap-3 text-sm text-[color:var(--color-text-muted)] sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl bg-[color:var(--color-neutral-50)] px-4 py-3">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Depart
              </dt>
              <dd class="mt-1 font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.departDateLabel}
              </dd>
            </div>

            {props.summary.returnDateLabel ? (
              <div class="rounded-2xl bg-[color:var(--color-neutral-50)] px-4 py-3">
                <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Return
                </dt>
                <dd class="mt-1 font-semibold text-[color:var(--color-text-strong)]">
                  {props.summary.returnDateLabel}
                </dd>
              </div>
            ) : null}

            <div class="rounded-2xl bg-[color:var(--color-neutral-50)] px-4 py-3">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Trip type
              </dt>
              <dd class="mt-1 font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.tripTypeLabel}
              </dd>
            </div>

            <div class="rounded-2xl bg-[color:var(--color-neutral-50)] px-4 py-3">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Results
              </dt>
              <dd class="mt-1 font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.resultCountLabel}
              </dd>
            </div>
          </dl>
        </div>

        <div class="flex max-w-xl flex-wrap justify-start gap-2 md:justify-end">
          {props.summary.metadataBadges.map((badge) => (
            <span key={badge} class="t-badge">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
});

type FlightSearchSummaryProps = {
  summary: FlightSearchSummaryModel;
};
