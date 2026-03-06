import { component$ } from '@builder.io/qwik'

export const CarRentalSearchCard = component$((props: CarRentalSearchCardProps) => {
  return (
    <div class="t-card p-5">
      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</div>

      <form method="get" action="/search/car-rentals" class="mt-4 grid gap-3">
        <div>
          <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Destination</label>
          <input
            name="q"
            class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
            placeholder={props.destinationPlaceholder || 'e.g., Las Vegas'}
            value={props.destinationValue || ''}
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Pickup</label>
            <input
              name="pickupDate"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="YYYY-MM-DD"
              value={props.pickupDate || ''}
            />
          </div>

          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Dropoff</label>
            <input
              name="dropoffDate"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="YYYY-MM-DD"
              value={props.dropoffDate || ''}
            />
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Drivers</label>
          <input
            name="drivers"
            class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
            placeholder="1"
            value={props.drivers || ''}
          />
        </div>

        <button class="t-btn-primary" type="submit">
          {props.submitLabel || 'Search'}
        </button>

        <div class="text-xs text-[color:var(--color-text-muted)]">
          {props.helperText || 'City and detail pages are indexable. Search pages remain noindex.'}
        </div>
      </form>
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type CarRentalSearchCardProps = {
  title: string
  destinationValue?: string
  destinationPlaceholder?: string
  pickupDate?: string
  dropoffDate?: string
  drivers?: string
  submitLabel?: string
  helperText?: string
}
