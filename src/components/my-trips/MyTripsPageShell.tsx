import { component$ } from "@builder.io/qwik";
import { MyTripsEmptyState } from "~/components/my-trips/MyTripsEmptyState";
import { MyTripsFilterBar } from "~/components/my-trips/MyTripsFilterBar";
import { MyTripsGroup } from "~/components/my-trips/MyTripsGroup";
import { MyTripsHeader } from "~/components/my-trips/MyTripsHeader";
import { MyTripsOwnershipNotice } from "~/components/my-trips/MyTripsOwnershipNotice";
import { MyTripsStatusSummary } from "~/components/my-trips/MyTripsStatusSummary";
import { ResumeBanner } from "~/components/retrieval/ResumeBanner";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsPageShell = component$(
  (props: { model: MyTripsPageModel }) => {
    const { model } = props;

    return (
      <div class="space-y-6">
        <MyTripsHeader header={model.header} />
        <MyTripsOwnershipNotice notice={model.ownershipNotice} />

        {model.resumeBanner ? (
          <ResumeBanner
            href={model.resumeBanner.href}
            title={model.resumeBanner.title}
            description={model.resumeBanner.description}
            ctaLabel={model.resumeBanner.ctaLabel}
            refLabel={model.resumeBanner.refLabel}
          />
        ) : null}

        {model.accountTools ? (
          <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {model.accountTools.label}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.accountTools.description}
                </p>
              </div>
              <a
                href={model.accountTools.href}
                class="rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
              >
                Open travelers
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <MyTripsFilterBar filterBar={model.filterBar} />

          <div class="mt-6">
            {model.isEmpty && model.emptyState ? (
              <MyTripsEmptyState emptyState={model.emptyState} />
            ) : (
              <div class="space-y-8">
                {model.groups.map((group) => (
                  <MyTripsGroup key={group.key} group={group} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  },
);
