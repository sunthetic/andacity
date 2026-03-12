import { component$, type QRL } from "@builder.io/qwik";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const FlightCompareCard = component$((props: FlightCompareCardProps) => {
  return (
    <article class="t-card p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            {props.item.title}
          </div>
          {props.item.subtitle ? (
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {props.item.subtitle}
            </p>
          ) : null}

          {props.item.price ? (
            <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.item.price}
            </p>
          ) : null}

          {props.item.meta?.length ? (
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {props.item.meta.join(" · ")}
            </p>
          ) : null}

          <div class="mt-2">
            <AddToTripButton item={props.item} telemetrySource="compare_card" />
          </div>

          <a
            href={props.item.href}
            class="mt-2 inline-flex text-xs font-medium text-[color:var(--color-action)] hover:text-[color:var(--color-action-hover)]"
          >
            View flight options
          </a>
        </div>

        <button
          type="button"
          onClick$={() => props.onRemove$(props.item.id)}
          class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
        >
          Remove
        </button>
      </div>
    </article>
  );
});

type FlightCompareCardProps = {
  item: SavedItem;
  onRemove$: QRL<(id: string) => void>;
};
