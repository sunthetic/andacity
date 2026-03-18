import { component$ } from "@builder.io/qwik";
import type { CheckoutSessionSummary } from "~/types/checkout";

export const CheckoutRevalidationNotice = component$(
  (props: { summary: CheckoutSessionSummary }) => {
    const { summary } = props;
    const isVerifying = summary.revalidationStatus === "pending";
    const isReady = summary.readinessState === "ready";
    const isExpired = summary.status === "expired";

    const title = isVerifying
      ? "Verifying pricing and availability"
      : isReady
        ? "Checkout is ready"
        : isExpired
          ? "Checkout is expired"
          : "Checkout is blocked";
    const body = isVerifying
      ? "We’re confirming current inventory against this saved checkout snapshot."
      : isReady
        ? "We rechecked pricing and availability for your trip."
        : isExpired
          ? "This checkout session expired before payment could continue."
          : "One or more items changed before checkout could continue.";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          isReady
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : isVerifying
              ? "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]"
              : "border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)]",
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {body}
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {isReady
                ? "Payment stays blocked until the payment layer is added, but this session has passed the canonical revalidation gate."
                : "Review the updates below before proceeding."}
            </p>
          </div>

          <div class="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-strong)]">
            {summary.lastRevalidatedLabel || "Not yet checked"}
          </div>
        </div>
      </section>
    );
  },
);
