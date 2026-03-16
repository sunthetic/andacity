import { component$ } from "@builder.io/qwik";
import { ResultCardHeader } from "~/components/results/ResultCardHeader";
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultFactList,
} from "~/components/results/ResultCardScaffold";
import type { FlightResultCardModel } from "~/types/search-ui";

export const FlightResultCard = component$((props: FlightResultCardProps) => {
  const card = props.card;

  return (
    <ResultCardScaffold hasFacts={true} hasDetails={true} hasPrice={true} hasPrimaryAction={true}>
      <div q:slot="identity">
        <div class="mb-3 flex flex-wrap gap-2">
          {card.flightNumberLabel ? <span class="t-badge">{card.flightNumberLabel}</span> : null}
          {card.providerLabel ? <span class="t-badge">Source: {card.providerLabel}</span> : null}
        </div>

        <ResultCardHeader title={card.airlineLabel} subtitle={card.routeLabel} />
      </div>

      <ResultFactGrid
        q:slot="facts"
        items={[
          {
            label: "Departure",
            value: card.originCode,
            detail: card.departAtLabel,
          },
          {
            label: "Arrival",
            value: card.destinationCode,
            detail: card.arriveAtLabel,
          },
          {
            label: "Duration",
            value: card.durationLabel,
            detail: null,
          },
          {
            label: "Stops",
            value: `${card.stopCount}`,
            detail: card.stopSummary,
          },
        ]}
      />

      <div q:slot="details">
        <ResultFactList
          items={[
            {
              label: "Stop summary",
              value: card.stopSummary,
              detail: null,
            },
            {
              label: "Fare",
              value: card.cabinLabel || "Cabin details unavailable",
              detail: null,
            },
            {
              label: "Itinerary",
              value: card.itinerarySummary || `${card.originCode} -> ${card.destinationCode}`,
              detail: null,
            },
          ]}
          columns={2}
          columnsFrom="xl"
        />
      </div>

      <div q:slot="price" class="text-left md:text-right">
        <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total price
        </p>
        <p class="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {card.price.display}
        </p>
        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
          {card.price.currency ? `${card.price.currency} total` : "Pricing updates at selection"}
        </p>
      </div>

      {card.ctaHref && !card.ctaDisabled ? (
        <a
          q:slot="primary-action"
          class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
          href={card.ctaHref}
        >
          {card.ctaLabel}
        </a>
      ) : (
        <button
          q:slot="primary-action"
          type="button"
          class="t-btn-primary block w-full cursor-not-allowed px-4 py-2.5 text-center text-sm font-semibold opacity-60"
          disabled={true}
        >
          {card.ctaLabel}
        </button>
      )}
    </ResultCardScaffold>
  );
});

type FlightResultCardProps = {
  card: FlightResultCardModel;
};
