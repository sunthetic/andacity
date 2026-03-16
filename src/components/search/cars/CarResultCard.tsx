import { component$ } from "@builder.io/qwik";
import { ResultCardHeader } from "~/components/results/ResultCardHeader";
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultFactList,
} from "~/components/results/ResultCardScaffold";
import type { CarResultCardModel } from "~/types/search-ui";

export const CarResultCard = component$((props: CarResultCardProps) => {
  const card = props.card;

  return (
    <ResultCardScaffold hasFacts={true} hasDetails={true} hasPrice={true} hasPrimaryAction={true}>
      <div q:slot="identity">
        <div class="mb-3 flex flex-wrap gap-2">
          <span class="t-badge">{card.categoryLabel}</span>
          {card.providerLabel ? <span class="t-badge">Source: {card.providerLabel}</span> : null}
        </div>

        <ResultCardHeader title={card.vehicleName} subtitle={card.brandLabel} />
      </div>

      <ResultFactGrid
        q:slot="facts"
        items={[
          {
            label: "Pickup",
            value: card.pickupCode,
            detail: card.pickupDateLabel,
          },
          {
            label: "Dropoff",
            value: card.dropoffCode,
            detail: card.dropoffDateLabel,
          },
          {
            label: "Transmission",
            value: card.transmissionLabel,
            detail: null,
          },
          {
            label: "Passengers",
            value: card.passengerLabel,
            detail: card.baggageLabel,
          },
        ]}
      />

      <div q:slot="details">
        <ResultFactList
          items={[
            {
              label: "Brand",
              value: card.brandLabel,
              detail: card.providerLabel ? `Source: ${card.providerLabel}` : null,
            },
            {
              label: "Vehicle class",
              value: card.categoryLabel,
              detail: null,
            },
            {
              label: "Rental window",
              value: card.rentalLengthLabel,
              detail: `${card.pickupDateLabel} to ${card.dropoffDateLabel}`,
            },
            {
              label: "Cancellation",
              value: card.cancellationSummary,
              detail: null,
            },
          ]}
          columns={2}
          columnsFrom="xl"
        />
      </div>

      <div q:slot="price" class="text-left md:text-right">
        <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total rental
        </p>
        <p class="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {card.price.totalDisplay}
        </p>
        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
          {card.price.supportingDisplay ||
            (card.price.currency ? `${card.price.currency} pricing` : "Pricing updates at selection")}
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

type CarResultCardProps = {
  card: CarResultCardModel;
};
