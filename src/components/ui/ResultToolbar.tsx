/**
 * CLAUDE-UI-002 — ResultToolbar primitive.
 *
 * Result-count + sort + active-filter chips. Always shows the active filters
 * and gives an obvious, reversible way to clear them. Display-only at the
 * foundation stage.
 */
import { component$ } from "@builder.io/qwik";

type ResultToolbarProps = {
  resultCount: string;
  sortLabel?: string;
  activeChips?: string[];
  showFiltersButton?: boolean;
  class?: string;
};

export const ResultToolbar = component$((props: ResultToolbarProps) => (
  <div
    class={["flex flex-wrap items-center justify-between gap-3 p-2.5", props.class]}
    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
  >
    <div class="flex flex-wrap items-center gap-2">
      {props.showFiltersButton ? (
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-[12px] font-semibold lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="border:1px solid var(--ui-border);color:var(--ui-text)"
        >
          Filters
        </button>
      ) : null}
      <span class="text-[12px] font-semibold" style="color:var(--ui-text-secondary)">
        {props.resultCount}
      </span>
      {props.activeChips?.map((chip) => (
        <span
          key={chip}
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style="background:var(--ui-accent-soft);color:var(--ui-text)"
        >
          {chip}
          <span aria-hidden="true" style="color:var(--ui-text-muted)">✕</span>
        </span>
      ))}
    </div>

    <button
      type="button"
      class="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
      style="color:var(--ui-text-secondary)"
    >
      Sort: {props.sortLabel ?? "Best"}
      <span aria-hidden="true">▾</span>
    </button>
  </div>
));
