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
        {/* Header block — black bar with lime accent */}
        <div
          class="border-2 border-[#0A0A08] bg-[#0A0A08]"
          style="box-shadow: 4px 4px 0 #0A0A08"
        >
          <div class="border-b-4 border-[#AAFF00] px-5 py-4">
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
            class="border-2 border-[#0A0A08] bg-white p-5"
            style="box-shadow: 3px 3px 0 #0A0A08; border-left: 4px solid #AAFF00"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-black uppercase tracking-tight text-[#050502]">
                  {model.accountTools.label}
                </p>
                <p class="mt-1 text-sm text-[#4A4A3E]">
                  {model.accountTools.description}
                </p>
              </div>
              <a
                href={model.accountTools.href}
                class="border-2 border-[#0A0A08] px-4 py-2 text-sm font-black uppercase tracking-wide text-[#050502] transition hover:bg-[#AAFF00]"
                style="box-shadow: 2px 2px 0 #0A0A08"
              >
                Open travelers →
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        {/* Main trips list — thick bordered container */}
        <section
          class="border-2 border-[#0A0A08] bg-white"
          style="box-shadow: 4px 4px 0 #0A0A08"
        >
          <div class="border-b-2 border-[#0A0A08] bg-[#F8F8F5] px-5 py-3">
            <span class="text-xs font-black uppercase tracking-widest text-[#050502]">
              Your Trips
            </span>
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
