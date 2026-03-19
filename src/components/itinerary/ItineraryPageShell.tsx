import { component$ } from "@builder.io/qwik";
import { ItineraryActionBar } from "~/components/itinerary/ItineraryActionBar";
import { ItineraryHeader } from "~/components/itinerary/ItineraryHeader";
import { ItineraryItemList } from "~/components/itinerary/ItineraryItemList";
import { ItineraryNotificationNotice } from "~/components/itinerary/ItineraryNotificationNotice";
import { ItineraryOwnershipNotice } from "~/components/itinerary/ItineraryOwnershipNotice";
import { ItineraryStatusNotice } from "~/components/itinerary/ItineraryStatusNotice";
import { ItinerarySummaryCard } from "~/components/itinerary/ItinerarySummaryCard";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

export const ItineraryPageShell = component$(
  (props: { model: ItineraryPageModel }) => {
    const { model } = props;

    return (
      <div class="space-y-6">
        <ItineraryHeader header={model.header} />

        <ItineraryOwnershipNotice ownership={model.ownership} />
        <ItineraryStatusNotice
          notice={model.statusNotice}
          recoveryState={model.recoveryState}
        />
        <ItineraryNotificationNotice notice={model.notificationNotice} />

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div class="space-y-6">
            <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    Booked items
                  </p>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    Persisted itinerary items with status and provider references.
                  </p>
                </div>
                <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                  {model.summary.itemCountLabel}
                </span>
              </div>

              <div class="mt-5">
                {model.previewOnly ? (
                  <p class="mb-3 rounded-lg border border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)] px-3 py-2 text-xs text-[color:var(--color-text-muted)]">
                    Preview mode: provider references are hidden until this
                    itinerary is claimed.
                  </p>
                ) : null}
                <ItineraryItemList
                  items={model.items}
                  previewOnly={model.previewOnly}
                />
              </div>
            </section>

            <ItineraryActionBar actions={model.actions} />
          </div>

          <div class="space-y-4">
            <ItinerarySummaryCard summary={model.summary} />
          </div>
        </div>
      </div>
    );
  },
);
