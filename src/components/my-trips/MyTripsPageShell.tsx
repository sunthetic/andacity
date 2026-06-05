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
      <div class="space-y-5">
        {/* Header — editorial treatment */}
        <div
          class="rounded-xl p-6 md:p-8"
          style="background: linear-gradient(145deg, #F7F1E8, #EDE0CC); border: 1px solid rgba(122,88,67,0.20); border-top: 3px solid #C4614A; box-shadow: var(--shadow-md)"
        >
          <div
            class="mb-4 h-0.5 w-10"
            style="background: linear-gradient(90deg, #C4614A, #D4973A)"
          />
          <MyTripsHeader header={model.header} />
        </div>

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
          <section
            class="rounded-xl p-5"
            style="background: var(--color-surface); border: 1px solid var(--color-border); border-left: 3px solid #D4973A; box-shadow: var(--shadow-sm)"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-[color:var(--color-text-strong)]">
                  {model.accountTools.label}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.accountTools.description}
                </p>
              </div>
              <a
                href={model.accountTools.href}
                class="rounded-lg border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-strong)] transition hover:border-[color:var(--color-action)] hover:text-[color:var(--color-action)]"
              >
                Open travelers
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        <section
          class="rounded-xl p-5"
          style="background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm)"
        >
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
