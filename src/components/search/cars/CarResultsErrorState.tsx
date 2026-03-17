import { component$ } from "@builder.io/qwik";
import type { CarResultsErrorStateModel } from "~/types/search-ui";

export const CarResultsErrorState = component$((props: CarResultsErrorStateProps) => {
  return (
    <section
      class="rounded-3xl border border-[color:var(--color-danger-border,#f1b3b8)] bg-[color:var(--color-danger-surface,#fff5f5)] p-6"
      role="alert"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Car search error
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            {props.model.title}
          </h2>
          <p class="mt-3 max-w-[64ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
            {props.model.description}
          </p>
          {props.model.routeLabel ? (
            <p class="mt-3 text-sm font-medium text-[color:var(--color-text-strong)]">
              Airport: {props.model.routeLabel}
            </p>
          ) : null}
        </div>

        <span class="t-badge bg-white/80">{props.model.statusLabel}</span>
      </div>

      <div class="mt-5 flex flex-wrap gap-3">
        <a class="t-btn-primary px-5 text-center" href={props.model.retryHref}>
          {props.model.retryLabel}
        </a>
        <a class="t-btn-ghost px-5 text-center" href={props.model.backToSearchHref}>
          {props.model.backToSearchLabel}
        </a>
      </div>
    </section>
  );
});

type CarResultsErrorStateProps = {
  model: CarResultsErrorStateModel;
};
