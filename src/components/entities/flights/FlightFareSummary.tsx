import { component$ } from "@builder.io/qwik";
import { BookableEntityAddToTripForm } from "~/components/entities/BookableEntityAddToTripForm";
import type {
  FlightEntityCtaModel,
  FlightFareSummaryModel,
} from "~/types/flight-entity-page";
import type { BookableEntity } from "~/types/bookable-entity";

export const FlightFareSummary = component$((props: FlightFareSummaryProps) => {
  return (
    <aside class="rounded-[28px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-card-bg)] px-5 py-5 shadow-[var(--shadow-soft)] lg:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
            Fare summary
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Fare and pricing
          </h2>
        </div>
        {props.fare.currencyCode ? (
          <p class="rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)] shadow-[var(--shadow-sm)]">
            {props.fare.currencyCode}
          </p>
        ) : null}
      </div>

      <dl class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Cabin class
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.cabinClassLabel}
          </dd>
        </div>

        {props.fare.fareCodeLabel ? (
          <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Fare code
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.fareCodeLabel}
            </dd>
          </div>
        ) : null}

        <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Refundability
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.refundabilityLabel}
          </dd>
        </div>

        {props.fare.changeabilityLabel ? (
          <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Change policy
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.changeabilityLabel}
            </dd>
          </div>
        ) : null}

        <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Baggage
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.baggageLabel}
          </dd>
        </div>

        {props.fare.seatsRemainingLabel ? (
          <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-3 shadow-[var(--shadow-sm)]">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Seat inventory
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.seatsRemainingLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      <div class="mt-4 rounded-[24px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-price-bg)] px-5 py-4 shadow-[var(--shadow-e2)]">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-action)]">
              Total price
            </p>
            <p class="mt-1 text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {props.fare.totalPriceLabel}
            </p>
          </div>
        </div>
        {props.fare.priceNote ? (
          <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
            {props.fare.priceNote}
          </p>
        ) : null}
      </div>

      <BookableEntityAddToTripForm
        cta={props.cta}
        entity={props.entity}
        vertical="flight"
      />
    </aside>
  );
});

type FlightFareSummaryProps = {
  fare: FlightFareSummaryModel;
  cta: FlightEntityCtaModel;
  entity: BookableEntity;
};
