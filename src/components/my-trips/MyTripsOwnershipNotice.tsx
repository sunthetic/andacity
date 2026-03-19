import { component$ } from "@builder.io/qwik";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

const getToneClasses = (tone: MyTripsPageModel["ownershipNotice"]["tone"]) => {
  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)]";
};

export const MyTripsOwnershipNotice = component$(
  (props: { notice: MyTripsPageModel["ownershipNotice"] }) => {
    const { notice } = props;

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          getToneClasses(notice.tone),
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {notice.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {notice.message}
            </p>
            {notice.hint ? (
              <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                {notice.hint}
              </p>
            ) : null}
          </div>

          <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {notice.badgeLabel}
          </span>
        </div>
      </section>
    );
  },
);
