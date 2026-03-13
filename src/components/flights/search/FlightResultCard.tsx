import { $, component$ } from '@builder.io/qwik'
import {
  ResultCardScaffold,
  ResultFactGrid,
  ResultPricePanel,
  ResultTrustBar,
} from '~/components/results/ResultCardScaffold'
import {
  markBookingStageProgress,
  trackBookingEvent,
  type BookingVertical,
} from '~/lib/analytics/booking-telemetry'
import { buildFlightPriceDisplay } from '~/lib/pricing/price-display'
import type { FlightResult } from '~/types/flights/search'

export const FlightResultCard = component$(({ flight, telemetry }: FlightResultCardProps) => {
  const onSelectFlight$ = $(() => {
    if (!telemetry) return

    trackBookingEvent('booking_search_result_opened', {
      vertical: telemetry.vertical,
      surface: telemetry.surface,
      item_id: telemetry.itemId,
      item_position: telemetry.itemPosition ?? undefined,
      target: 'select',
    })
    markBookingStageProgress('search_results')
  })
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
        onClick$={onSelectFlight$}
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
  telemetry?: {
    vertical: BookingVertical
    surface: string
    itemId: string
    itemPosition?: number | null
  }
}
