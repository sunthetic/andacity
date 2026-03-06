import { component$, useSignal } from '@builder.io/qwik'

export const FlightsSearchCard = component$((props: FlightsSearchCardProps) => {
  const from = useSignal(props.initialFrom ?? '')
  const to = useSignal(props.initialTo ?? '')
  const depart = useSignal(props.initialDepart ?? '')
  const ret = useSignal(props.initialReturn ?? '')
  const travelers = useSignal(props.initialTravelers ?? '1 traveler · Economy')

  return (
    <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-lg)] md:p-4">
      <form
        action={props.action ?? '/search/flights/anywhere/1'}
        method="get"
        class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_1fr_1fr_minmax(200px,1fr)_auto]"
      >
        {/* From */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3">
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
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3">
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
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3">
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
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3">
          <label for="flight-return" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Return
          </label>
          <input
            id="flight-return"
            name="return"
            type="date"
            bind:value={ret}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          />
        </div>

        {/* Travelers */}
        <div class="flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3">
          <label for="flight-travelers" class="text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Travelers
          </label>
          <select
            id="flight-travelers"
            name="travelers"
            bind:value={travelers}
            class="w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none"
          >
            <option>1 traveler · Economy</option>
            <option>2 travelers · Economy</option>
            <option>1 traveler · Business</option>
            <option>1 traveler · First</option>
          </select>
        </div>

        <button
          type="submit"
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary"
        >
          Search flights
        </button>
      </form>
    </div>
  )
})

type FlightsSearchCardProps = {
  action?: string
  initialFrom?: string
  initialTo?: string
  initialDepart?: string
  initialReturn?: string
  initialTravelers?: string
}
