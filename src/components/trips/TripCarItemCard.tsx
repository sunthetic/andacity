import { component$ } from "@builder.io/qwik";
import type { TripPageCarItemModel } from "~/lib/trips/trip-page-model";

export const TripCarItemCard = component$(
  (props: { item: TripPageCarItemModel }) => {
    const { item } = props;

    return (
      <article class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Car
            </p>
            <h3 class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {item.title}
            </h3>
            {item.vehicleSummary ? (
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {item.vehicleSummary}
              </p>
            ) : null}
            <div class="mt-3 flex flex-wrap gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span class="rounded-full border border-[color:var(--color-border-subtle)] px-2.5 py-1">
                {item.locationLabel}
              </span>
              <span class="rounded-full border border-[color:var(--color-border-subtle)] px-2.5 py-1">
                {item.rentalLabel}
              </span>
              {item.providerSummary ? (
                <span class="rounded-full border border-[color:var(--color-border-subtle)] px-2.5 py-1">
                  {item.providerSummary}
                </span>
              ) : null}
            </div>
            {item.meta.length ? (
              <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
                {item.meta.join(" · ")}
              </p>
            ) : null}
          </div>

          <aside class="min-w-[12rem] rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-3 py-3 text-left sm:text-right">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Saved price
            </p>
            <p class="mt-1 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {item.priceLabel}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {item.priceContext}
            </p>
            <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
              Added {item.addedLabel}
            </p>
          </aside>
        </div>

        <footer class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-border-subtle)] pt-4">
          {item.viewHref ? (
            <a
              href={item.viewHref}
              class="text-sm font-medium text-[color:var(--color-action)] hover:text-[color:var(--color-action-hover,#1d4ed8)]"
            >
              View saved option
            </a>
          ) : (
            <span class="text-sm text-[color:var(--color-text-muted)]">
              Canonical option link unavailable
            </span>
          )}

          <button
            type="button"
            disabled
            title={item.removeAction.description}
            class="cursor-not-allowed rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-text-muted)] opacity-70"
          >
            {item.removeAction.label}
          </button>
        </footer>
      </article>
    );
  },
);
