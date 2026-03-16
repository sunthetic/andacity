import { component$ } from "@builder.io/qwik";
import type { HotelAmenitiesListModel } from "~/types/hotel-entity-page";

export const HotelAmenitiesList = component$(
  (props: HotelAmenitiesListProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
          Property details
        </p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {props.amenities.title}
        </h2>

        {props.amenities.items.length ? (
          <div class="mt-5 flex flex-wrap gap-2">
            {props.amenities.items.map((item) => (
              <span
                key={item}
                class="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)]"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p class="mt-5 text-sm leading-6 text-[color:var(--color-text-muted)]">
            {props.amenities.emptyLabel}
          </p>
        )}
      </section>
    );
  },
);

type HotelAmenitiesListProps = {
  amenities: HotelAmenitiesListModel;
};
