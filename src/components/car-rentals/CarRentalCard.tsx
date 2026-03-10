import { component$, type QRL } from "@builder.io/qwik";
import type { CarRentalResult } from "~/types/car-rentals/search";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import {
  formatMoney,
  formatPriceChange,
  formatPriceQualifier,
  type PriceDisplayContract,
} from "~/lib/pricing/price-display";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const CarRentalCard = component$((props: CarRentalCardProps) => {
  const r = props.result;
  const pickupType =
    r.pickupType ||
    (r.pickupArea.toLowerCase().includes("airport") ? "airport" : "city");

  return (
    <article class="t-card overflow-hidden">
      <div class="grid gap-0 md:grid-cols-[220px_1fr]">
        <a
          class="block bg-[color:var(--color-neutral-50)]"
          href={props.detailHref || buildCarRentalDetailHref(r.slug)}
        >
          <img
            class="h-44 w-full object-cover md:h-full"
            src={r.image}
            alt={r.name}
            loading="lazy"
            width={640}
            height={352}
          />
        </a>

        <div class="p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <a
                href={props.detailHref || buildCarRentalDetailHref(r.slug)}
                class="text-sm font-semibold text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
              >
                {r.name}
              </a>
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {r.vehicleName || r.category || "Standard car"}
              </p>
            </div>

            <div class="text-right">
              {props.savedItem && props.onToggleSave$ ? (
                <div class="mb-2">
                  <SaveButton
                    saved={Boolean(props.isSaved)}
                    onToggle$={() => {
                      if (!props.savedItem || !props.onToggleSave$) return;
                      props.onToggleSave$(props.savedItem);
                    }}
                  />
                </div>
              ) : null}

              {props.savedItem ? (
                <div class="mb-2">
                  <AddToTripButton item={props.savedItem} />
                </div>
              ) : null}

              <div class="text-right">
                <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {props.priceDisplay.baseLabel}{" "}
                  {formatMoney(props.priceDisplay.baseAmount, r.currency)}
                  <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                    {formatPriceQualifier(props.priceDisplay.baseQualifier)}
                  </span>
                </p>

                {props.priceDisplay.baseTotalAmount != null ? (
                  <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {props.priceDisplay.baseTotalLabel}:{" "}
                    <span class="font-medium text-[color:var(--color-text)]">
                      {formatMoney(
                        props.priceDisplay.baseTotalAmount,
                        r.currency,
                      )}
                    </span>
                  </p>
                ) : null}

                {props.priceDisplay.supportText ? (
                  <p class="mt-1 max-w-[220px] text-xs text-[color:var(--color-text-muted)]">
                    {props.priceDisplay.supportText}
                  </p>
                ) : null}

                {props.priceDisplay.delta &&
                props.priceDisplay.delta.status !== "unchanged" &&
                props.priceDisplay.delta.status !== "unavailable" ? (
                  <p
                    class={[
                      "mt-1 text-xs font-medium",
                      props.priceDisplay.delta.status === "increased"
                        ? "text-[color:var(--color-error,#b91c1c)]"
                        : "text-[color:var(--color-success,#0f766e)]",
                    ]}
                  >
                    {formatPriceChange(props.priceDisplay.delta, r.currency)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            {r.category ? <span class="t-badge">{r.category}</span> : null}
            {r.transmission ? (
              <span class="t-badge">{r.transmission}</span>
            ) : null}
            {r.seats != null ? (
              <span class="t-badge">{r.seats} seats</span>
            ) : null}
            {r.bags ? <span class="t-badge">{r.bags}</span> : null}
            <span class="t-badge">
              {pickupType === "airport" ? "Airport pickup" : "City pickup"}
            </span>
          </div>

          <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
            {r.pickupArea}
          </p>

          <div class="mt-3">
            <AvailabilityConfidence confidence={r.availabilityConfidence} />
          </div>

          <div class="mt-4">
            <a
              class="t-btn-primary inline-block px-4 py-2 text-sm"
              href={props.detailHref || buildCarRentalDetailHref(r.slug)}
            >
              View deal
            </a>
          </div>
        </div>
      </div>
    </article>
  );
});

type CarRentalCardProps = {
  result: CarRentalResult;
  priceDisplay: PriceDisplayContract;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  detailHref?: string;
};

const buildCarRentalDetailHref = (rentalSlug: string) =>
  `/car-rentals/${encodeURIComponent(rentalSlug)}`;
