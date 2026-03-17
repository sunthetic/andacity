import { component$ } from "@builder.io/qwik";
import { BookableEntityAddToTripForm } from "~/components/entities/BookableEntityAddToTripForm";
import type {
  FlightEntityCtaModel,
  FlightFareSummaryModel,
} from "~/types/flight-entity-page";

export const FlightFareSummary = component$((props: FlightFareSummaryProps) => {
  return (
    <aside class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Fare summary
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Fare and pricing
      </h2>

      <dl class="mt-5 grid gap-4">
        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Cabin class
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.cabinClassLabel}
          </dd>
        </div>

        {props.fare.fareCodeLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Fare code
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.fareCodeLabel}
            </dd>
          </div>
        ) : null}

        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Refundability
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.refundabilityLabel}
          </dd>
        </div>

        {props.fare.changeabilityLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Change policy
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.changeabilityLabel}
            </dd>
          </div>
        ) : null}

        <div>
          <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Baggage
          </dt>
          <dd class="mt-1 text-sm text-[color:var(--color-text)]">
            {props.fare.baggageLabel}
          </dd>
        </div>

        {props.fare.seatsRemainingLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Seat inventory
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.fare.seatsRemainingLabel}
            </dd>
          </div>
        ) : null}
      </dl>

      <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total price
        </p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {props.fare.totalPriceLabel}
        </p>
        {props.fare.currencyCode ? (
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Currency: {props.fare.currencyCode}
          </p>
        ) : null}
        {props.fare.priceNote ? (
          <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
            {props.fare.priceNote}
          </p>
        ) : null}
      </div>

      <BookableEntityAddToTripForm cta={props.cta} vertical="flight" />
    </aside>
  );
});

type FlightFareSummaryProps = {
  fare: FlightFareSummaryModel;
  cta: FlightEntityCtaModel;
};
