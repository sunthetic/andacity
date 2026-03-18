import { component$ } from "@builder.io/qwik";
import { CheckoutPaymentMethodForm } from "~/components/checkout/payment/CheckoutPaymentMethodForm";
import { CheckoutPaymentStatusNotice } from "~/components/checkout/payment/CheckoutPaymentStatusNotice";
import { CheckoutPaymentSummaryCard } from "~/components/checkout/payment/CheckoutPaymentSummaryCard";
import type { CheckoutPaymentSummary } from "~/types/payment";

export const CheckoutPaymentSection = component$(
  (props: {
    paymentSummary: CheckoutPaymentSummary;
    paymentNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    return (
      <section
        id="checkout-payment"
        class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Payment
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Payment stays tied to this canonical checkout session and its
              latest revalidated totals.
            </p>
          </div>
          <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {props.paymentSummary.statusLabel}
          </span>
        </div>

        <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <div class="space-y-4">
            <CheckoutPaymentStatusNotice
              paymentSummary={props.paymentSummary}
              paymentNotice={props.paymentNotice}
            />
            <div class="rounded-xl bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
              <CheckoutPaymentMethodForm
                paymentSummary={props.paymentSummary}
              />
            </div>
          </div>

          <CheckoutPaymentSummaryCard paymentSummary={props.paymentSummary} />
        </div>
      </section>
    );
  },
);
