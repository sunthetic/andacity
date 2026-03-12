import { component$, useSignal } from '@builder.io/qwik'
import { buildHotelsSrpPath } from '~/lib/search/hotels/canonical'
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from '~/components/booking-surface/SearchFormPrimitives'

export const HotelSearchCard = component$((props: HotelSearchCardProps) => {
  const destination = useSignal(props.initialDestination ?? '')
  const checkIn = useSignal(props.initialCheckIn ?? '')
  const checkOut = useSignal(props.initialCheckOut ?? '')
  const guests = useSignal(props.initialGuests ?? '2 guests · 1 room')
  const hasSubmitted = useSignal(false)

  const errors = validateSnapshot({
    destination: destination.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guests: guests.value,
  })
  const isValid = errors.length === 0

  return (
    <BookingSearchSurface>
      <form
        action={props.action ?? '/hotels'}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={(_, form) => {
          hasSubmitted.value = true
          const snapshot = readSnapshot(form)
          const submitErrors = validateSnapshot(snapshot)
          if (submitErrors.length) return

          destination.value = snapshot.destination
          checkIn.value = snapshot.checkIn
          checkOut.value = snapshot.checkOut
          guests.value = snapshot.guests

          const destinationToken = toPathToken(snapshot.destination)
          if (!destinationToken) return

          const target = buildHotelsSrpPath({
            citySlug: destinationToken,
            checkIn: snapshot.checkIn,
            checkOut: snapshot.checkOut,
            pageNumber: 1,
          })

          if (!target) return

          const qs = new URLSearchParams()
          if (snapshot.guests) qs.set('guests', snapshot.guests)

          form.action = qs.toString() ? `${target}?${qs.toString()}` : target
          form.submit()
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(180px,0.95fr)_auto]"
      >
        <BookingSearchField label="Destination" forId="hotel-destination">
          <input
            id="hotel-destination"
            name="destination"
            type="text"
            bind:value={destination}
            placeholder="City, neighborhood, or hotel"
            class={BOOKING_SEARCH_CONTROL_CLASS}
          />
        </BookingSearchField>

        <BookingSearchField label="Check-in" forId="hotel-check-in">
          <input
            id="hotel-check-in"
            name="checkIn"
            type="date"
            bind:value={checkIn}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          />
        </BookingSearchField>

        <BookingSearchField label="Check-out" forId="hotel-check-out">
          <input
            id="hotel-check-out"
            name="checkOut"
            type="date"
            bind:value={checkOut}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          />
        </BookingSearchField>

        <BookingSearchField label="Guests" forId="hotel-guests">
          <select
            id="hotel-guests"
            name="guests"
            bind:value={guests}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          >
            <option value="1 guest · 1 room">1 guest · 1 room</option>
            <option value="2 guests · 1 room">2 guests · 1 room</option>
            <option value="3 guests · 1 room">3 guests · 1 room</option>
            <option value="4 guests · 2 rooms">4 guests · 2 rooms</option>
          </select>
        </BookingSearchField>

        <button
          type="submit"
          disabled={hasSubmitted.value && !isValid}
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search hotels
        </button>
      </form>

      <BookingValidationSummary errors={errors} show={hasSubmitted.value} />
    </BookingSearchSurface>
  )
})

type HotelSearchCardProps = {
  action?: string
  initialDestination?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: string
}

type HotelSubmitSnapshot = {
  destination: string
  checkIn: string
  checkOut: string
  guests: string
}

const readSnapshot = (form: HTMLFormElement): HotelSubmitSnapshot => {
  const fd = new FormData(form)

  return {
    destination: String(fd.get('destination') || '').trim(),
    checkIn: String(fd.get('checkIn') || '').trim(),
    checkOut: String(fd.get('checkOut') || '').trim(),
    guests: String(fd.get('guests') || '').trim(),
  }
}

const validateSnapshot = (snapshot: HotelSubmitSnapshot) => {
  const validationErrors: string[] = []

  if (!snapshot.destination) {
    validationErrors.push('Enter a destination.')
  }

  if (!snapshot.checkIn) {
    validationErrors.push('Select a check-in date.')
  }

  if (!snapshot.checkOut) {
    validationErrors.push('Select a check-out date.')
  }

  if (snapshot.checkIn && snapshot.checkOut && snapshot.checkOut <= snapshot.checkIn) {
    validationErrors.push('Check-out must be after check-in.')
  }

  return validationErrors
}

const toPathToken = (value: string) => {
  return String(value || '')
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')
}
