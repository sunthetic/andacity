import { component$, type QRL } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { Hotel } from "~/data/hotels";
import {
  formatMoney,
  formatPriceChange,
  formatPriceQualifier,
  type PriceDisplayContract,
} from "~/lib/pricing/price-display";
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

            <div class="text-right">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {props.priceDisplay.baseLabel}{" "}
                {formatMoney(props.priceDisplay.baseAmount, h.currency)}
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                  {formatPriceQualifier(props.priceDisplay.baseQualifier)}
                </span>
              </div>

              {props.priceDisplay.baseTotalAmount != null ? (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {props.priceDisplay.baseTotalLabel}:{" "}
                  <span class="font-medium text-[color:var(--color-text)]">
                    {formatMoney(
                      props.priceDisplay.baseTotalAmount,
                      h.currency,
                    )}
                  </span>
                </div>
              ) : null}

              {props.priceDisplay.totalAmount != null &&
              props.priceDisplay.estimatedFeesAmount != null ? (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {props.priceDisplay.totalLabel}:{" "}
                  <span class="font-medium text-[color:var(--color-text)]">
                    {formatMoney(props.priceDisplay.totalAmount, h.currency)}
                  </span>
                  <span class="ml-1">
                    incl.{" "}
                    {formatMoney(
                      props.priceDisplay.estimatedFeesAmount,
                      h.currency,
                    )}{" "}
                    est.
                  </span>
                </div>
              ) : null}

              {props.priceDisplay.supportText ? (
                <div class="mt-1 max-w-[220px] text-xs text-[color:var(--color-text-muted)]">
                  {props.priceDisplay.supportText}
                </div>
              ) : null}

              {props.priceDisplay.delta &&
              props.priceDisplay.delta.status !== "unchanged" &&
              props.priceDisplay.delta.status !== "unavailable" ? (
                <div
                  class={[
                    "mt-1 text-xs font-medium",
                    props.priceDisplay.delta.status === "increased"
                      ? "text-[color:var(--color-error,#b91c1c)]"
                      : "text-[color:var(--color-success,#0f766e)]",
                  ]}
                >
                  {formatPriceChange(props.priceDisplay.delta, h.currency)}
                </div>
              ) : null}
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
  priceDisplay: PriceDisplayContract;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  detailHref?: string;
};

const buildHotelDetailHref = (hotelSlug: string) =>
  `/hotels/${encodeURIComponent(hotelSlug)}`;
