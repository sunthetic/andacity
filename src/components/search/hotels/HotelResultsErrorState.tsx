import { component$ } from "@builder.io/qwik";
import type { HotelResultsErrorStateModel } from "~/types/search-ui";

export const HotelResultsErrorState = component$((props: HotelResultsErrorStateProps) => {
  return (
    <section
      class="rounded-xl p-6"
      role="alert"
      style="background:var(--ui-danger-soft,#fff5f5);border:1px solid var(--ui-danger,#b91c1c)"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.12em]" style="color:var(--ui-text-muted)">
            Hotel search error
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight" style="color:var(--ui-text)">
            {props.model.title}
          </h2>
          <p class="mt-3 max-w-[64ch] text-sm leading-6" style="color:var(--ui-text-muted)">
            {props.model.description}
          </p>
          {props.model.routeLabel ? (
            <p class="mt-3 text-sm font-medium" style="color:var(--ui-text)">
              City: {props.model.routeLabel}
            </p>
          ) : null}
        </div>

        <span
          class="rounded-full px-2.5 py-1 text-xs font-medium"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
        >
          {props.model.statusLabel}
        </span>
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

type HotelResultsErrorStateProps = {
  model: HotelResultsErrorStateModel;
};
