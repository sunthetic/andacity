import { component$ } from '@builder.io/qwik'
import { InventoryFreshness } from '~/components/inventory/InventoryFreshness'
import type { HotelResultCardProps } from '~/types/hotels/search'

export const HotelResultCard = component$(({ h, nights }: HotelResultCardProps) => {
  const total = nights ? h.priceFrom * nights : null

  return (
    <a class="t-card block overflow-hidden hover:bg-white" href={`/hotels/${encodeURIComponent(h.slug)}`}>
      <div class="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div class="bg-[color:var(--color-neutral-50)]">
          <img
            class="h-44 w-full object-cover lg:h-full"
            src={h.image}
            alt={h.name}
            loading="lazy"
            width={640}
            height={352}
          />
        </div>

        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-base font-semibold text-[color:var(--color-text-strong)]">{h.name}</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {h.neighborhood} · {h.stars}★ · {h.rating.toFixed(1)} ★ ({h.reviewCount.toLocaleString('en-US')})
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                {h.refundable ? (
                  <span class="t-badge t-badge--deal">Free cancellation</span>
                ) : (
                  <span class="t-badge">Non-refundable</span>
                )}
                {h.badges.slice(0, 2).map((b) => (
                  <span key={b} class="t-badge">
                    {b}
                  </span>
                ))}
              </div>

              <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
                <span class="font-medium text-[color:var(--color-text)]">Top amenities:</span>{' '}
                {h.amenities.slice(0, 4).join(' · ')}
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                From {formatMoney(h.priceFrom, h.currency)}
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
              </div>

              {total != null ? (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Est. total:{' '}
                  <span class="font-medium text-[color:var(--color-text)]">{formatMoney(total, h.currency)}</span>
                  <span class="ml-1">({nights} nights)</span>
                </div>
              ) : (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">Add dates to see totals</div>
              )}

              <div class="mt-4">
                <span class="t-btn-primary inline-block px-5 text-center">View →</span>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-3 border-t border-[color:var(--color-divider)] pt-4 text-xs text-[color:var(--color-text-muted)] sm:flex-row sm:items-start sm:justify-between">
            <InventoryFreshness freshness={h.freshness} />
            <div class="sm:text-right">
              Score: {h.score.toFixed(2)} · Balanced for price, rating, location, cancellation
            </div>
          </div>
        </div>
      </div>
    </a>
  )
})

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
