import { $, component$, type QRL } from "@builder.io/qwik";
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultPricePanel,
  ResultReasonCallout,
} from "~/components/results/ResultCardScaffold";
import { ResultCardHeader } from "~/components/results/ResultCardHeader";
import { buildFlightWhyThis } from "~/components/results/result-card-copy";
import { CompareButton } from "~/components/save-compare/CompareButton";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import {
  markBookingStageProgress,
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";
import { type PriceDisplayContract } from "~/lib/pricing/price-display";
import type { FlightSortKey } from "~/lib/search/flights/flight-sort-options";
import type { FlightResult } from "~/types/flights/search";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const FlightCard = component$((props: FlightCardProps) => {
  const flight = props.result;
  const ctaHref = flight.searchEntity?.href || props.ctaHref || "/flights";
  const onSelectFlight$ = $(() => {
    if (!props.telemetry) return;

    trackBookingEvent("booking_search_result_opened", {
      vertical: props.telemetry.vertical,
      surface: props.telemetry.surface,
      item_id: props.telemetry.itemId,
      item_position: props.telemetry.itemPosition ?? undefined,
      target: "select",
    });
    markBookingStageProgress("search_results");
  });
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
      hasTrust={true}
    >
      <div q:slot="identity">
        <ResultCardHeader
          title={flight.airline}
          subtitle={`${flight.origin} to ${flight.destination}`}
          price={flight.price}
          currency={flight.currency}
        />
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
              telemetry={{
                vertical: "flights",
                itemId: props.savedItem.id,
                surface: "search_results",
                itemPosition: props.telemetry?.itemPosition,
              }}
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
              telemetry={{
                vertical: "flights",
                itemId: props.savedItem.id,
                surface: "search_results",
                itemPosition: props.telemetry?.itemPosition,
              }}
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleCompare$) return;
                props.onToggleCompare$(props.savedItem);
              }}
            />
          ) : null}

          <AddToTripButton
            class="min-h-9 rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
            item={props.savedItem}
            telemetrySource="search_results"
            telemetryItemPosition={props.telemetry?.itemPosition}
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
        href={ctaHref}
        onClick$={onSelectFlight$}
      >
        View flight
      </a>

      <div
        q:slot="trust"
        class="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {buildFlightTrustBandItems(flight).map((item) => (
          <div
            key={`${item.label}:${item.value}:${item.detail || ""}`}
            class="min-w-0 sm:even:border-l sm:even:border-[color:var(--color-divider)] sm:even:pl-4 xl:border-l xl:border-[color:var(--color-divider)] xl:pl-4 xl:first:border-l-0 xl:first:pl-0"
          >
            <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              {item.label}
            </p>
            <p class="mt-1 text-sm font-semibold leading-5 text-[color:var(--color-text-strong)]">
              {item.value}
            </p>
            {item.detail ? (
              <p class="mt-1 text-[11px] leading-4 text-[color:var(--color-text-muted)]">
                {item.detail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
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

const buildFlightTrustBandItems = (
  flight: FlightResult,
): FlightTrustBandItem[] => {
  return [
    {
      label: "Availability",
      value: flight.availabilityConfidence?.label || "Check availability",
      detail: buildFlightAvailabilityDetail(flight),
    },
    {
      label: "Freshness",
      value: flight.freshness?.label || "Check time unavailable",
      detail: buildFlightFreshnessDetail(flight),
    },
    {
      label: "Fare rules",
      value:
        flight.refundable == null && flight.changeable == null
          ? "Rules unavailable"
          : [
              flight.refundable ? "Refundable" : "Nonrefundable",
              flight.changeable ? "changes allowed" : "changes restricted",
            ].join(" · "),
      detail: flight.fareCode
        ? `${formatFareCode(flight.fareCode)} fare rules apply.`
        : "Review airline fare rules before checkout.",
    },
    {
      label: "Bags and seats",
      value: formatCheckedBagSummary(flight.checkedBagsIncluded),
      detail: `${formatSeatsRemaining(flight.seatsRemaining)}. Carry-on and seat fees can vary.`,
    },
  ];
};

const buildFlightAvailabilityDetail = (flight: FlightResult) => {
  if (flight.availabilityConfidence?.supportText) {
    return flight.availabilityConfidence.supportText;
  }

  if (
    flight.requestedServiceDate &&
    flight.serviceDate &&
    flight.requestedServiceDate !== flight.serviceDate
  ) {
    return `Requested ${formatFlightDate(flight.requestedServiceDate)}; showing ${formatFlightDate(
      flight.serviceDate,
    )}.`;
  }

  if (flight.serviceDate) {
    return `Travel date ${formatFlightDate(flight.serviceDate)}.`;
  }

  return flight.availabilityConfidence?.detailLabel || null;
};

const buildFlightFreshnessDetail = (flight: FlightResult) => {
  if (!flight.freshness) return null;
  return `${flight.freshness.checkedLabel} · ${flight.freshness.relativeLabel}`;
};

const formatFareCode = (value: string) => {
  return String(value || "")
    .trim()
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const formatCheckedBagSummary = (count: number | null | undefined) => {
  if (count == null) return "Baggage rules unavailable";
  if (count <= 0) return "No checked bag included";
  if (count === 1) return "1 checked bag included";
  return `${count} checked bags included`;
};

const formatSeatsRemaining = (count: number | null | undefined) => {
  if (count == null) return "Seat inventory unavailable";
  if (count <= 3) return `${count} seats left at this fare`;
  if (count >= 9) return "9+ seats left at this fare";
  return `${count} seats left at this fare`;
};

type FlightTrustBandItem = {
  label: string;
  value: string;
  detail?: string | null;
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
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
    itemId: string;
    itemPosition?: number | null;
  };
};
