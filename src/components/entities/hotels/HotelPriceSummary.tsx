import { component$ } from "@builder.io/qwik";
import type {
  HotelEntityCtaModel,
  HotelPriceSummaryModel,
} from "~/types/hotel-entity-page";

export const HotelPriceSummary = component$((props: HotelPriceSummaryProps) => {
  return (
    <aside class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
        Price summary
      </p>
      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
        Stay pricing
      </h2>

      <div class="mt-6 rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total price
        </p>
        <p class="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {props.price.totalPriceLabel}
        </p>
        {props.price.nightlyPriceLabel ? (
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {props.price.nightlyPriceLabel}
          </p>
        ) : null}
        {props.price.stayLengthLabel ? (
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {props.price.stayLengthLabel}
          </p>
        ) : null}
      </div>

      <dl class="mt-6 grid gap-4">
        {props.price.basePriceLabel ? (
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Base price
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

      <div class="mt-6">
        <button
          type="button"
          disabled={props.cta.disabled}
          data-bookable-vertical="hotel"
          data-bookable-inventory-id={props.cta.inventoryId}
          data-bookable-canonical-path={props.cta.canonicalPath}
          class="t-btn-primary inline-flex min-h-11 w-full items-center justify-center px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.cta.label}
        </button>
        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.cta.note}
        </p>
      </div>
    </aside>
  );
});

type HotelPriceSummaryProps = {
  price: HotelPriceSummaryModel;
  cta: HotelEntityCtaModel;
};
