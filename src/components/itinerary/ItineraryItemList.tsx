import { component$ } from "@builder.io/qwik";
import { ItineraryItemCard } from "~/components/itinerary/ItineraryItemCard";
import type { ItineraryPageModel } from "~/fns/itinerary/getItineraryPageModel";

export const ItineraryItemList = component$(
  (props: {
    items: ItineraryPageModel["items"];
    previewOnly?: boolean;
  }) => {
    if (!props.items.length) {
      return (
        <section class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4">
          <p class="text-sm font-medium text-[color:var(--color-text-strong)]">
            No itinerary items were persisted.
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Reload this page to check for the latest persisted booking updates.
          </p>
        </section>
      );
    }

    return (
      <div class="space-y-3">
        {props.items.map((item) => (
          <ItineraryItemCard
            key={item.id}
            item={item}
            previewOnly={props.previewOnly}
          />
        ))}
      </div>
    );
  },
);
