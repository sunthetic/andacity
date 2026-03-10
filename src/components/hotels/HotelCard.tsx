import { component$, type QRL } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { Hotel } from "~/data/hotels";
import { formatMoney } from "~/lib/formatMoney";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const HotelCard = component$((props: HotelCardProps) => {
  const h = props.hotel;

  return (
    <article class="t-card overflow-hidden">
      <a class="block" href={props.detailHref || buildHotelDetailHref(h.slug)}>
        <div class="bg-[color:var(--color-neutral-50)]">
          <img
            class="h-40 w-full object-cover"
            src={h.images[0] || "/img/demo/hotel-1.jpg"}
            alt={h.name}
            loading="lazy"
            width={640}
            height={320}
          />
        </div>
      </a>

      <div class="p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <a
              class="text-sm font-semibold text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
              href={props.detailHref || buildHotelDetailHref(h.slug)}
            >
              {h.name}
            </a>
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {h.neighborhood} · {h.stars}★ · {h.rating.toFixed(1)} (
              {h.reviewCount.toLocaleString("en-US")})
            </p>
          </div>

          <div class="flex flex-col items-end gap-2">
            {props.savedItem && props.onToggleSave$ ? (
              <SaveButton
                saved={Boolean(props.isSaved)}
                onToggle$={() => {
                  if (!props.savedItem || !props.onToggleSave$) return;
                  props.onToggleSave$(props.savedItem);
                }}
              />
            ) : null}

            {props.savedItem ? (
              <AddToTripButton item={props.savedItem} />
            ) : null}

            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {formatMoney(h.fromNightly, h.currency)}
              <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                /night
              </span>
            </div>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          {h.policies.freeCancellation ? (
            <span class="t-badge t-badge--deal">Free cancellation</span>
          ) : (
            <span class="t-badge">Cancellation varies</span>
          )}
          {h.policies.payLater ? (
            <span class="t-badge t-badge--deal">Pay later</span>
          ) : (
            <span class="t-badge">Prepay</span>
          )}
        </div>

        <div class="mt-3">
          <AvailabilityConfidence confidence={h.availabilityConfidence} />
        </div>
      </div>
    </article>
  );
});

type HotelCardProps = {
  hotel: Hotel;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  detailHref?: string;
};

const buildHotelDetailHref = (hotelSlug: string) =>
  `/hotels/${encodeURIComponent(hotelSlug)}`;
