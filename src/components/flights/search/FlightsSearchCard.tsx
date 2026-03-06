import { component$, useSignal } from '@builder.io/qwik'
import { useNavigate } from '@builder.io/qwik-city'
import {
  buildFlightsSearchPath,
  normalizeFlightItineraryType,
  slugifyLocation,
  type FlightItineraryTypeSlug,
} from '~/lib/search/flights/routing'

export const FlightsSearchCard = component$((props: FlightsSearchCardProps) => {
  const nav = useNavigate()
  const from = useSignal(props.initialFrom ?? '')
  const to = useSignal(props.initialTo ?? '')
  const depart = useSignal(props.initialDepart ?? '')
  const ret = useSignal(props.initialReturn ?? '')
  const itineraryType = useSignal<FlightItineraryTypeSlug>(normalizeFlightItineraryType(props.initialItineraryType))
  const travelers = useSignal(props.initialTravelers ?? '1')
  const cabin = useSignal(props.initialCabin ?? 'economy')
  const hasSubmitted = useSignal(false)

  const fromValue = from.value.trim()
  const toValue = to.value.trim()
  const normalizedFrom = fromValue.toLowerCase()
  const normalizedTo = toValue.toLowerCase()
  const isRoundTrip = itineraryType.value === 'round-trip'

  const errors: string[] = []

  if (!fromValue.trim()) {
    errors.push('Enter an origin city or airport.')
  }

  if (!toValue.trim()) {
    errors.push('Enter a destination city or airport.')
  }

  if (normalizedFrom && normalizedTo && normalizedFrom === normalizedTo) {
    errors.push('Origin and destination must be different.')
  }

  if (!depart.value) {
    errors.push('Select a departure date.')
  }

  if (isRoundTrip && !ret.value) {
    errors.push('Select a return date.')
  }

  if (isRoundTrip && depart.value && ret.value && ret.value < depart.value) {
    errors.push('Return must be on or after departure.')
  }

  const isValid = errors.length === 0

  return (
    <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-lg)] md:p-4">
      <form
        action={props.action}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={async () => {
          hasSubmitted.value = true
          if (!isValid) {
            return
          }

          const fromLocationSlug = slugifyLocation(fromValue)
          const toLocationSlug = slugifyLocation(toValue)

          if (!fromLocationSlug || !toLocationSlug) {
            return
          }

          const routePath = buildFlightsSearchPath(fromLocationSlug, toLocationSlug, itineraryType.value, 1)
          const searchParams = new URLSearchParams()
          searchParams.set('depart', depart.value)

          if (isRoundTrip && ret.value) {
            searchParams.set('return', ret.value)
          }

          if (travelers.value) {
            searchParams.set('travelers', travelers.value)
          }

          if (cabin.value) {
            searchParams.set('cabin', cabin.value)
          }

          const query = searchParams.toString()
          const href = query ? `${routePath}?${query}` : routePath
          await nav(href)
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_1fr_1fr_minmax(200px,1fr)_auto]"
      >
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-2">
          <label
            for="flight-itinerary-type"
            class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]"
          >
            Trip type
          </label>
          <select
            id="flight-itinerary-type"
            name="itineraryType"
            bind:value={itineraryType}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          >
            <option value="round-trip">Round-trip</option>
            <option value="one-way">One-way</option>
          </select>
        </div>

        {/* From */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-2">
          <label for="flight-from" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            From
          </label>
          <input
            id="flight-from"
            name="from"
            type="text"
            bind:value={from}
            placeholder="City or airport"
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-text-muted)]"
          />
        </div>

        {/* To */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-2">
          <label for="flight-to" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            To
          </label>
          <input
            id="flight-to"
            name="to"
            type="text"
            bind:value={to}
            placeholder="City or airport"
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-text-muted)]"
          />
        </div>

        {/* Depart */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-1">
          <label for="flight-depart" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Depart
          </label>
          <input
            id="flight-depart"
            name="depart"
            type="date"
            bind:value={depart}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          />
        </div>

        {/* Return */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-1">
          <label for="flight-return" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Return
          </label>
          <input
            id="flight-return"
            name="return"
            type="date"
            bind:value={ret}
            disabled={!isRoundTrip}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          />
        </div>

        {/* Travelers */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-1">
          <label for="flight-travelers" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Travelers
          </label>
          <select
            id="flight-travelers"
            name="travelers"
            bind:value={travelers}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          >
            <option value="1">1 traveler</option>
            <option value="2">2 travelers</option>
            <option value="3">3 travelers</option>
            <option value="4">4 travelers</option>
          </select>
        </div>

        {/* Cabin */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 md:col-span-1">
          <label for="flight-cabin" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Cabin
          </label>
          <select
            id="flight-cabin"
            name="cabin"
            bind:value={cabin}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          >
            <option value="economy">Economy</option>
            <option value="premium-economy">Premium economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={hasSubmitted.value && !isValid}
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search flights
        </button>
      </form>

      {hasSubmitted.value && errors.length > 0 ? (
        <div class="mt-3 text-left text-sm text-[color:var(--color-danger-600,var(--color-text-danger))]">
          <ul class="grid gap-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
})

type FlightsSearchCardProps = {
  action?: string
  initialFrom?: string
  initialTo?: string
  initialDepart?: string
  initialReturn?: string
  initialItineraryType?: FlightItineraryTypeSlug
  initialTravelers?: string
  initialCabin?: string
}
