import { component$ } from "@builder.io/qwik";
import type { HotelOfferSummaryModel } from "~/types/hotel-entity-page";

export const HotelOfferSummary = component$((props: HotelOfferSummaryProps) => {
  return (
    <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Offer details
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Room and rate
      </h2>

      <dl class="mt-5 grid gap-4">
        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Room type
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.offer.roomTypeLabel}
          </dd>
        </div>

        {props.offer.ratePlanLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Rate plan
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.offer.ratePlanLabel}
            </dd>
          </div>
        ) : null}

        {props.offer.boardTypeLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Board type
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.offer.boardTypeLabel}
            </dd>
          </div>
        ) : null}

        {props.offer.bedConfigurationLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Bed configuration
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.offer.bedConfigurationLabel}
            </dd>
          </div>
        ) : null}

        {props.offer.roomSizeLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Room size
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.offer.roomSizeLabel}
            </dd>
          </div>
        ) : null}

        {props.offer.occupancyLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Occupancy
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.offer.occupancyLabel}
            </dd>
          </div>
        ) : null}

        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Cancellation summary
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.offer.cancellationSummary}
          </dd>
        </div>
      </dl>

      <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Included features
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          {props.offer.includedFeatures.length ? (
            props.offer.includedFeatures.map((feature) => (
              <span
                key={feature}
                class="rounded-full border border-[color:rgba(8,145,178,0.18)] bg-white px-3 py-1 text-xs font-medium text-[color:var(--color-text)]"
              >
                {feature}
              </span>
            ))
          ) : (
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Included features are unavailable for this stay.
            </p>
          )}
        </div>
      </div>
    </section>
  );
});

type HotelOfferSummaryProps = {
  offer: HotelOfferSummaryModel;
};
