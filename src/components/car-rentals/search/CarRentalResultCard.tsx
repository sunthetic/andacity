import { component$ } from '@builder.io/qwik'
import type { CarRentalResult } from '~/types/car-rentals/search'

export const CarRentalResultCard = component$(({ r, days }: CarRentalResultCardProps) => {
  const total = days ? r.priceFrom * days : null

  return (
    <a class="t-card block overflow-hidden hover:bg-white" href={`/car-rentals/${encodeURIComponent(r.slug)}`}>
      <div class="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div class="bg-[color:var(--color-neutral-50)]">
          <img class="h-44 w-full object-cover lg:h-full" src={r.image} alt={r.name} loading="lazy" />
        </div>

        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-base font-semibold text-[color:var(--color-text-strong)]">{r.name}</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {r.pickupArea}
                {r.category ? ` · ${r.category}` : ''}
                {r.transmission ? ` · ${r.transmission}` : ''}
                {r.seats != null ? ` · ${r.seats} seats` : ''}
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                {r.freeCancellation ? (
                  <span class="t-badge t-badge--deal">Free cancellation</span>
                ) : (
                  <span class="t-badge">Cancellation varies</span>
                )}

                {r.payAtCounter ? (
                  <span class="t-badge t-badge--deal">Pay at counter</span>
                ) : (
                  <span class="t-badge">Prepay</span>
                )}

                {r.badges.slice(0, 2).map((b) => (
                  <span key={b} class="t-badge">
                    {b}
                  </span>
                ))}
              </div>

              <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
                <span class="font-medium text-[color:var(--color-text)]">Includes:</span>{' '}
                {r.inclusions.slice(0, 4).join(' · ')}
              </div>
            </div>

            <div class="text-right min-w-40.25">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                From {formatMoney(r.priceFrom, r.currency)}
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/day</span>
              </div>

              {total != null ? (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Est. total:{' '}
                  <span class="font-medium text-[color:var(--color-text)]">{formatMoney(total, r.currency)}</span>
                  <span class="ml-1">({days} days)</span>
                </div>
              ) : (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">Add dates to see totals</div>
              )}

              <div class="mt-4">
                <span class="t-btn-primary inline-block px-5 text-center">View →</span>
              </div>
            </div>
          </div>

          <div class="mt-4 border-t border-[color:var(--color-divider)] pt-4 text-xs text-[color:var(--color-text-muted)]">
            Score: {r.score.toFixed(2)} · Balanced for price, rating, policies
          </div>
        </div>
      </div>
    </a>
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
}
