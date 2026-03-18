import { component$ } from "@builder.io/qwik";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type {
  CheckoutPricingSnapshot,
  CheckoutRevalidationSummary,
  CheckoutRevalidationStatus,
} from "~/types/checkout";

const formatAmount = (
  amountCents: number | null | undefined,
  currencyCode: string | null | undefined,
) => {
  if (amountCents == null || !currencyCode) return "Unavailable";
  return formatMoneyFromCents(amountCents, currencyCode);
};

export const CheckoutTotalsCard = component$(
  (props: {
    totals: CheckoutPricingSnapshot;
    itemCount: number;
    revalidationSummary: CheckoutRevalidationSummary | null;
    revalidationStatus: CheckoutRevalidationStatus;
  }) => {
    const { totals, revalidationSummary } = props;
    const showCurrentTotals = revalidationSummary?.currentTotals != null;

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
            label="Snapshot base"
            value={formatAmount(totals.baseAmountCents, totals.currencyCode)}
          />
          <TotalsRow
            label="Snapshot taxes"
            value={formatAmount(totals.taxesAmountCents, totals.currencyCode)}
          />
          <TotalsRow
            label="Snapshot fees"
            value={formatAmount(totals.feesAmountCents, totals.currencyCode)}
          />
        </div>

        <div class="mt-5 border-t border-[color:var(--color-border-subtle)] pt-4">
          <TotalsRow
            label="Snapshot total"
            value={formatAmount(totals.totalAmountCents, totals.currencyCode)}
            emphasize
          />
        </div>

        {showCurrentTotals ? (
          <div class="mt-5 rounded-xl bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Current resolved totals
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Latest provider-backed totals from the most recent checkout
              revalidation.
            </p>

            <div class="mt-4 space-y-3">
              <TotalsRow
                label="Current base"
                value={formatAmount(
                  revalidationSummary.currentTotals?.baseAmountCents,
                  revalidationSummary.currentTotals?.currencyCode,
                )}
              />
              <TotalsRow
                label="Current taxes"
                value={formatAmount(
                  revalidationSummary.currentTotals?.taxesAmountCents,
                  revalidationSummary.currentTotals?.currencyCode,
                )}
              />
              <TotalsRow
                label="Current fees"
                value={formatAmount(
                  revalidationSummary.currentTotals?.feesAmountCents,
                  revalidationSummary.currentTotals?.currencyCode,
                )}
              />
              <TotalsRow
                label="Current total"
                value={formatAmount(
                  revalidationSummary.currentTotals?.totalAmountCents,
                  revalidationSummary.currentTotals?.currencyCode,
                )}
                emphasize
              />
            </div>
          </div>
        ) : props.revalidationStatus === "passed" ? (
          <p class="mt-5 text-sm text-[color:var(--color-text-muted)]">
            Current totals match the stored checkout snapshot.
          </p>
        ) : null}
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
