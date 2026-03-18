import { component$ } from "@builder.io/qwik";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type { CheckoutPricingSnapshot } from "~/types/checkout";

const formatAmount = (
  amountCents: number | null | undefined,
  currencyCode: string | null | undefined,
) => {
  if (amountCents == null || !currencyCode) return "Unavailable";
  return formatMoneyFromCents(amountCents, currencyCode);
};

export const CheckoutTotalsCard = component$(
  (props: { totals: CheckoutPricingSnapshot; itemCount: number }) => {
    const { totals } = props;

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Checkout totals
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          Stored pricing snapshot for {props.itemCount} trip item
          {props.itemCount === 1 ? "" : "s"}.
        </p>

        <div class="mt-5 space-y-3">
          <TotalsRow
            label="Base"
            value={formatAmount(totals.baseAmountCents, totals.currencyCode)}
          />
          <TotalsRow
            label="Taxes"
            value={formatAmount(totals.taxesAmountCents, totals.currencyCode)}
          />
          <TotalsRow
            label="Fees"
            value={formatAmount(totals.feesAmountCents, totals.currencyCode)}
          />
        </div>

        <div class="mt-5 border-t border-[color:var(--color-border-subtle)] pt-4">
          <TotalsRow
            label="Total"
            value={formatAmount(totals.totalAmountCents, totals.currencyCode)}
            emphasize
          />
        </div>
      </aside>
    );
  },
);

const TotalsRow = component$(
  (props: { label: string; value: string; emphasize?: boolean }) => {
    return (
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-[color:var(--color-text-muted)]">
          {props.label}
        </span>
        <span
          class={[
            "text-sm",
            props.emphasize
              ? "font-semibold text-[color:var(--color-text-strong)]"
              : "text-[color:var(--color-text-strong)]",
          ]}
        >
          {props.value}
        </span>
      </div>
    );
  },
);
