import { component$ } from "@builder.io/qwik";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type { CheckoutItemSnapshot } from "~/types/checkout";

const toTitleCase = (value: string) =>
  String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const formatDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} to ${endDate}`;
  }
  return startDate || endDate || null;
};

export const CheckoutItemList = component$(
  (props: { items: CheckoutItemSnapshot[] }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Trip snapshot
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Checkout only uses canonical persisted trip items and their stored
              inventory snapshots.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          {props.items.map((item) => {
            const dateLabel = formatDateRange(item.startDate, item.endDate);
            const priceLabel =
              item.pricing.totalAmountCents != null && item.pricing.currencyCode
                ? formatMoneyFromCents(
                    item.pricing.totalAmountCents,
                    item.pricing.currencyCode,
                  )
                : "Pricing unavailable";

            return (
              <article
                key={`${item.tripItemId}:${item.inventory.inventoryId}`}
                class="rounded-xl border border-[color:var(--color-border-subtle)] p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="rounded-full bg-[color:rgba(15,23,42,0.06)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                        {toTitleCase(item.vertical)}
                      </span>
                      <span class="text-xs text-[color:var(--color-text-muted)]">
                        Canonical item #{item.tripItemId}
                      </span>
                    </div>
                    <h2 class="mt-3 text-lg font-semibold text-[color:var(--color-text-strong)]">
                      {item.title}
                    </h2>
                    {item.subtitle ? (
                      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        {item.subtitle}
                      </p>
                    ) : null}
                    <div class="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-text-muted)]">
                      {dateLabel ? (
                        <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                          {dateLabel}
                        </span>
                      ) : null}
                      <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                        {item.inventory.inventoryId}
                      </span>
                      {item.meta.slice(0, 3).map((entry) => (
                        <span
                          key={`${item.tripItemId}:${entry}`}
                          class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1"
                        >
                          {entry}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-3 py-3 text-right">
                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                      Stored total
                    </p>
                    <p class="mt-1 text-base font-semibold text-[color:var(--color-text-strong)]">
                      {priceLabel}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  },
);
