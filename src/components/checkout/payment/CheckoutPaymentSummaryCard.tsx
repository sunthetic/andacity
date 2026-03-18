import { component$ } from "@builder.io/qwik";
import type { CheckoutPaymentSummary } from "~/types/payment";

const LabelRow = component$((props: { label: string; value: string }) => {
  return (
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm text-[color:var(--color-text-muted)]">
        {props.label}
      </span>
      <span class="text-sm font-medium text-[color:var(--color-text-strong)]">
        {props.value}
      </span>
    </div>
  );
});

export const CheckoutPaymentSummaryCard = component$(
  (props: { paymentSummary: CheckoutPaymentSummary }) => {
    const { paymentSummary } = props;

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Payment summary
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          Server-backed payment state for the latest checkout totals.
        </p>

        <div class="mt-5 space-y-3">
          <LabelRow label="Payable total" value={paymentSummary.amountLabel} />
          <LabelRow
            label="Provider"
            value={paymentSummary.provider || "Not initialized"}
          />
          <LabelRow label="Status" value={paymentSummary.statusLabel} />
          {paymentSummary.updatedLabel ? (
            <LabelRow
              label="Last updated"
              value={paymentSummary.updatedLabel}
            />
          ) : null}
        </div>

        {paymentSummary.fingerprintMatchesCheckout === false ? (
          <p class="mt-4 text-sm text-[color:rgba(146,64,14,1)]">
            This payment session was created for older checkout totals and will
            be replaced on the next initialization.
          </p>
        ) : null}
      </aside>
    );
  },
);
