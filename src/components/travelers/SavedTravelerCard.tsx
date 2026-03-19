import { component$ } from "@builder.io/qwik";
import { SavedTravelerForm } from "~/components/travelers/SavedTravelerForm";
import type {
  SavedTravelerProfile,
  SavedTravelerSummary,
} from "~/types/saved-travelers";

export const SavedTravelerCard = component$(
  (props: {
    traveler: SavedTravelerProfile;
    summary: SavedTravelerSummary;
  }) => {
    const { traveler, summary } = props;

    return (
      <details class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <summary class="cursor-pointer list-none">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                  {summary.displayName}
                </p>
                {summary.badgeLabel ? (
                  <span class="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    {summary.badgeLabel}
                  </span>
                ) : null}
              </div>
              {summary.label ? (
                <p class="mt-1 text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                  {summary.label}
                </p>
              ) : null}
              <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                {summary.detail}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              {!traveler.isDefault && traveler.status === "active" ? (
                <form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="set-default-saved-traveler"
                  />
                  <input
                    type="hidden"
                    name="savedTravelerId"
                    value={traveler.id}
                  />
                  <button
                    type="submit"
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-text-strong)] hover:text-[color:var(--color-text-strong)]"
                  >
                    Set default
                  </button>
                </form>
              ) : null}

              {traveler.status !== "archived" ? (
                <form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="archive-saved-traveler"
                  />
                  <input
                    type="hidden"
                    name="savedTravelerId"
                    value={traveler.id}
                  />
                  <button
                    type="submit"
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:#b91c1c] hover:text-[color:#b91c1c]"
                  >
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </summary>

        <div class="mt-5 space-y-4 border-t border-[color:var(--color-border-subtle)] pt-4">
          <div class="grid gap-3 text-sm text-[color:var(--color-text-muted)] md:grid-cols-2">
            <p>Email: {traveler.email || "Not set"}</p>
            <p>Phone: {traveler.phone || "Not set"}</p>
            <p>Date of birth: {traveler.dateOfBirth || "Not set"}</p>
            <p>Nationality: {traveler.nationality || "Not set"}</p>
            <p>Document: {traveler.documentType || "Not set"}</p>
            <p>Driver age: {traveler.driverAge ?? "Not set"}</p>
          </div>

          <SavedTravelerForm
            intent="update-saved-traveler"
            traveler={traveler}
            submitLabel="Update traveler"
          />
        </div>
      </details>
    );
  },
);
