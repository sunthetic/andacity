/**
 * CLAUDE-UI-051 — Marks used inside dense data surfaces (consume `--ui-*`).
 *
 * Shared rule across everything in this file: **no mark carries meaning by
 * color alone.** Every one pairs its color with a glyph and a text label.
 * That is a hard accessibility requirement (WCAG 1.4.1) and it is also the
 * only thing that keeps `--ui-accent`, `--ui-success` and `--ui-danger`
 * legible to the ~8% of male users with a color-vision deficiency, for whom
 * the green/red pairing is the single worst case.
 */
import type { QRL } from "@builder.io/qwik";

/* ---------------------------------------------------------------- */
/* Cancellation policy                                              */
/* ---------------------------------------------------------------- */

export type CancellationPolicy =
  | { kind: "refundable"; until: string }
  | { kind: "nonrefundable" };

/**
 * Cancellation policy mark.
 *
 * Note on tone: "nonrefundable" is deliberately NOT rendered with
 * `--ui-danger`. It is a property of the fare, not an error state, and
 * spending the danger color on it both cries wolf and leaves nothing
 * distinct for real failures. Refundable earns a positive tone because it
 * is a genuine, and increasingly regulated, buyer protection; the negative
 * case is simply quiet.
 */
export const PolicyMark = (props: { policy: CancellationPolicy }) => {
  const refundable = props.policy.kind === "refundable";
  return (
    <span
      class="inline-flex items-center gap-1.5 text-[11px] leading-tight font-medium"
      style={`color:${refundable ? "var(--ui-success)" : "var(--ui-text-muted)"}`}
    >
      <span aria-hidden="true" class="text-[13px] leading-none">
        {refundable ? "↺" : "—"}
      </span>
      <span>
        {refundable
          ? `Free to ${(props.policy as { until: string }).until}`
          : "Nonrefundable"}
      </span>
    </span>
  );
};

/* ---------------------------------------------------------------- */
/* Price movement                                                   */
/* ---------------------------------------------------------------- */

export type TrendDirection = "up" | "down" | "flat";

type TrendProps = {
  direction: TrendDirection;
  /** Magnitude as a preformatted string, e.g. "8%". */
  magnitude: string;
  /** Window the movement is measured over, e.g. "30 days". */
  window: string;
};

/**
 * Price movement over a window.
 *
 * Direction semantics are buyer-relative, not market-relative: a price that
 * has fallen is good news, so `down` takes the positive token. That is the
 * opposite of a finance chart and is worth stating, because it will look
 * wrong to anyone who reads it as an equity ticker.
 */
export const TrendIndicator = (props: TrendProps) => {
  const map = {
    down: { glyph: "↓", color: "var(--ui-trend-down)", verb: "down" },
    up: { glyph: "↑", color: "var(--ui-trend-up)", verb: "up" },
    flat: { glyph: "→", color: "var(--ui-text-muted)", verb: "flat" },
  } as const;
  const t = map[props.direction];
  const label =
    props.direction === "flat"
      ? `Price flat over the last ${props.window}`
      : `Price ${t.verb} ${props.magnitude} over the last ${props.window}`;

  return (
    <span class="ui-num inline-flex items-center gap-1 text-[11px] font-semibold leading-tight">
      <span aria-hidden="true" style={`color:${t.color}`}>
        {t.glyph}
      </span>
      <span style={`color:${t.color}`} aria-hidden="true">
        {props.direction === "flat" ? "—" : props.magnitude}
      </span>
      <span class="sr-only">{label}</span>
    </span>
  );
};

/* ---------------------------------------------------------------- */
/* Pinning                                                          */
/* ---------------------------------------------------------------- */

type PinToggleProps = {
  pinned: boolean;
  /** Name of the row, used to build an unambiguous accessible label. */
  label: string;
  onToggle$?: QRL<() => void>;
};

/** Pin a row so it holds position while the rest of the table re-sorts. */
export const PinToggle = (props: PinToggleProps) => (
  <button
    type="button"
    aria-pressed={props.pinned}
    aria-label={
      props.pinned
        ? `Unpin ${props.label}`
        : `Pin ${props.label} for comparison`
    }
    onClick$={props.onToggle$}
    class={[
      "inline-flex h-7 w-7 items-center justify-center rounded transition",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
      "hover:brightness-95",
    ]}
    style={
      props.pinned
        ? "background:var(--ui-accent);color:var(--ui-on-primary);border:1px solid transparent"
        : "background:transparent;color:var(--ui-text-muted);border:1px solid var(--ui-border)"
    }
  >
    <span aria-hidden="true" class="text-[13px] leading-none">
      {"◆"}
    </span>
  </button>
);

/* ---------------------------------------------------------------- */
/* Rank                                                             */
/* ---------------------------------------------------------------- */

/**
 * Ordinal rank mark ("01", "02", …). Baseline removes the card as a unit,
 * so rows need something to establish reading order and left edge; a
 * numeral does that with no chrome.
 */
export const RankMark = (props: { rank: number }) => (
  <span
    class="ui-num text-[11px] font-bold tabular-nums"
    style="color:var(--ui-text-muted)"
    aria-hidden="true"
  >
    {String(props.rank).padStart(2, "0")}
  </span>
);
