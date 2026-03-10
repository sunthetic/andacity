import { component$, type QRL } from "@builder.io/qwik";
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultPricePanel,
  ResultReasonCallout,
  ResultTrustBar,
} from "~/components/results/ResultCardScaffold";
import { buildFlightWhyThis } from "~/components/results/result-card-copy";
import { CompareButton } from "~/components/save-compare/CompareButton";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { PriceDisplayContract } from "~/lib/pricing/price-display";
import type { FlightSortKey } from "~/lib/search/flights/flight-sort-options";
import type { FlightResult } from "~/types/flights/search";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const FlightCard = component$((props: FlightCardProps) => {
  const flight = props.result;
  const whyThis = buildFlightWhyThis(
    {
      stops: flight.stops,
      duration: flight.duration,
      price: flight.price,
      availabilityConfidence: flight.availabilityConfidence,
    },
    props.activeSort,
  );
  const dateDetail = buildFlightDateDetail(flight);

  return (
    <ResultCardScaffold
      hasFacts={true}
      hasWhyThis={Boolean(whyThis)}
      hasSecondaryActions={Boolean(props.savedItem)}
      hasPrice={true}
      hasPrimaryAction={true}
      hasTrust={Boolean(flight.availabilityConfidence || flight.freshness)}
    >
      <div q:slot="identity">
        <div class="text-lg font-semibold leading-6 text-[color:var(--color-text-strong)]">
          {flight.airline}
        </div>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {flight.origin} to {flight.destination}
        </p>
      </div>

      <ResultFactGrid
        q:slot="facts"
        items={[
          {
            label: "Schedule",
            value: `${flight.departureTime} → ${flight.arrivalTime}`,
            detail: dateDetail,
          },
          {
            label: "Trip time",
            value: flight.duration,
            detail: null,
          },
          {
            label: "Stops",
            value: flight.stopsLabel,
            detail: null,
          },
          {
            label: "Cabin",
            value: flight.cabinClass
              ? formatCabinClass(flight.cabinClass)
              : "See fare rules",
            detail: null,
          },
        ]}
      />

      {whyThis ? (
        <ResultReasonCallout q:slot="why-this" text={whyThis} />
      ) : null}

      {props.savedItem ? (
        <div
          q:slot="secondary-actions"
          class="flex flex-wrap gap-2 md:justify-end"
        >
          {props.onToggleSave$ ? (
            <SaveButton
              class="min-h-9 px-3 py-2"
              saved={Boolean(props.isSaved)}
              idleLabel="Shortlist"
              activeLabel="Shortlisted"
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleSave$) return;
                props.onToggleSave$(props.savedItem);
              }}
            />
          ) : null}

          {props.onToggleCompare$ ? (
            <CompareButton
              class="min-h-9 px-3 py-2"
              selected={Boolean(props.isCompared)}
              disabled={Boolean(props.compareDisabled)}
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleCompare$) return;
                props.onToggleCompare$(props.savedItem);
              }}
            />
          ) : null}

          <AddToTripButton
            class="min-h-9 rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
            item={props.savedItem}
          />
        </div>
      ) : null}

      <ResultPricePanel
        q:slot="price"
        display={props.priceDisplay}
        currency={flight.currency}
        align="right"
      />

      <a
        q:slot="primary-action"
        class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
        href={props.ctaHref || "/flights"}
      >
        Select flight
      </a>

      <ResultTrustBar
        q:slot="trust"
        confidence={flight.availabilityConfidence}
        freshness={flight.freshness}
      />
    </ResultCardScaffold>
  );
});

const formatCabinClass = (value: string) => {
  return String(value || "")
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const buildFlightDateDetail = (flight: FlightResult) => {
  if (!flight.requestedServiceDate && !flight.serviceDate) return null;
  if (
    flight.requestedServiceDate &&
    flight.requestedServiceDate === flight.serviceDate
  ) {
    return `Travel date ${formatFlightDate(flight.serviceDate)}`;
  }

  if (flight.serviceDate) {
    return `Closest stored option ${formatFlightDate(flight.serviceDate)}`;
  }

  return null;
};

const formatFlightDate = (value: string | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "";
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

type FlightCardProps = {
  result: FlightResult;
  priceDisplay: PriceDisplayContract;
  activeSort?: FlightSortKey;
  ctaHref?: string;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onToggleCompare$?: QRL<(item: SavedItem) => void>;
};
