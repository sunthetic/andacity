import { component$ } from "@builder.io/qwik";
import { ConfirmationHeader } from "~/components/confirmation/ConfirmationHeader";
import { ConfirmationItineraryNotice } from "~/components/confirmation/ConfirmationItineraryNotice";
import { ConfirmationItemList } from "~/components/confirmation/ConfirmationItemList";
import { ConfirmationNotificationNotice } from "~/components/confirmation/ConfirmationNotificationNotice";
import { ConfirmationReferenceBlock } from "~/components/confirmation/ConfirmationReferenceBlock";
import { ConfirmationStatusNotice } from "~/components/confirmation/ConfirmationStatusNotice";
import { ConfirmationSummaryCard } from "~/components/confirmation/ConfirmationSummaryCard";
import type { ConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";

export const ConfirmationPageShell = component$(
  (props: { model: ConfirmationPageModel }) => {
    const { model } = props;

    return (
      <div class="space-y-6">
        <ConfirmationHeader
          header={model.header}
          tripReference={model.tripReference}
        />

        <ConfirmationStatusNotice
          notice={model.statusNotice}
          recoveryState={model.statusRecovery}
        />
        <ConfirmationItineraryNotice
          notice={model.itineraryNotice}
          recoveryState={model.itineraryRecovery}
        />
        <ConfirmationNotificationNotice notice={model.notificationNotice} />

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div class="space-y-6">
            <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    Booked items
                  </p>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    Each item below reflects the normalized confirmation state
                    saved for this trip.
                  </p>
                </div>
                <a
                  href={model.tripHref}
                  class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
                >
                  View your trip
                </a>
              </div>

              <div class="mt-5">
                <ConfirmationItemList items={model.items} />
              </div>
            </section>

            <ConfirmationReferenceBlock groups={model.references} />

            <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {model.nextSteps.title}
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {model.nextSteps.description}
              </p>
              <div class="mt-5 flex flex-wrap gap-3">
                <a
                  href={model.nextSteps.primaryAction.href}
                  class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  {model.nextSteps.primaryAction.label}
                </a>
                <a
                  href={model.nextSteps.secondaryAction.href}
                  class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
                >
                  {model.nextSteps.secondaryAction.label}
                </a>
              </div>
            </section>
          </div>

          <div class="space-y-4">
            <ConfirmationSummaryCard
              summary={model.summary}
              tripReference={model.tripReference}
            />
          </div>
        </div>
      </div>
    );
  },
);
