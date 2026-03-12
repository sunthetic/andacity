import { component$, useSignal, type QRL } from "@builder.io/qwik";
import { CarCompareCard } from "~/components/cars/CarCompareCard";
import { FlightCompareCard } from "~/components/flights/FlightCompareCard";
import { HotelCompareCard } from "~/components/hotels/HotelCompareCard";
import {
  verticalCompareLabel,
  verticalCompareTitle,
} from "~/lib/save-compare/compare-state";
import { useOverlayBehavior } from "~/lib/ui/overlay";
import type { SavedItem, SavedVertical } from "~/types/save-compare/saved-item";

export const CompareDrawer = component$((props: CompareDrawerProps) => {
  const openSignal = useSignal(props.open);
  openSignal.value = props.open;
  const { overlayRef, initialFocusRef } = useOverlayBehavior({
    open: openSignal,
    onClose$: props.onClose$,
  });

  if (!props.open) return null;

  return (
    <div class="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close compare drawer"
        class="absolute inset-0 bg-black/35"
        onClick$={props.onClose$}
      />

      <aside
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={verticalCompareTitle(props.vertical)}
        tabIndex={-1}
        class="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)] outline-none lg:inset-y-0 lg:left-auto lg:w-[min(560px,100vw)] lg:max-h-none lg:rounded-none lg:rounded-l-2xl"
      >
        <header class="flex items-start justify-between gap-2 border-b border-[color:var(--color-divider)] px-4 py-3">
          <div>
            <h2 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {verticalCompareTitle(props.vertical)}
            </h2>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {verticalCompareLabel(props.vertical, props.items.length)}
            </p>
          </div>

          <button
            ref={initialFocusRef}
            type="button"
            class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs font-medium text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
            onClick$={props.onClose$}
          >
            Close
          </button>
        </header>

        <div class="flex justify-end border-b border-[color:var(--color-divider)] px-4 py-2">
          <button
            type="button"
            onClick$={props.onClear$}
            class="text-xs font-medium text-[color:var(--color-action)] hover:text-[color:var(--color-action-hover)]"
          >
            Clear all
          </button>
        </div>

        <div class="max-h-[calc(88vh-7.5rem)] overflow-y-auto p-4 lg:max-h-[calc(100vh-7.5rem)]">
          <div class="grid gap-3">
            {props.items.map((item) => (
              <CompareDrawerCard
                key={item.id}
                item={item}
                vertical={props.vertical}
                onRemove$={props.onRemove$}
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
});

const CompareDrawerCard = component$((props: CompareDrawerCardProps) => {
  if (props.vertical === "hotels") {
    return <HotelCompareCard item={props.item} onRemove$={props.onRemove$} />;
  }

  if (props.vertical === "cars") {
    return <CarCompareCard item={props.item} onRemove$={props.onRemove$} />;
  }

  return <FlightCompareCard item={props.item} onRemove$={props.onRemove$} />;
});

type CompareDrawerProps = {
  open: boolean;
  vertical: SavedVertical;
  items: SavedItem[];
  onClose$: QRL<() => void>;
  onClear$: QRL<() => void>;
  onRemove$: QRL<(id: string) => void>;
};

type CompareDrawerCardProps = {
  item: SavedItem;
  vertical: SavedVertical;
  onRemove$: QRL<(id: string) => void>;
};
