import { component$ } from "@builder.io/qwik";
import type { CheckoutSessionSummary } from "~/types/checkout";

export const CheckoutStatusNotice = component$(
  (props: { summary: CheckoutSessionSummary }) => {
    const { summary } = props;
    const isWarning =
      summary.status === "blocked" ||
      summary.status === "expired" ||
      summary.status === "abandoned";
    const isComplete = summary.status === "completed";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          isWarning
            ? "border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)]"
            : isComplete
              ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
              : "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]",
        ]}
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {summary.entryMode === "resumed"
                ? "Resumed your current checkout session"
                : summary.entryMode === "created"
                  ? "Started a fresh checkout snapshot"
                  : `Status: ${summary.statusLabel}`}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {summary.statusDescription}
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Pricing and availability will be confirmed before payment. To
              change the trip itself, return to the trip page and start checkout
              again when you are ready.
            </p>
          </div>

          {isWarning && summary.canReturnToTrip ? (
            <a
              href={summary.tripHref}
              class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Back to trip
            </a>
          ) : null}
        </div>
      </section>
    );
  },
);
