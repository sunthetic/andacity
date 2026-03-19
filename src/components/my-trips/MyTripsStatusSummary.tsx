import { component$ } from "@builder.io/qwik";
import type { MyTripsPageModel } from "~/fns/my-trips/getMyTripsPageModel";

const getToneClasses = (
  tone: NonNullable<MyTripsPageModel["statusSummary"]>["items"][number]["tone"],
) => {
  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]";
  }

  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.96)]";
};

export const MyTripsStatusSummary = component$(
  (props: { summary: MyTripsPageModel["statusSummary"] }) => {
    const { summary } = props;
    if (!summary) return null;

    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {summary.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {summary.description}
            </p>
          </div>

          {summary.ctaHref && summary.ctaLabel ? (
            <a
              href={summary.ctaHref}
              class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              {summary.ctaLabel}
            </a>
          ) : null}
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          {summary.items.map((item) => (
            <span
              key={item.label}
              class={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-strong)]",
                getToneClasses(item.tone),
              ]}
            >
              {item.label}
            </span>
          ))}
        </div>
      </section>
    );
  },
);
