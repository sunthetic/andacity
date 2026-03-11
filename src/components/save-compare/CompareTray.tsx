import { component$, type QRL } from "@builder.io/qwik";
import {
  canOpenCompare,
  compareCountLabel,
  verticalCompareTitle,
} from "~/lib/save-compare/compare-state";
import type { SavedVertical } from "~/types/save-compare/saved-item";

export const CompareTray = component$((props: CompareTrayProps) => {
  const canOpen = canOpenCompare(props.compareCount);
  const hasCustomBottomOffset = /\bbottom-/.test(props.class || "");

  return (
    <div
      class={[
        "pointer-events-none fixed inset-x-0 z-40 px-3",
        hasCustomBottomOffset ? null : "bottom-[var(--sticky-bottom-offset)]",
        props.class,
      ]}
    >
      <div class="pointer-events-auto mx-auto max-w-5xl">
        <div class="t-card flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3 backdrop-blur">
          <div>
            <p class="text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Compare
            </p>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {compareCountLabel(props.vertical, props.compareCount)}
            </p>
            {!canOpen ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                Select one more item to open comparison.
              </p>
            ) : null}
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
              disabled={!canOpen}
              class={[
                "t-btn-primary px-4 py-1.5 text-xs font-semibold",
                !canOpen ? "cursor-not-allowed opacity-60" : null,
              ]}
            >
              {verticalCompareTitle(props.vertical)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

type CompareTrayProps = {
  vertical: SavedVertical;
  compareCount: number;
  onOpen$: QRL<() => void>;
  onClear$: QRL<() => void>;
  class?: string;
};
