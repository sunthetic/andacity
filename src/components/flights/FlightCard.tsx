import { component$, type QRL } from "@builder.io/qwik";
import { formatMoney } from "~/lib/formatMoney";
import { SaveButton } from "~/components/save-compare/SaveButton";
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

          <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            {formatMoney(flight.price, flight.currency)}
            <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
              /traveler
            </span>
          </p>

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
  ctaHref?: string;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
};
