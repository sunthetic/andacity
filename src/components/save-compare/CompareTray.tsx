import { component$, type QRL } from "@builder.io/qwik";
import { verticalCompareLabel } from "~/lib/save-compare/compare-state";
import type { SavedVertical } from "~/types/save-compare/saved-item";

export const CompareTray = component$((props: CompareTrayProps) => {
  return (
    <div class="sticky bottom-3 z-40 mt-6">
      <div class="t-card flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3 backdrop-blur">
        <div>
          <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Shortlist
          </p>
          <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            {verticalCompareLabel(props.vertical, props.savedCount)}
          </p>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick$={props.onClear$}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick$={props.onOpen$}
            class="t-btn-primary px-4 py-1.5 text-xs font-semibold"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
});

type CompareTrayProps = {
  vertical: SavedVertical;
  savedCount: number;
  onOpen$: QRL<() => void>;
  onClear$: QRL<() => void>;
};
