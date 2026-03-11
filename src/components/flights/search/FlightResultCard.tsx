import { component$ } from '@builder.io/qwik'
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultPricePanel,
  ResultTrustBar,
} from '~/components/results/ResultCardScaffold'
import { buildFlightPriceDisplay } from '~/lib/pricing/price-display'
import type { FlightResult } from '~/types/flights/search'

export const FlightResultCard = component$(({ flight }: FlightResultCardProps) => {
  const priceDisplay = buildFlightPriceDisplay({
    currencyCode: flight.currency,
    fare: flight.price,
    travelers: 1,
  })

  return (
    <ResultCardScaffold
      hasFacts={true}
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
            label: 'Schedule',
            value: `${flight.departureTime} → ${flight.arrivalTime}`,
            detail: null,
          },
          {
            label: 'Trip time',
            value: flight.duration,
            detail: null,
          },
          {
            label: 'Stops',
            value: flight.stopsLabel,
            detail: null,
          },
        ]}
      />

      <ResultPricePanel
        q:slot="price"
        display={priceDisplay}
        currency={flight.currency}
        align="right"
      />

      <a
        q:slot="primary-action"
        class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
        href="/flights"
      >
        Select flight
      </a>

      <ResultTrustBar
        q:slot="trust"
        confidence={flight.availabilityConfidence}
        freshness={flight.freshness}
      />
    </ResultCardScaffold>
  )
})

type FlightResultCardProps = {
  flight: FlightResult
}
