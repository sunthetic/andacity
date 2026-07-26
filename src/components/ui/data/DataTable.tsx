/**
 * CLAUDE-UI-051 — DataTable primitives (consume `--ui-*`).
 *
 * The first real table elements in the codebase. Every result surface to
 * date has been card-based (`ResultCard`), which is the right shape when
 * options differ qualitatively. It is the wrong shape when the user's
 * question is "which of these is cheapest all-in, and what am I giving up"
 * — that question needs aligned columns so values can be scanned down.
 *
 * Semantics deliberately use native <table>/<thead>/<th>/<td> rather than
 * a div grid with ARIA roles. Screen readers get row/column association,
 * header scope and caption support for free, none of it hand-maintained.
 *
 * ---------------------------------------------------------------------
 * TWO STRUCTURAL CONSTRAINTS. BOTH ARE LOAD-BEARING. DO NOT "TIDY" THEM.
 * ---------------------------------------------------------------------
 * Interactive content inside a Qwik table is a minefield, and the failure
 * mode is nasty: the table renders perfectly server-side and is simply
 * dead on the client. Both symptoms below present as
 *
 *     QWIK ERROR  Cannot set properties of undefined (setting '__virtual')
 *         at new VirtualElementImpl
 *
 * thrown on click, with the handler never running.
 *
 * 1. `<thead>` and `<tbody>` are rendered LITERALLY by DataTable — the
 *    header comes in as a `head` prop rather than as children.
 *
 *    Root cause: Qwik marks every dynamic boundary with `<!--qv-->` /
 *    `<!--/qv-->` comment pairs, and `VirtualElementImpl` resolves a
 *    boundary by finding its closing comment. Passing an array or a
 *    dynamic child directly to `<table>` puts those markers in the
 *    parser's "in table" insertion mode, where they are foster-parented
 *    out of the table — the close marker moves, lookup returns undefined,
 *    and the constructor dies on `close[VIRTUAL_SYMBOL] = this`. Markers
 *    inside `<tbody>` are fine; markers directly inside `<table>` are not.
 *    So the dynamic row list must live in a literal `<tbody>`, and nothing
 *    dynamic may sit at `<table>` level.
 *
 * 2. Every export here is a plain function, not `component$`. Component
 *    boundaries per row and per cell multiply the marker pairs inside the
 *    table for no benefit; inline components emit none. Qwik recommends
 *    inline components for lightweight structural pieces anyway.
 *
 *    Consequence to respect: inline components cannot use hooks or
 *    <Slot/>. Content arrives via `props.children`; state stays in the
 *    caller.
 *
 * Verified: pin/unpin re-sorts correctly with zero console errors. If you
 * refactor either constraint away, re-test an actual click — SSR output
 * will look identical whether or not it is broken.
 *
 * Anatomy:
 *   DataTable(head=<tr><DataHeadCell/>…</tr>)
 *     > DataRow > DataRowHeader | DataCell | DataNumericCell
 *
 * Density: `compact` swaps the shared --ui-row-h for --ui-row-h-compact.
 * Row rhythm is the whole density mechanism; there is no other knob.
 */
import type { JSXChildren } from "@builder.io/qwik";

export type DataAlign = "start" | "end";

type WithChildren = { children?: JSXChildren };

type DataTableProps = WithChildren & {
  /** Required. Visually hidden unless `showCaption`; screen readers announce it. */
  caption: string;
  showCaption?: boolean;
  compact?: boolean;
  class?: string;
  /** Header row(s). Rendered into a literal <thead> — see note below. */
  head: JSXChildren;
};

export const DataTable = (props: DataTableProps) => (
  <div
    class={["w-full overflow-x-auto", props.class]}
    style="border:1px solid var(--ui-border);border-radius:var(--ui-radius);background:var(--ui-surface)"
  >
    <table
      class="w-full border-collapse text-left"
      style={`--row-h:${props.compact ? "var(--ui-row-h-compact)" : "var(--ui-row-h)"}`}
    >
      <caption
        class={
          props.showCaption
            ? "px-4 pt-3 pb-2 text-left text-[11px] font-semibold uppercase tracking-[0.09em]"
            : "sr-only"
        }
        style="color:var(--ui-text-muted)"
      >
        {props.caption}
      </caption>
      <thead style="border-bottom:1px solid var(--ui-border)">
        {props.head}
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  </div>
);

type DataHeadCellProps = WithChildren & {
  align?: DataAlign;
  width?: string;
  class?: string;
};

export const DataHeadCell = (props: DataHeadCellProps) => (
  <th
    scope="col"
    class={[
      "px-3 py-2.5 align-bottom text-[10px] font-bold tracking-[0.09em] whitespace-nowrap uppercase",
      props.align === "end" ? "text-right" : "text-left",
      props.class,
    ]}
    style={`color:var(--ui-text-muted)${props.width ? `;width:${props.width}` : ""}`}
  >
    {props.children}
  </th>
);

type DataRowProps = WithChildren & {
  /** Pinned rows hold position and take a signal-colored leading rule. */
  pinned?: boolean;
  class?: string;
};

export const DataRow = (props: DataRowProps) => (
  <tr
    class={["transition-colors", props.class]}
    style={[
      "border-top:1px solid var(--ui-rule)",
      props.pinned
        ? "background:var(--ui-accent-soft);box-shadow:inset 2px 0 0 0 var(--ui-accent)"
        : "",
    ]
      .filter(Boolean)
      .join(";")}
  >
    {props.children}
  </tr>
);

/** The identity cell. One per row, scoped as a row header for assistive tech. */
export const DataRowHeader = (props: WithChildren & { class?: string }) => (
  <th
    scope="row"
    class={["px-3 text-left font-normal", props.class]}
    style="height:var(--row-h);color:var(--ui-text)"
  >
    {props.children}
  </th>
);

type DataCellProps = WithChildren & {
  align?: DataAlign;
  class?: string;
};

export const DataCell = (props: DataCellProps) => (
  <td
    class={[
      "px-3",
      props.align === "end" ? "text-right" : "text-left",
      props.class,
    ]}
    style="height:var(--row-h);color:var(--ui-text-secondary)"
  >
    {props.children}
  </td>
);

type DataNumericCellProps = {
  /** The formatted value. Pass pre-formatted strings; this does no i18n. */
  value: string;
  /** Quiet line beneath the value (e.g. "4 nights"). */
  note?: string;
  /** Emphasized numbers use --ui-price and a heavier weight. */
  emphasis?: boolean;
  class?: string;
};

/**
 * Numeric cell. Always right-aligned and always tabular — a comparison
 * column whose digits do not align vertically cannot actually be compared,
 * and Poppins ships proportional figures by default.
 */
export const DataNumericCell = (props: DataNumericCellProps) => (
  <td
    class={["ui-num px-3 text-right whitespace-nowrap", props.class]}
    style="height:var(--row-h)"
  >
    <div
      class={
        props.emphasis
          ? "text-base leading-tight font-bold"
          : "text-sm leading-tight"
      }
      style={`color:${props.emphasis ? "var(--ui-price)" : "var(--ui-text)"}`}
    >
      {props.value}
    </div>
    {props.note ? (
      <div
        class="mt-0.5 text-[11px] leading-tight"
        style="color:var(--ui-text-muted)"
      >
        {props.note}
      </div>
    ) : null}
  </td>
);
