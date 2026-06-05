import { component$ } from "@builder.io/qwik";
import { MyTripsEmptyState } from "~/components/my-trips/MyTripsEmptyState";
import { MyTripsFilterBar } from "~/components/my-trips/MyTripsFilterBar";
import { MyTripsGroup } from "~/components/my-trips/MyTripsGroup";
import { MyTripsHeader } from "~/components/my-trips/MyTripsHeader";
import { useMyTripsData } from "~/routes/trips/trips.data";

export const MyTripsPageShell = component$(() => {
  const data = useMyTripsData();

  return (
    <div style="background: var(--color-bg); min-height: calc(100vh - var(--app-header-height))">

      {/* Velvet Dusk banner — dark warm gradient with gold underline accent */}
      <div
        class="relative overflow-hidden"
        style="background: linear-gradient(145deg, #0C0116 0%, #1C0A2E 45%, #2D1040 100%)"
      >
        {/* Rose glow */}
        <div
          class="pointer-events-none absolute inset-0"
          style="background: radial-gradient(52% 48% at 80% 0%, rgba(200,56,96,0.22) 0%, transparent 65%), radial-gradient(30% 40% at 10% 100%, rgba(245,200,66,0.10) 0%, transparent 60%)"
        />

        <div class="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div
            class="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style="border: 1px solid rgba(245,200,66,0.28); background: rgba(245,200,66,0.08)"
          >
            <span class="h-1 w-1 rounded-full" style="background: #F5C842" />
            <span class="text-xs font-semibold tracking-wide" style="color: #F5C842">My Trips</span>
          </div>

          <h1
            class="text-3xl font-bold md:text-4xl"
            style="color: #FFF8F0; letter-spacing: -0.025em; line-height: 1.12"
          >
            Your journeys
          </h1>
          <p class="mt-2 text-sm" style="color: rgba(240,232,216,0.60); line-height: 1.6">
            All your planned trips and bookings in one place.
          </p>
        </div>

        {/* Gold accent underline */}
        <div style="height: 2px; background: linear-gradient(90deg, rgba(245,200,66,0.80) 0%, rgba(232,114,138,0.50) 45%, transparent 100%)" />
      </div>

      {/* Body */}
      <div class="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div class="grid gap-8 lg:grid-cols-[1fr_280px]">

          {/* Trips column */}
          <div>
            {/* Filter bar */}
            <div class="mb-6">
              <MyTripsFilterBar />
            </div>

            {/* Trips list */}
            {data.value?.groups?.length ? (
              <div class="space-y-6">
                {data.value.groups.map((group) => (
                  <div key={group.label} class="overflow-hidden rounded-2xl" style="border: 1px solid rgba(200,160,255,0.14)">
                    {/* Group label */}
                    <div
                      class="flex items-center gap-2 border-b px-5 py-3"
                      style="border-color: rgba(200,160,255,0.12); background: rgba(255,255,255,0.04)"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" style="background: #E8728A" />
                      <span class="text-xs font-semibold uppercase tracking-wide" style="color: rgba(240,232,216,0.55)">
                        {group.label}
                      </span>
                    </div>
                    <MyTripsGroup group={group} />
                  </div>
                ))}
              </div>
            ) : (
              <div class="overflow-hidden rounded-2xl" style="border: 1px solid rgba(200,160,255,0.14); background: rgba(255,255,255,0.04)">
                <MyTripsEmptyState />
              </div>
            )}
          </div>

          {/* Sidebar — account tools */}
          <aside class="space-y-4">

            {/* Account card */}
            <div
              class="overflow-hidden rounded-2xl"
              style="border: 1px solid rgba(200,160,255,0.14); background: rgba(255,255,255,0.05)"
            >
              <div
                class="border-b px-4 py-3"
                style="border-color: rgba(200,160,255,0.10); border-left: 3px solid #F5C842; padding-left: 14px"
              >
                <span class="text-xs font-semibold uppercase tracking-wide" style="color: #F5C842">Account</span>
              </div>
              <div class="grid divide-y p-1" style="divide-color: rgba(200,160,255,0.08)">
                {[
                  { label: "Profile", href: "/account/profile", color: "#E8728A" },
                  { label: "Preferences", href: "/account/preferences", color: "#9080FF" },
                  { label: "Notifications", href: "/account/notifications", color: "#F5C842" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-white/06"
                    style="color: rgba(240,232,216,0.80)"
                  >
                    <span>{item.label}</span>
                    <span style={`color: ${item.color}`}>→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick search card */}
            <div
              class="overflow-hidden rounded-2xl"
              style="border: 1px solid rgba(200,160,255,0.14); background: rgba(255,255,255,0.05)"
            >
              <div
                class="border-b px-4 py-3"
                style="border-color: rgba(200,160,255,0.10); border-left: 3px solid #E8728A; padding-left: 14px"
              >
                <span class="text-xs font-semibold uppercase tracking-wide" style="color: #E8728A">Plan a trip</span>
              </div>
              <div class="grid gap-2 p-3">
                {[
                  { label: "Search flights", href: "/flights" },
                  { label: "Search hotels", href: "/hotels" },
                  { label: "Rent a car", href: "/car-rentals" },
                  { label: "Explore destinations", href: "/destinations" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    class="t-btn-ghost w-full px-3 py-2 text-center text-sm"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Header widget */}
            <MyTripsHeader />
          </aside>
        </div>
      </div>
    </div>
  );
});
