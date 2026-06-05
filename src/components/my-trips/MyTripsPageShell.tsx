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
        {/* Header — teal gradient banner */}
        <div
          class="overflow-hidden rounded-3xl"
          style="background: linear-gradient(145deg, #0A2A26, #047A6E); box-shadow: 0 8px 32px rgba(4,122,110,0.20)"
        >
          <div class="px-6 py-6">
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
            class="rounded-3xl bg-white p-5 shadow-[0_4px_20px_rgba(27,45,66,0.08)] border border-[rgba(27,45,66,0.08)]"
            style="border-left: 4px solid #F97B5C"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-[#0E1E2E]">{model.accountTools.label}</p>
                <p class="mt-1 text-sm text-[#4A6272]">{model.accountTools.description}</p>
              </div>
              <a
                href={model.accountTools.href}
                class="t-btn-ghost px-4 py-2 text-sm"
              >
                Open travelers
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        {/* Main content */}
        <section
          class="rounded-3xl bg-white shadow-[0_4px_20px_rgba(27,45,66,0.08)] border border-[rgba(27,45,66,0.08)] overflow-hidden"
        >
          <div class="border-b border-[rgba(27,45,66,0.08)] bg-[#F0FAFA] px-5 py-3.5">
            <span class="text-sm font-semibold text-[#047A6E]">Your Trips</span>
          </div>
          <div class="p-5">
            <MyTripsFilterBar filterBar={model.filterBar} />
            <div class="mt-6">
              {model.isEmpty && model.emptyState ? (
                <MyTripsEmptyState emptyState={model.emptyState} />
              ) : (
                <div class="space-y-6">
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
