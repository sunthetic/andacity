import { component$ } from "@builder.io/qwik";
import type { CheckoutSavedTravelerSuggestion } from "~/types/saved-travelers";

export const SavedTravelerPicker = component$(
  (props: {
    suggestions: CheckoutSavedTravelerSuggestion[];
    manageHref?: string | null;
  }) => {
    if (!props.suggestions.length) {
      return (
        <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
          <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            No saved travelers yet
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Save a checkout traveler to your account once and reuse it on future
            bookings.
          </p>
          {props.manageHref ? (
            <a
              href={props.manageHref}
              class="mt-3 inline-flex rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Open saved travelers
            </a>
          ) : null}
        </div>
      );
    }

    return (
      <div class="space-y-3">
        {props.suggestions.map((suggestion, index) => (
          <article
            key={suggestion.profile.id}
            class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {suggestion.summary.displayName}
                  </p>
                  {index === 0 ? (
                    <span class="rounded-full bg-[color:rgba(14,116,144,0.10)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:#0f766e]">
                      Recommended
                    </span>
                  ) : null}
                  {suggestion.summary.badgeLabel ? (
                    <span class="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                      {suggestion.summary.badgeLabel}
                    </span>
                  ) : null}
                </div>
                {suggestion.summary.label ? (
                  <p class="mt-1 text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    {suggestion.summary.label}
                  </p>
                ) : null}
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {suggestion.summary.detail}
                </p>
                {suggestion.reasons.length ? (
                  <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    {suggestion.reasons.join(" · ")}
                  </p>
                ) : null}
              </div>

              <form method="post">
                <input
                  type="hidden"
                  name="intent"
                  value="import-saved-traveler-into-checkout"
                />
                <input
                  type="hidden"
                  name="savedTravelerId"
                  value={suggestion.profile.id}
                />
                <button
                  type="submit"
                  class="rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Import into checkout
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    );
  },
);
