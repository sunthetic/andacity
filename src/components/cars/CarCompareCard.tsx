import { component$, type QRL } from "@builder.io/qwik";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const CarCompareCard = component$((props: CarCompareCardProps) => {
  return (
    <article class="t-card p-4">
      <div class="flex items-start gap-3">
        {props.item.image ? (
          <img
            src={props.item.image}
            alt={props.item.title}
            width={128}
            height={96}
            class="h-20 w-28 rounded-lg object-cover"
            loading="lazy"
          />
        ) : null}

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {props.item.title}
              </div>
              {props.item.subtitle ? (
                <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {props.item.subtitle}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick$={() => props.onRemove$(props.item.id)}
              class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-strong)]"
            >
              Remove
            </button>
          </div>

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

          <a
            href={props.item.href}
            class="mt-2 inline-flex text-xs font-medium text-[color:var(--color-action)] hover:text-[color:var(--color-action-hover)]"
          >
            View rental
          </a>
        </div>
      </div>
    </article>
  );
});

type CarCompareCardProps = {
  item: SavedItem;
  onRemove$: QRL<(id: string) => void>;
};
