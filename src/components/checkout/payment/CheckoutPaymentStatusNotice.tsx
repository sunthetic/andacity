import { component$ } from "@builder.io/qwik";
import type { CheckoutPaymentSummary } from "~/types/payment";

export const CheckoutPaymentStatusNotice = component$(
  (props: {
    paymentSummary: CheckoutPaymentSummary;
    paymentNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const { paymentSummary, paymentNotice } = props;
    const isReady =
      paymentSummary.checkoutReady &&
      (paymentSummary.status === null ||
        paymentSummary.status === "draft" ||
        paymentSummary.status === "pending" ||
        paymentSummary.status === "requires_action");
    const isSuccess =
      paymentSummary.status === "authorized" ||
      paymentSummary.status === "succeeded";
    const isWarning =
      !paymentSummary.checkoutReady ||
      paymentSummary.status === "failed" ||
      paymentSummary.status === "canceled" ||
      paymentSummary.status === "expired" ||
      paymentSummary.fingerprintMatchesCheckout === false;

    const tone = paymentNotice?.tone
      ? paymentNotice.tone
      : isSuccess
        ? "success"
        : isWarning
          ? "error"
          : isReady
            ? "info"
            : "info";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          tone === "success"
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : tone === "error"
              ? "border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)]"
              : "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]",
        ]}
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {paymentNotice?.message || paymentSummary.statusLabel}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {paymentSummary.statusDescription}
        </p>
      </section>
    );
  },
);
