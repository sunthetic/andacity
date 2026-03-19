import { component$ } from "@builder.io/qwik";
import { MyTripsList } from "~/components/my-trips/MyTripsList";
import type { MyTripsGroupModel } from "~/fns/my-trips/getMyTripsPageModel";

export const MyTripsGroup = component$(
  (props: { group: MyTripsGroupModel }) => {
    const { group } = props;

    return (
      <section class="space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-[color:var(--color-text-strong)]">
              {group.title}
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {group.description}
            </p>
          </div>

          <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {group.countLabel}
          </span>
        </div>

        <MyTripsList trips={group.trips} />
      </section>
    );
  },
);
