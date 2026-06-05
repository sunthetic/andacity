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
      <div style="background: var(--color-bg); min-height: calc(100vh - var(--app-header-height))">

        {/* ATLAS TERRA banner — editorial split dark header */}
        <div
          class="relative overflow-hidden"
          style="background: linear-gradient(130deg, #080300 0%, #120700 40%, #1C0E04 100%)"
        >
          {/* Terracotta glow */}
          <div
            class="pointer-events-none absolute inset-0"
            style="background: radial-gradient(48% 44% at 5% 0%, rgba(196,97,74,0.20) 0%, transparent 62%), radial-gradient(26% 34% at 90% 100%, rgba(212,151,58,0.10) 0%, transparent 58%)"
          />

          <div class="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
            {/* Stamp badge */}
            <div class="mb-3 inline-flex items-center gap-2">
              <span
                class="rounded px-2.5 py-1 text-xs font-bold uppercase tracking-widest"
                style="border: 1.5px solid rgba(212,151,58,0.40); color: #D4973A; background: rgba(212,151,58,0.08); letter-spacing: 0.10em"
              >
                My Trips
              </span>
            </div>

            <h1
              class="text-3xl font-bold md:text-4xl"
              style="color: #FBF4EA; letter-spacing: -0.025em; line-height: 1.12"
            >
              Your journeys
            </h1>
            <p class="mt-2 text-sm" style="color: rgba(239,230,214,0.58); line-height: 1.65">
              All planned trips and bookings in one place.
            </p>
          </div>

          {/* Terracotta editorial underline */}
          <div style="height: 2px; background: linear-gradient(90deg, rgba(196,97,74,0.80) 0%, rgba(212,151,58,0.50) 40%, transparent 100%)" />
        </div>

        {/* Body */}
        <div class="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <MyTripsHeader header={model.header} />
          <MyTripsOwnershipNotice notice={model.ownershipNotice} />

          {model.resumeBanner ? (
            <div class="mt-6">
              <ResumeBanner
                href={model.resumeBanner.href}
                title={model.resumeBanner.title}
                description={model.resumeBanner.description}
                ctaLabel={model.resumeBanner.ctaLabel}
                refLabel={model.resumeBanner.refLabel}
              />
            </div>
          ) : null}

          {model.accountTools ? (
            <div
              class="mt-6 overflow-hidden rounded-2xl"
              style="border: 1px solid rgba(196,97,74,0.14); border-left: 3px solid #D4973A; background: rgba(255,255,255,0.04)"
            >
              <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p class="text-sm font-semibold" style="color: #FBF4EA">
                    {model.accountTools.label}
                  </p>
                  <p class="mt-1 text-sm" style="color: rgba(239,230,214,0.58)">
                    {model.accountTools.description}
                  </p>
                </div>
                <a
                  href={model.accountTools.href}
                  class="t-btn-ghost px-4 py-2 text-sm"
                >
                  Open travelers
                </a>
              </div>
            </div>
          ) : null}

          <div class="mt-6">
            <MyTripsStatusSummary summary={model.statusSummary} />
          </div>

          <div
            class="mt-6 overflow-hidden rounded-2xl"
            style="border: 1px solid rgba(196,97,74,0.14); background: rgba(255,255,255,0.04)"
          >
            <div class="border-b px-5 py-3" style="border-color: rgba(196,97,74,0.10)">
              <MyTripsFilterBar filterBar={model.filterBar} />
            </div>

            <div class="p-5">
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
          </div>
        </div>
      </div>
    );
  },
);
