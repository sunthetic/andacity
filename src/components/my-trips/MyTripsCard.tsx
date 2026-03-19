import { component$ } from "@builder.io/qwik";
import type { MyTripsCardModel } from "~/fns/my-trips/getMyTripsPageModel";

const getToneClasses = (tone: MyTripsCardModel["statusTone"]) => {
  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)] text-[color:rgb(21,128,61)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)] text-[color:rgb(180,83,9)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)] text-[color:rgb(185,28,28)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)] text-[color:rgb(29,78,216)]";
};

const getBadgeToneClasses = (
  tone: MyTripsCardModel["badges"][number]["tone"],
) => {
  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] text-[color:rgb(21,128,61)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] text-[color:rgb(180,83,9)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] text-[color:rgb(185,28,28)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] text-[color:rgb(29,78,216)]";
};

export const MyTripsCard = component$((props: { trip: MyTripsCardModel }) => {
  const { trip } = props;

  return (
    <article class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-3">
          <div>
            <div class="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono font-semibold">
                {trip.itineraryRefLabel}
              </span>
              {trip.ownershipLabel ? (
                <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-semibold uppercase tracking-[0.08em]">
                  {trip.ownershipLabel}
                </span>
              ) : null}
            </div>

            <h3 class="mt-3 text-xl font-semibold text-[color:var(--color-text-strong)]">
              {trip.title}
            </h3>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {trip.description}
            </p>
          </div>

          <div class="flex flex-wrap gap-2 text-xs text-[color:var(--color-text-muted)]">
            {trip.dateRangeLabel ? (
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                {trip.dateRangeLabel}
              </span>
            ) : null}
            {trip.locationLabel ? (
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                {trip.locationLabel}
              </span>
            ) : null}
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
              {trip.itemCountLabel}
            </span>
            {trip.totalPaidLabel ? (
              <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1">
                {trip.totalPaidLabel}
              </span>
            ) : null}
          </div>

          {trip.badges.length ? (
            <div class="flex flex-wrap gap-2">
              {trip.badges.map((badge) => (
                <span
                  key={badge.label}
                  class={[
                    "rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
                    getBadgeToneClasses(badge.tone),
                  ]}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div class="flex flex-col items-start gap-3">
          <span
            class={[
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]",
              getToneClasses(trip.statusTone),
            ]}
          >
            {trip.statusLabel}
          </span>

          <a
            href={trip.href}
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {trip.ctaLabel}
          </a>
        </div>
      </div>
    </article>
  );
});
