import { Slot, component$ } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryFreshness } from "~/components/inventory/InventoryFreshness";
import type {
  AvailabilityConfidenceModel,
  AvailabilityConfidenceState,
} from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";

export const DetailTrustPanel = component$((props: DetailTrustPanelProps) => {
  const compact = props.compact === true;
  const rows = (props.rows || []).filter(
    (row) =>
      String(row.value || "").trim().length > 0 ||
      String(row.detail || "").trim().length > 0,
  );
  const toneClass = trustPanelToneClass(props.confidence, props.freshness);
  const attention = buildAttentionMessage(props.confidence);
  const surfaceClass = compact ? "rounded-xl" : "rounded-[var(--radius-xl)]";

  return (
    <section
      class={[
        surfaceClass,
        "border px-4 py-4",
        compact ? "space-y-3" : "space-y-4",
        toneClass,
      ]}
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            {props.eyebrow || "Trust panel"}
          </p>
          <h2 class="mt-1 text-sm font-semibold text-[color:var(--color-text-strong)]">
            {props.title || "Before you book"}
          </h2>
        </div>

        <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Slot name="actions" />
        </div>
      </div>

      {attention ? (
        <div class={["rounded-xl border px-3 py-3", attention.className]}>
          <p class="text-xs font-semibold text-[color:var(--color-text-strong)]">
            {attention.title}
          </p>
          <p class="mt-1 text-xs leading-5 text-[color:var(--color-text)]">
            {attention.message}
          </p>
        </div>
      ) : null}

      <div class={["grid gap-3", compact ? undefined : "md:grid-cols-2"]}>
        {props.freshness ? (
          <div class="rounded-xl border border-[color:var(--color-divider)] bg-white/70 px-3 py-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Freshness
            </p>
            <div class="mt-2">
              <InventoryFreshness
                freshness={props.freshness}
                compact={compact}
                showDetail={true}
              />
            </div>
          </div>
        ) : null}

        {props.confidence ? (
          <div class="rounded-xl border border-[color:var(--color-divider)] bg-white/70 px-3 py-3">
            <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Availability
            </p>
            <div class="mt-2">
              <AvailabilityConfidence
                confidence={props.confidence}
                compact={compact}
                showSupport={true}
                showDetail={true}
              />
            </div>
          </div>
        ) : null}
      </div>

      {rows.length ? (
        <dl class="grid gap-2">
          {rows.map((row) => (
            <div
              key={`${row.label}:${row.value}:${row.detail || ""}`}
              class="rounded-xl border border-[color:var(--color-divider)] bg-white/70 px-3 py-3"
            >
              <dt class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                {row.label}
              </dt>
              {row.value ? (
                <dd
                  class={[
                    "mt-1 text-sm leading-5",
                    trustRowValueClass(row.tone, row.emphasized),
                  ]}
                >
                  {row.value}
                </dd>
              ) : null}
              {row.detail ? (
                <dd class="mt-1 text-xs leading-5 text-[color:var(--color-text-muted)]">
                  {row.detail}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}

      {props.note ? (
        <p class="text-xs leading-5 text-[color:var(--color-text-muted)]">
          {props.note}
        </p>
      ) : null}
    </section>
  );
});

const trustPanelToneClass = (
  confidence?: AvailabilityConfidenceModel | null,
  freshness?: InventoryFreshnessModel | null,
) => {
  if (confidence?.state === "unavailable") {
    return "border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.03)]";
  }

  if (
    confidence?.state === "revalidation_failed" ||
    confidence?.state === "stale_unknown"
  ) {
    return "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.05)]";
  }

  if (
    confidence?.state === "partial_availability" ||
    freshness?.state === "aging"
  ) {
    return "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.04)]";
  }

  return "border-[color:var(--color-border)] bg-[color:var(--color-surface)]";
};

const buildAttentionMessage = (
  confidence?: AvailabilityConfidenceModel | null,
) => {
  if (!confidence?.degraded) return null;

  const title = attentionTitleForState(confidence.state);
  const message =
    confidence.supportText ||
    confidence.detailLabel ||
    "Review this inventory before booking.";
  const className =
    confidence.state === "unavailable"
      ? "border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.07)]"
      : "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)]";

  return {
    title,
    message,
    className,
  };
};

const attentionTitleForState = (state: AvailabilityConfidenceState) => {
  if (state === "unavailable") return "Current selection no longer fits";
  if (state === "revalidation_failed") return "Live check failed";
  if (state === "stale_unknown") return "Availability needs recheck";
  if (state === "partial_availability")
    return "Only a partial match is confirmed";
  return "Review before booking";
};

const trustRowValueClass = (
  tone?: DetailTrustPanelRowTone,
  emphasized?: boolean,
) => {
  if (tone === "critical") {
    return "font-semibold text-[color:var(--color-error,#b91c1c)]";
  }

  if (tone === "warning") {
    return "font-semibold text-[color:var(--color-warning,#92400e)]";
  }

  if (tone === "positive") {
    return "font-semibold text-[color:var(--color-success,#0f766e)]";
  }

  if (emphasized !== false) {
    return "font-semibold text-[color:var(--color-text-strong)]";
  }

  return "text-[color:var(--color-text)]";
};

export type DetailTrustPanelRowTone =
  | "default"
  | "positive"
  | "warning"
  | "critical";

export type DetailTrustPanelRow = {
  label: string;
  value: string;
  detail?: string | null;
  tone?: DetailTrustPanelRowTone;
  emphasized?: boolean;
};

type DetailTrustPanelProps = {
  title?: string;
  eyebrow?: string;
  compact?: boolean;
  freshness?: InventoryFreshnessModel | null;
  confidence?: AvailabilityConfidenceModel | null;
  rows?: DetailTrustPanelRow[];
  note?: string | null;
};
