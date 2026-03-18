import { component$ } from "@builder.io/qwik";
import type { CheckoutSessionSummary } from "~/types/checkout";

export const CheckoutHeader = component$(
  (props: { summary: CheckoutSessionSummary }) => {
    const { summary } = props;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Checkout session
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
              Checkout
            </h1>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-medium text-[color:var(--color-text-strong)]">
                {summary.shortId}
              </span>
              <span>{summary.statusLabel}</span>
              <span aria-hidden="true">·</span>
              <span>
                {summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-4 py-3 text-left sm:text-right">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Snapshot total
            </p>
            <p class="mt-1 text-xl font-semibold text-[color:var(--color-text-strong)]">
              {summary.totalLabel}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Trip {summary.tripReference} · expires {summary.expiresLabel}
            </p>
          </div>
        </div>
      </section>
    );
  },
);
