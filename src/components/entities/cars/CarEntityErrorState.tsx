import { component$ } from "@builder.io/qwik";
import type { CarEntityErrorStateModel } from "~/types/car-entity-page";

export const CarEntityErrorState = component$(
  (props: CarEntityErrorStateProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-error,#b91c1c)]">
          {props.state.badge}
        </p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {props.state.title}
        </h2>
        <p class="mt-3 max-w-[72ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.state.description}
        </p>

        {props.state.detailItems.length ? (
          <dl class="mt-5 grid gap-4 sm:grid-cols-2">
            {props.state.detailItems.map((item) => (
              <div key={`${item.label}:${item.value}`}>
                <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  {item.label}
                </dt>
                <dd class="mt-1 break-all rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text)]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div class="mt-6 flex flex-wrap gap-3">
          <a
            class="t-btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold"
            href={props.state.primaryAction.href}
          >
            {props.state.primaryAction.label}
          </a>
          {props.state.secondaryAction ? (
            <a
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] px-5 text-sm font-semibold text-[color:var(--color-action)] transition hover:border-[color:var(--color-action)]"
              href={props.state.secondaryAction.href}
            >
              {props.state.secondaryAction.label}
            </a>
          ) : null}
        </div>
      </section>
    );
  },
);

type CarEntityErrorStateProps = {
  state: CarEntityErrorStateModel;
};
