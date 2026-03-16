import { component$ } from "@builder.io/qwik";
import type { FlightEntityUnavailableStateModel } from "~/types/flight-entity-page";

const toneClass = (tone: FlightEntityUnavailableStateModel["tone"]) =>
  tone === "critical"
    ? "border-[color:rgba(185,28,28,0.16)] bg-[color:rgba(185,28,28,0.04)]"
    : "border-[color:rgba(180,83,9,0.18)] bg-[color:rgba(180,83,9,0.05)]";

const badgeClass = (tone: FlightEntityUnavailableStateModel["tone"]) =>
  tone === "critical"
    ? "text-[color:var(--color-error,#b91c1c)]"
    : "text-[color:var(--color-warning,#92400e)]";

export const FlightEntityUnavailableState = component$(
  (props: FlightEntityUnavailableStateProps) => {
    return (
      <section
        class={[
          "rounded-[28px] border px-6 py-6 shadow-[var(--shadow-soft)]",
          toneClass(props.state.tone),
        ]}
      >
        <p
          class={[
            "text-xs font-semibold uppercase tracking-[0.1em]",
            badgeClass(props.state.tone),
          ]}
        >
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
                <dd class="mt-1 break-all rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--color-text)]">
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
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-white px-5 text-sm font-semibold text-[color:var(--color-action)] transition hover:border-[color:var(--color-action)]"
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

type FlightEntityUnavailableStateProps = {
  state: FlightEntityUnavailableStateModel;
};
