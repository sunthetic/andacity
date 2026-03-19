import { component$ } from "@builder.io/qwik";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

const getToneClasses = (tone: ItineraryPageModel["ownership"]["tone"]) => {
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

const getClaimNoticeToneClasses = (
  tone: NonNullable<ItineraryPageModel["ownership"]["claimNotice"]>["tone"],
) => {
  if (tone === "success") {
    return "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.92)]";
  }

  if (tone === "error") {
    return "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.92)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.92)]";
  }

  return "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.92)]";
};

export const ItineraryOwnershipNotice = component$(
  (props: {
    ownership: ItineraryPageModel["ownership"];
  }) => {
    const { ownership } = props;

    if (ownership.state === "owned" && !ownership.claimNotice) {
      return (
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-[color:var(--color-text-muted)]">
              Ownership verified for this itinerary.
            </p>
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {ownership.badgeLabel}
            </span>
          </div>
        </section>
      );
    }

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-sm)]",
          getToneClasses(ownership.tone),
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {ownership.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {ownership.message}
            </p>
            {ownership.hint ? (
              <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                {ownership.hint}
              </p>
            ) : null}
          </div>

          {ownership.showClaimAction ? (
            <form method="post">
              <input type="hidden" name="intent" value="claim-itinerary" />
              <button
                type="submit"
                class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                {ownership.claimActionLabel || "Claim itinerary"}
              </button>
            </form>
          ) : (
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {ownership.badgeLabel}
            </span>
          )}
        </div>

        {ownership.claimNotice ? (
          <div
            class={[
              "mt-4 rounded-lg border px-3 py-3 text-sm",
              getClaimNoticeToneClasses(ownership.claimNotice.tone),
            ]}
          >
            {ownership.claimNotice.message}
          </div>
        ) : null}
      </section>
    );
  },
);
