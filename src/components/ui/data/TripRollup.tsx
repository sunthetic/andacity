/**
 * CLAUDE-UI-051 — Trip roll-up bar (consumes `--ui-*`).
 *
 * Makes the four verticals read as one budget rather than four unrelated
 * purchases. The all-in total is the anchor; the per-vertical lines are
 * subordinate; taxes and fees are a *line*, never a footnote.
 *
 * Why fees are surfaced here rather than at checkout: "extra costs too
 * high" is the single most-cited cause of checkout abandonment in
 * published e-commerce research, and since 12 May 2025 the FTC's Rule on
 * Unfair or Deceptive Fees (16 CFR Part 464) has required short-term
 * lodging to display the total inclusive of mandatory fees *more
 * prominently than any other price*. Note the rule covers lodging only —
 * air, car and cruise are outside it — so on a multi-vertical trip the
 * stay line is regulated and the others are a voluntary standard we hold
 * ourselves to. Keep them consistent; a trip total that silently mixes
 * all-in and not-all-in components is worse than no total.
 */

export type RollupLine = {
  label: string;
  /** Preformatted currency string. */
  amount: string;
  /** Marks the line as not yet booked; rendered quiet + italic. */
  pending?: boolean;
};

type TripRollupProps = {
  lines: RollupLine[];
  total: string;
  perTraveler?: string;
  /** e.g. "-11%" — compared against the median for these dates. */
  vsMedian?: string;
  vsMedianFavorable?: boolean;
  /** e.g. "Booked 3 of 4". */
  progress?: string;
  class?: string;
};

export const TripRollup = (props: TripRollupProps) => (
  <section
    aria-label="Trip total"
    class={["w-full", props.class]}
    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
  >
    <div class="flex flex-wrap items-stretch gap-y-4 p-4">
      {/* Per-vertical lines */}
      <ul class="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-3" role="list">
        {props.lines.map((line) => (
          <li key={line.label} class="min-w-[5.5rem]">
            <div
              class="text-[10px] font-bold uppercase tracking-[0.09em]"
              style="color:var(--ui-text-muted)"
            >
              {line.label}
            </div>
            <div
              class={[
                "ui-num mt-0.5 text-sm",
                line.pending ? "italic" : "font-semibold",
              ]}
              style={`color:${line.pending ? "var(--ui-text-muted)" : "var(--ui-text)"}`}
            >
              {line.amount}
            </div>
          </li>
        ))}
      </ul>

      {/* Anchor */}
      <div
        class="flex shrink-0 flex-col items-end justify-center pl-6"
        style="border-left:1px solid var(--ui-border)"
      >
        <div
          class="text-[10px] font-bold uppercase tracking-[0.09em]"
          style="color:var(--ui-text-muted)"
        >
          Trip total &middot; all in
        </div>
        <div
          class="ui-num text-2xl leading-none font-extrabold"
          style="color:var(--ui-price)"
        >
          {props.total}
        </div>
        <div
          class="mt-1 flex items-center gap-2 text-[11px]"
          style="color:var(--ui-text-muted)"
        >
          {props.perTraveler ? (
            <span class="ui-num">{props.perTraveler} each</span>
          ) : null}
          {props.vsMedian ? (
            <span
              class="ui-num inline-flex items-center gap-1 font-semibold"
              style={`color:${props.vsMedianFavorable ? "var(--ui-trend-down)" : "var(--ui-trend-up)"}`}
            >
              <span aria-hidden="true">
                {props.vsMedianFavorable ? "↓" : "↑"}
              </span>
              <span aria-hidden="true">{props.vsMedian}</span>
              <span class="sr-only">
                {props.vsMedian} {props.vsMedianFavorable ? "below" : "above"}{" "}
                the median for these dates
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>

    {props.progress ? (
      <div
        class="px-4 py-2 text-[11px] font-medium"
        style="border-top:1px solid var(--ui-divider);color:var(--ui-text-muted)"
      >
        {props.progress}
      </div>
    ) : null}
  </section>
);
