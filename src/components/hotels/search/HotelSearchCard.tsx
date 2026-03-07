import { component$, useSignal } from '@builder.io/qwik'

export const HotelSearchCard = component$((props: HotelSearchCardProps) => {
  const destination = useSignal(props.initialDestination ?? '')
  const checkIn = useSignal(props.initialCheckIn ?? '')
  const checkOut = useSignal(props.initialCheckOut ?? '')
  const guests = useSignal(props.initialGuests ?? '2 guests · 1 room')
  const hasSubmitted = useSignal(false)

  const normalizedDestination = destination.value.trim()

  const errors: string[] = []

  if (!normalizedDestination) {
    errors.push('Enter a destination.')
  }

  if (!checkIn.value) {
    errors.push('Select a check-in date.')
  }

  if (!checkOut.value) {
    errors.push('Select a check-out date.')
  }

  if (checkIn.value && checkOut.value && checkOut.value <= checkIn.value) {
    errors.push('Check-out must be after check-in.')
  }

  const isValid = errors.length === 0

  return (
    <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-lg)] md:p-4">
      <form
        action={props.action ?? '/search/hotels/anywhere/1'}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={(_, form) => {
          hasSubmitted.value = true
          if (isValid) {
            form.submit()
          }
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(180px,0.95fr)_auto]"
      >
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left">
          <label
            for="hotel-destination"
            class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]"
          >
            Destination
          </label>

          <input
            id="hotel-destination"
            name="destination"
            type="text"
            bind:value={destination}
            placeholder="City, neighborhood, or hotel"
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-text-muted)]"
          />
        </div>

        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left">
          <label
            for="hotel-check-in"
            class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]"
          >
            Check-in
          </label>

          <input
            id="hotel-check-in"
            name="checkIn"
            type="date"
            bind:value={checkIn}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          />
        </div>

        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left">
          <label
            for="hotel-check-out"
            class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]"
          >
            Check-out
          </label>

          <input
            id="hotel-check-out"
            name="checkOut"
            type="date"
            bind:value={checkOut}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          />
        </div>

        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left">
          <label
            for="hotel-guests"
            class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]"
          >
            Guests
          </label>

          <select
            id="hotel-guests"
            name="guests"
            bind:value={guests}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          >
            <option value="1 guest · 1 room">1 guest · 1 room</option>
            <option value="2 guests · 1 room">2 guests · 1 room</option>
            <option value="3 guests · 1 room">3 guests · 1 room</option>
            <option value="4 guests · 2 rooms">4 guests · 2 rooms</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={hasSubmitted.value && !isValid}
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search hotels
        </button>
      </form>

      {hasSubmitted.value && errors.length > 0 && (
        <div class="mt-3 text-left text-sm text-[color:var(--color-danger)]">
          <ul class="grid gap-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

type HotelSearchCardProps = {
  action?: string
  initialDestination?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: string
}
