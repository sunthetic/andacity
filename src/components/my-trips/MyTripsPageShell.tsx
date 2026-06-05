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
        {/* Header */}
        <div
          class="rounded-2xl p-6"
          style="background: linear-gradient(145deg, rgba(75,145,250,0.08), rgba(158,126,255,0.05)); border: 1px solid rgba(75,145,250,0.18); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"
        >
          <div
            class="absolute inset-x-0 top-0 h-px rounded-t-2xl"
            style="background: linear-gradient(90deg, transparent, rgba(75,145,250,0.5), rgba(158,126,255,0.4), transparent)"
            aria-hidden="true"
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
            class="rounded-2xl p-5"
            style="background: rgba(255,255,255,0.03); border: 1px solid rgba(90,120,190,0.16); box-shadow: 0 4px 16px rgba(0,0,0,0.25)"
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
                class="rounded-xl border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-action)] hover:border-[color:var(--color-action)] hover:bg-[rgba(75,145,250,0.08)] transition"
              >
                Open travelers
              </a>
            </div>
          </section>
        ) : null}

        <MyTripsStatusSummary summary={model.statusSummary} />

        <section
          class="rounded-2xl p-5"
          style="background: rgba(255,255,255,0.02); border: 1px solid rgba(90,120,190,0.14); box-shadow: 0 4px 20px rgba(0,0,0,0.3)"
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
