import { component$ } from "@builder.io/qwik";
import { SavedTravelerForm } from "~/components/travelers/SavedTravelerForm";
import { SavedTravelersEmptyState } from "~/components/travelers/SavedTravelersEmptyState";
import { SavedTravelersList } from "~/components/travelers/SavedTravelersList";
import type { SavedTravelersPageModel } from "~/fns/saved-travelers/getSavedTravelersPageModel";

export const SavedTravelersPageShell = component$(
  (props: {
    model: SavedTravelersPageModel;
    notice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const { model } = props;

    return (
      <div class="space-y-6">
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {model.header.eyebrow}
          </p>
          <div class="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-3xl font-semibold text-[color:var(--color-text-strong)]">
                {model.header.title}
              </h1>
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {model.header.helper}
              </p>
            </div>

            <div class="flex flex-wrap gap-2 text-xs text-[color:var(--color-text-muted)]">
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold">
                {model.header.countLabel}
              </span>
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold">
                {model.stats.archivedCountLabel}
              </span>
            </div>
          </div>
        </section>

        {props.notice ? (
          <section
            class={[
              "rounded-[var(--radius-xl)] border p-4 shadow-[var(--shadow-sm)]",
              props.notice.tone === "success"
                ? "border-[color:rgba(22,163,74,0.18)] bg-[color:rgba(240,253,244,0.96)]"
                : props.notice.tone === "error"
                  ? "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]"
                  : "border-[color:rgba(14,116,144,0.18)] bg-[color:rgba(240,249,255,0.96)]",
            ]}
          >
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.notice.message}
            </p>
          </section>
        ) : null}

        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Create a saved traveler
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Add a reusable profile manually or archive older records as your
                traveler directory changes.
              </p>
            </div>
            {model.stats.defaultTravelerLabel ? (
              <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                Default: {model.stats.defaultTravelerLabel}
              </span>
            ) : null}
          </div>

          <div class="mt-4">
            <SavedTravelerForm
              intent="create-saved-traveler"
              submitLabel="Create traveler"
            />
          </div>
        </section>

        {model.emptyState ? (
          <SavedTravelersEmptyState
            title={model.emptyState.title}
            message={model.emptyState.message}
          />
        ) : null}

        {model.profiles.length ? (
          <SavedTravelersList
            travelers={model.profiles}
            summaries={model.summaries}
          />
        ) : null}
      </div>
    );
  },
);
