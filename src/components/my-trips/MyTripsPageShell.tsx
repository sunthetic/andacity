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
      <div class="space-y-4">
        {/* Header — navy bar */}
        <div class="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.12)] bg-[#0F2D4A]">
          <div class="border-b-2 border-[#F59E0B] px-5 py-4">
            <MyTripsHeader header={model.header} />
          </div>
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
            class="rounded-xl border border-[rgba(15,23,42,0.10)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            style="border-left: 3px solid #F59E0B"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[#0F172A]">{model.accountTools.label}</p>
                <p class="mt-0.5 text-sm text-[#475569]">{model.accountTools.description}</p>
              </div>
              <a href={model.accountTools.href} class="t-btn-ghost px-3 py-1.5 text-sm">
                Open travelers
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        <section class="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.10)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div class="border-b border-[rgba(15,23,42,0.10)] bg-[#F1F5F9] px-5 py-3">
            <div class="flex items-center gap-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-[#475569]">Your Trips</span>
            </div>
          </div>
          <div class="p-5">
            <MyTripsFilterBar filterBar={model.filterBar} />
            <div class="mt-5">
              {model.isEmpty && model.emptyState ? (
                <MyTripsEmptyState emptyState={model.emptyState} />
              ) : (
                <div class="space-y-5">
                  {model.groups.map((group) => (
                    <MyTripsGroup key={group.key} group={group} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  },
);
