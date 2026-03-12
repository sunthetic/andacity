import { component$ } from '@builder.io/qwik'
import {
  ResultCardScaffold,
  ResultFactList,
  ResultPricePanel,
  ResultTrustBar,
} from '~/components/results/ResultCardScaffold'
import {
  markBookingStageProgress,
  trackBookingEvent,
  type BookingVertical,
} from '~/lib/analytics/booking-telemetry'
import { buildCarPriceDisplay } from '~/lib/pricing/price-display'
import type { CarRentalResult } from '~/types/car-rentals/search'

export const CarRentalResultCard = component$(({ r, days, detailHref, telemetry }: CarRentalResultCardProps) => {
  const href = detailHref || `/car-rentals/${encodeURIComponent(r.slug)}`
  const onOpenDetail$ = () => {
    if (!telemetry) return

    trackBookingEvent('booking_search_result_opened', {
      vertical: telemetry.vertical,
      surface: telemetry.surface,
      item_id: telemetry.itemId,
      item_position: telemetry.itemPosition ?? undefined,
      target: 'detail',
    })
    markBookingStageProgress('search_results')
  }
  const priceDisplay = buildCarPriceDisplay({
    currencyCode: r.currency,
    dailyRate: r.priceFrom,
    days,
  })
  const inclusionHighlights = r.inclusions.slice(0, 4).join(' · ')

  return (
    <ResultCardScaffold
      hasMedia={true}
      hasFacts={true}
      hasDetails={Boolean(inclusionHighlights)}
      hasPrice={true}
      hasPrimaryAction={true}
      hasTrust={Boolean(r.availabilityConfidence || r.freshness)}
    >
      <a q:slot="media" class="block h-full" href={href} onClick$={onOpenDetail$}>
          <img
            class="h-44 w-full object-cover md:h-full"
            src={r.image}
            alt={r.name}
            loading="lazy"
            width={640}
            height={352}
          />
      </a>

      <div q:slot="identity">
        <a
          class="text-lg font-semibold leading-6 text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
          href={href}
          onClick$={onOpenDetail$}
        >
          {r.name}
        </a>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {[r.pickupArea, r.category, r.transmission, r.seats != null ? `${r.seats} seats` : '']
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <ResultFactList
        q:slot="facts"
        columnsFrom="xl"
        items={[
          {
            label: 'Price',
            value: `From ${formatMoney(r.priceFrom, r.currency)}/day`,
            detail: days ? `${days} day total available below` : 'Add dates for totals',
          },
          {
            label: 'Policies',
            value: r.freeCancellation ? 'Free cancellation' : 'Cancellation varies',
            detail: r.payAtCounter ? 'Pay at counter' : 'Prepay',
          },
          {
            label: 'Pickup',
            value: r.pickupArea,
            detail: `${r.score.toFixed(2)} suitability score`,
          },
        ]}
      />

      {inclusionHighlights ? (
        <p q:slot="details" class="text-sm leading-5 text-[color:var(--color-text-muted)]">
          <span class="font-medium text-[color:var(--color-text)]">Includes:</span>{' '}
          {inclusionHighlights}
        </p>
      ) : null}

      <ResultPricePanel
        q:slot="price"
        display={priceDisplay}
        currency={r.currency}
        align="right"
        missingTotalText="Add dates to see rental totals."
      />

      <a
        q:slot="primary-action"
        class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
        href={href}
        onClick$={onOpenDetail$}
      >
        View rental
      </a>

      <ResultTrustBar
        q:slot="trust"
        confidence={r.availabilityConfidence}
        freshness={r.freshness}
        note={`Score ${r.score.toFixed(2)} reflects price, policy, and convenience balance.`}
      />
    </ResultCardScaffold>
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

/* -----------------------------
   Types
----------------------------- */

type CarRentalResultCardProps = {
  r: CarRentalResult
  days: number | null
  detailHref?: string
  telemetry?: {
    vertical: BookingVertical
    surface: string
    itemId: string
    itemPosition?: number | null
  }
}
