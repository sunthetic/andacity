import { component$ } from "@builder.io/qwik";
import { BookableEntityAddToTripForm } from "~/components/entities/BookableEntityAddToTripForm";
import type {
  CarEntityCtaModel,
  CarPriceSummaryModel,
} from "~/types/car-entity-page";
import type { BookableEntity } from "~/types/bookable-entity";

export const CarPriceSummary = component$((props: CarPriceSummaryProps) => {
  return (
    <aside class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Price summary
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Rental pricing
      </h2>

      <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total price
        </p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {props.price.totalPriceLabel}
        </p>
        {props.price.dailyPriceLabel ? (
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {props.price.dailyPriceLabel}
          </p>
        ) : null}
        {props.price.rentalLengthLabel ? (
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {props.price.rentalLengthLabel}
          </p>
        ) : null}
      </div>

      <dl class="mt-6 grid gap-4">
        {props.price.basePriceLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Base rental
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.price.basePriceLabel}
            </dd>
          </div>
        ) : null}

        {props.price.taxesFeesLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Taxes and fees
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.price.taxesFeesLabel}
            </dd>
          </div>
        ) : null}

        {props.price.currencyCode ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Currency
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.price.currencyCode}
            </dd>
          </div>
        ) : null}
      </dl>

      {props.price.priceNote ? (
        <p class="mt-6 text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.price.priceNote}
        </p>
      ) : null}

      <BookableEntityAddToTripForm
        cta={props.cta}
        entity={props.entity}
        vertical="car"
      />
    </aside>
  );
});

type CarPriceSummaryProps = {
  price: CarPriceSummaryModel;
  cta: CarEntityCtaModel;
  entity: BookableEntity;
};
