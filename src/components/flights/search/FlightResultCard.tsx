import { component$ } from '@builder.io/qwik'
import type { FlightResult } from '~/types/flights/search'

export const FlightResultCard = component$(({ flight }: FlightResultCardProps) => {
  return (
    <article class="t-card overflow-hidden p-5 hover:bg-white">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-base font-semibold text-[color:var(--color-text-strong)]">{flight.airline}</div>
          <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {flight.origin} → {flight.destination} · {flight.stopsLabel}
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span class="t-badge">Depart {flight.departureTime}</span>
            <span class="t-badge">Arrive {flight.arrivalTime}</span>
            <span class="t-badge">{flight.duration}</span>
          </div>
        </div>

        <div class="text-right">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{formatMoney(flight.price, flight.currency)}</div>
          <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">per traveler</div>
          <div class="mt-4">
            <span class="t-btn-primary inline-block px-5 text-center">Select →</span>
          </div>
        </div>
      </div>
    </article>
  )
})

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

type FlightResultCardProps = {
  flight: FlightResult
}
