import { component$, type QRL } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import {
  formatMoney,
  formatPriceChange,
  formatPriceQualifier,
  type PriceDisplayContract,
} from "~/lib/pricing/price-display";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { FlightResult } from "~/types/flights/search";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const FlightCard = component$((props: FlightCardProps) => {
  const flight = props.result;

  return (
    <article class="t-card p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            {flight.airline}
          </div>
          <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
            {flight.origin} → {flight.destination}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <span class="t-badge">Depart {flight.departureTime}</span>
            <span class="t-badge">Arrive {flight.arrivalTime}</span>
            <span class="t-badge">{flight.duration}</span>
            <span class="t-badge">{flight.stopsLabel}</span>
            {flight.cabinClass ? (
              <span class="t-badge">{formatCabinClass(flight.cabinClass)}</span>
            ) : null}
          </div>

          <div class="mt-3">
            <AvailabilityConfidence
              confidence={flight.availabilityConfidence}
            />
          </div>
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
            <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              {formatMoney(props.priceDisplay.baseAmount, flight.currency)}
              {props.priceDisplay.baseQualifier ? (
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                  {formatPriceQualifier(props.priceDisplay.baseQualifier)}
                </span>
              ) : null}
            </p>

            {props.priceDisplay.baseTotalAmount != null ? (
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {props.priceDisplay.baseTotalLabel}:{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoney(
                    props.priceDisplay.baseTotalAmount,
                    flight.currency,
                  )}
                </span>
                {props.priceDisplay.unitCountLabel ? (
                  <span class="ml-1">
                    ({props.priceDisplay.unitCountLabel})
                  </span>
                ) : null}
              </p>
            ) : null}

            {props.priceDisplay.supportText ? (
              <p class="mt-2 ml-auto max-w-[165px] text-[11px] leading-4 text-[color:var(--color-text-subtle)]">
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
                {formatPriceChange(props.priceDisplay.delta, flight.currency)}
              </p>
            ) : null}
          </div>

          <div class="mt-4">
            <a
              class="t-btn-primary inline-block px-4 py-2 text-sm"
              href={props.ctaHref || "/flights"}
            >
              Select flight
            </a>
          </div>
        </div>
      </div>
    </article>
  );
});

const formatCabinClass = (value: string) => {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

type FlightCardProps = {
  result: FlightResult;
  priceDisplay: PriceDisplayContract;
  ctaHref?: string;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
};
