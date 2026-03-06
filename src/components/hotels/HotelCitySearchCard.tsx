import { component$ } from '@builder.io/qwik'

export const HotelCitySearchCard = component$((props: HotelCitySearchCardProps) => {
  return (
    <div class="t-card p-5">
      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</div>

      <form method="get" action={props.action} class="mt-4 grid gap-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
              Check-in
            </label>
            <input
              name="checkIn"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="YYYY-MM-DD"
              value={props.checkIn || ''}
            />
          </div>

          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
              Check-out
            </label>
            <input
              name="checkOut"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="YYYY-MM-DD"
              value={props.checkOut || ''}
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
              Adults
            </label>
            <input
              name="adults"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="2"
              value={props.adults || ''}
            />
          </div>

          <div>
            <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
              Rooms
            </label>
            <input
              name="rooms"
              class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
              placeholder="1"
              value={props.rooms || ''}
            />
          </div>
        </div>

        <button class="t-btn-primary" type="submit">
          {props.updateLabel || 'Update'}
        </button>

        <a class="t-btn-primary block text-center" href={props.resultsHref}>
          {props.resultsLabel || 'See hotel results'}
        </a>

        <div class="text-xs text-[color:var(--color-text-muted)]">
          {props.helperText || 'This city page is indexable. Search pages remain noindex.'}
        </div>
      </form>
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type HotelCitySearchCardProps = {
  title: string
  action: string
  resultsHref: string
  checkIn?: string
  checkOut?: string
  adults?: string
  rooms?: string
  updateLabel?: string
  resultsLabel?: string
  helperText?: string
}
