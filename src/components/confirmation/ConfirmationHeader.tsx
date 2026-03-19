import { component$ } from "@builder.io/qwik";
import type { ConfirmationPageModel } from "~/lib/confirmation/getConfirmationPageModel";

const getToneClasses = (
  tone: ConfirmationPageModel["header"]["statusTone"],
) => {
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

export const ConfirmationHeader = component$(
  (props: {
    header: ConfirmationPageModel["header"];
    tripReference: string;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Booking confirmation
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
              {props.header.title}
            </h1>
            <p class="mt-2 max-w-3xl text-sm text-[color:var(--color-text-muted)]">
              {props.header.message}
            </p>

            <div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span
                class={[
                  "rounded-full border px-3 py-1 font-medium",
                  getToneClasses(props.header.statusTone),
                ]}
              >
                {props.header.statusLabel}
              </span>
              <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-[color:var(--color-text-muted)]">
                {props.header.supportLabel}
              </span>
              <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-[color:var(--color-text-muted)]">
                {props.tripReference}
              </span>
            </div>
          </div>

          <div class="min-w-[220px] rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] px-4 py-3">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              Confirmation reference
            </p>
            <p class="mt-2 font-mono text-lg font-semibold tracking-[0.08em] text-[color:var(--color-text-strong)]">
              {props.header.confirmationRef}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Saved under this public-safe reference.
            </p>
          </div>
        </div>
      </section>
    );
  },
);
