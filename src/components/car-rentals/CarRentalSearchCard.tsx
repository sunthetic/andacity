import { component$, useSignal } from '@builder.io/qwik'

export const CarRentalSearchCard = component$((props: CarRentalSearchCardProps) => {
  const variant = props.variant || 'stacked'
  const destination = useSignal(props.destinationValue ?? '')
  const pickupDate = useSignal(props.pickupDate ?? '')
  const dropoffDate = useSignal(props.dropoffDate ?? '')
  const drivers = useSignal(props.drivers ?? '1')
  const hasSubmitted = useSignal(false)
  const errors = validateSnapshot({
    destination: destination.value,
    pickupDate: pickupDate.value,
    dropoffDate: dropoffDate.value,
    drivers: drivers.value,
  })
  const isValid = errors.length === 0

  const fieldClass =
    'flex min-h-[3.25rem] flex-col justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 text-left'
  const labelClass =
    'text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]'
  const inputClass =
    'w-full bg-transparent text-sm text-[color:var(--color-text-strong)] outline-none placeholder:text-[color:var(--color-text-muted)]'

  return (
    <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-lg)] md:p-4">
      {props.title ? (
        <div class="mb-3 text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</div>
      ) : null}

      <form
        method="get"
        action={props.action || '/search/car-rentals/anywhere/1'}
        preventdefault:submit
        noValidate
        onSubmit$={async (_, formEl) => {
          hasSubmitted.value = true
          const snapshot = readSnapshot(formEl)
          const submitErrors = validateSnapshot(snapshot)
          if (submitErrors.length) {
            return
          }

          destination.value = snapshot.destination
          pickupDate.value = snapshot.pickupDate
          dropoffDate.value = snapshot.dropoffDate
          drivers.value = snapshot.drivers

          const normalizedDestination = snapshot.destination.trim()
          formEl.action = `/search/car-rentals/${encodeURIComponent(normalizedDestination)}/1`
          formEl.submit()
        }}
        class={variant === 'hero'
          ? 'grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(180px,0.95fr)_auto]'
          : 'grid gap-3'}
      >
        <div class={fieldClass}>
          <label for="car-rental-destination" class={labelClass}>
            Destination
          </label>
          <input
            id="car-rental-destination"
            name="q"
            class={inputClass}
            placeholder={props.destinationPlaceholder || 'e.g., Las Vegas'}
            bind:value={destination}
            required
          />
        </div>

        {variant === 'hero' ? (
          <>
            <div class={fieldClass}>
              <label for="car-rental-pickup" class={labelClass}>
                Pickup
              </label>
              <input
                id="car-rental-pickup"
                name="pickupDate"
                type="date"
                class={inputClass}
                placeholder="YYYY-MM-DD"
                bind:value={pickupDate}
                required
              />
            </div>

            <div class={fieldClass}>
              <label for="car-rental-dropoff" class={labelClass}>
                Dropoff
              </label>
              <input
                id="car-rental-dropoff"
                name="dropoffDate"
                type="date"
                class={inputClass}
                placeholder="YYYY-MM-DD"
                bind:value={dropoffDate}
                required
              />
            </div>
          </>
        ) : (
          <div class="grid grid-cols-2 gap-3">
            <div class={fieldClass}>
              <label for="car-rental-pickup" class={labelClass}>
                Pickup
              </label>
              <input
                id="car-rental-pickup"
                name="pickupDate"
                type="date"
                class={inputClass}
                placeholder="YYYY-MM-DD"
                bind:value={pickupDate}
                required
              />
            </div>

            <div class={fieldClass}>
              <label for="car-rental-dropoff" class={labelClass}>
                Dropoff
              </label>
              <input
                id="car-rental-dropoff"
                name="dropoffDate"
                type="date"
                class={inputClass}
                placeholder="YYYY-MM-DD"
                bind:value={dropoffDate}
                required
              />
            </div>
          </div>
        )}

        <div class={fieldClass}>
          <label for="car-rental-drivers" class={labelClass}>
            Drivers
          </label>
          <select
            id="car-rental-drivers"
            name="drivers"
            class={inputClass}
            bind:value={drivers}
          >
            <option value="1">1 driver</option>
            <option value="2">2 drivers</option>
            <option value="3">3 drivers</option>
            <option value="4">4 drivers</option>
          </select>
        </div>

        <button
          disabled={hasSubmitted.value && !isValid}
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {props.submitLabel || 'Search car rentals'}
        </button>

        {props.helperText ? (
          <div class={variant === 'hero'
            ? 'text-left text-xs text-[color:var(--color-text-muted)] md:col-span-full'
            : 'text-xs text-[color:var(--color-text-muted)]'}
          >
            {props.helperText}
          </div>
        ) : null}
      </form>

      {hasSubmitted.value && errors.length > 0 ? (
        <div class="mt-3 text-left text-sm text-[color:var(--color-danger)]">
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

/* -----------------------------
  Types
----------------------------- */

type CarRentalSearchCardProps = {
  title?: string
  action?: string
  variant?: 'hero' | 'stacked'
  destinationValue?: string
  destinationPlaceholder?: string
  pickupDate?: string
  dropoffDate?: string
  drivers?: string
  submitLabel?: string
  helperText?: string
}

type CarRentalSubmitSnapshot = {
  destination: string
  pickupDate: string
  dropoffDate: string
  drivers: string
}

const readSnapshot = (form: HTMLFormElement): CarRentalSubmitSnapshot => {
  const fd = new FormData(form)
  return {
    destination: String(fd.get('q') || '').trim(),
    pickupDate: String(fd.get('pickupDate') || '').trim(),
    dropoffDate: String(fd.get('dropoffDate') || '').trim(),
    drivers: String(fd.get('drivers') || '').trim(),
  }
}

const validateSnapshot = (snapshot: CarRentalSubmitSnapshot) => {
  const validationErrors: string[] = []

  if (!snapshot.destination) {
    validationErrors.push('Enter a pickup location.')
  }

  if (!snapshot.pickupDate) {
    validationErrors.push('Select a pickup date.')
  }

  if (!snapshot.dropoffDate) {
    validationErrors.push('Select a dropoff date.')
  }

  if (
    snapshot.pickupDate &&
    snapshot.dropoffDate &&
    snapshot.dropoffDate <= snapshot.pickupDate
  ) {
    validationErrors.push('Dropoff must be after pickup.')
  }

  return validationErrors
}
