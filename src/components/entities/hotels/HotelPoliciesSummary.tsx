import { component$ } from "@builder.io/qwik";
import type { HotelPoliciesSummaryModel } from "~/types/hotel-entity-page";

export const HotelPoliciesSummary = component$(
  (props: HotelPoliciesSummaryProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
          Policies
        </p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Cancellation and stay rules
        </h2>

        <dl class="mt-5 grid gap-4">
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Refundability
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.refundabilityLabel}
            </dd>
          </div>

          {props.policies.freeCancellationLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Cancellation window
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.policies.freeCancellationLabel}
              </dd>
            </div>
          ) : null}

          {props.policies.cancellationLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Cancellation details
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.policies.cancellationLabel}
              </dd>
            </div>
          ) : null}

          {props.policies.payLaterLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Payment
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.policies.payLaterLabel}
              </dd>
            </div>
          ) : null}

          {props.policies.checkInLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Check-in
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.policies.checkInLabel}
              </dd>
            </div>
          ) : null}

          {props.policies.checkOutLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Check-out
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.policies.checkOutLabel}
              </dd>
            </div>
          ) : null}
        </dl>

        {props.policies.notes.length ? (
          <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Property notes
            </p>
            <ul class="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.policies.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  },
);

type HotelPoliciesSummaryProps = {
  policies: HotelPoliciesSummaryModel;
};
