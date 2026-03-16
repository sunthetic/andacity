import { component$ } from "@builder.io/qwik";
import type { CarRentalPoliciesModel } from "~/types/car-entity-page";

export const CarRentalPolicies = component$((props: CarRentalPoliciesProps) => {
  return (
    <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Policies
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Cancellation and renter rules
      </h2>

      <dl class="mt-5 grid gap-4">
        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Cancellation
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.policies.cancellationSummary}
          </dd>
        </div>

        {props.policies.paymentLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Payment
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.paymentLabel}
            </dd>
          </div>
        ) : null}

        {props.policies.depositLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Deposit
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.depositLabel}
            </dd>
          </div>
        ) : null}

        {props.policies.minimumDriverAgeLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Age requirement
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.minimumDriverAgeLabel}
            </dd>
          </div>
        ) : null}

        {props.policies.quotedDriverAgeLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Driver profile
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.quotedDriverAgeLabel}
            </dd>
          </div>
        ) : null}

        {props.policies.feesLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Fees
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.policies.feesLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      {props.policies.notes.length ? (
        <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Notable inclusions and restrictions
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
});

type CarRentalPoliciesProps = {
  policies: CarRentalPoliciesModel;
};
