import { component$ } from "@builder.io/qwik";
import type { CarVehicleSpecsModel } from "~/types/car-entity-page";

export const CarVehicleSpecs = component$((props: CarVehicleSpecsProps) => {
  return (
    <section class="rounded-[28px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-card-bg)] px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Vehicle details
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Specs and rental setup
      </h2>

      <dl class="mt-5 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Category
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.specs.vehicleClassLabel}
          </dd>
        </div>

        <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Transmission
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.specs.transmissionLabel}
          </dd>
        </div>

        <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Passenger capacity
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.specs.passengerCapacityLabel}
          </dd>
        </div>

        <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Baggage
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.specs.baggageCapacityLabel}
          </dd>
        </div>

        {props.specs.doorCountLabel ? (
          <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Doors
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.specs.doorCountLabel}
            </dd>
          </div>
        ) : null}

        {props.specs.airConditioningLabel ? (
          <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Climate
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.specs.airConditioningLabel}
            </dd>
          </div>
        ) : null}

        {props.specs.fuelPolicyLabel ? (
          <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Fuel policy
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.specs.fuelPolicyLabel}
            </dd>
          </div>
        ) : null}

        {props.specs.mileagePolicyLabel ? (
          <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Mileage policy
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.specs.mileagePolicyLabel}
            </dd>
          </div>
        ) : null}

        {props.specs.ratePlanLabel ? (
          <div class="rounded-2xl bg-[color:var(--color-surface-1)] px-4 py-3 sm:col-span-2">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Rate plan
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.specs.ratePlanLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      {props.specs.highlights.length ? (
        <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Highlights
          </p>
          <ul class="mt-3 flex flex-wrap gap-2">
            {props.specs.highlights.map((highlight) => (
              <li
                key={highlight}
                class="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-medium text-[color:var(--color-text)]"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
});

type CarVehicleSpecsProps = {
  specs: CarVehicleSpecsModel;
};
