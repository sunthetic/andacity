import { component$ } from "@builder.io/qwik";
import type { TripPageItemGroupModel } from "~/lib/trips/trip-page-model";
import { TripCarItemCard } from "~/components/trips/TripCarItemCard";
import { TripFlightItemCard } from "~/components/trips/TripFlightItemCard";
import { TripHotelItemCard } from "~/components/trips/TripHotelItemCard";

export const TripItemGroup = component$(
  (props: { group: TripPageItemGroupModel }) => {
    const { group } = props;

    return (
      <section class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-[color:var(--color-text-strong)]">
              {group.title}
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {group.description}
            </p>
          </div>

          <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-sm font-medium text-[color:var(--color-text-strong)]">
            {group.count} item{group.count === 1 ? "" : "s"}
          </span>
        </div>

        <div class="grid gap-4">
          {group.itemType === "flight"
            ? group.items.map((item) => (
                <TripFlightItemCard key={item.id} item={item} />
              ))
            : group.itemType === "hotel"
              ? group.items.map((item) => (
                  <TripHotelItemCard key={item.id} item={item} />
                ))
              : group.items.map((item) => (
                  <TripCarItemCard key={item.id} item={item} />
                ))}
        </div>
      </section>
    );
  },
);
