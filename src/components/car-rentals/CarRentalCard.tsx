import { component$ } from '@builder.io/qwik'
import type { CarRentalResult } from '~/types/car-rentals/search'
import { formatMoney } from '~/lib/formatMoney'

export const CarRentalCard = component$((props: CarRentalCardProps) => {
  const r = props.result
  const pickupType = r.pickupType || (r.pickupArea.toLowerCase().includes('airport') ? 'airport' : 'city')

  return (
    <article class="t-card overflow-hidden">
      <div class="grid gap-0 md:grid-cols-[220px_1fr]">
        <a class="block bg-[color:var(--color-neutral-50)]" href={buildCarRentalDetailHref(r.slug)}>
          <img
            class="h-44 w-full object-cover md:h-full"
            src={r.image}
            alt={r.name}
            loading="lazy"
            width={640}
            height={352}
          />
        </a>

        <div class="p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <a
                href={buildCarRentalDetailHref(r.slug)}
                class="text-sm font-semibold text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
              >
                {r.name}
              </a>
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                {r.vehicleName || r.category || 'Standard car'}
              </p>
            </div>

            <div class="text-right">
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                {formatMoney(r.priceFrom, r.currency)}
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/day</span>
              </p>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            {r.category ? <span class="t-badge">{r.category}</span> : null}
            {r.transmission ? <span class="t-badge">{r.transmission}</span> : null}
            {r.seats != null ? <span class="t-badge">{r.seats} seats</span> : null}
            {r.bags ? <span class="t-badge">{r.bags}</span> : null}
            <span class="t-badge">{pickupType === 'airport' ? 'Airport pickup' : 'City pickup'}</span>
          </div>

          <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">{r.pickupArea}</p>

          <div class="mt-4">
            <a class="t-btn-primary inline-block px-4 py-2 text-sm" href={buildCarRentalDetailHref(r.slug)}>
              View deal
            </a>
          </div>
        </div>
      </div>
    </article>
  )
})

type CarRentalCardProps = {
  result: CarRentalResult
}

const buildCarRentalDetailHref = (rentalSlug: string) => `/car-rentals/${encodeURIComponent(rentalSlug)}`
