import { component$, useSignal } from "@builder.io/qwik";
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from "~/components/booking-surface/SearchFormPrimitives";
import { DateField } from "~/components/ui/DateField";
import { getTodayIsoDate, normalizeIsoDate } from "~/lib/date/validateDate";
import { addDays } from "~/lib/trips/date-utils";

export const HotelSearchCard = component$((props: HotelSearchCardProps) => {
  const destination = useSignal(props.initialDestination ?? "");
  const checkIn = useSignal(props.initialCheckIn ?? "");
  const checkOut = useSignal(props.initialCheckOut ?? "");
  const guests = useSignal(props.initialGuests ?? "2 guests · 1 room");
  const hasSubmitted = useSignal(false);
  const todayIsoDate = getTodayIsoDate();
  const tomorrowIsoDate = addDays(todayIsoDate, 1) || todayIsoDate;
  const minimumCheckoutDate =
    addDays(checkIn.value >= todayIsoDate ? checkIn.value : todayIsoDate, 1) ||
    tomorrowIsoDate;

  const errors = validateSnapshot({
    destination: destination.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guests: guests.value,
  });
  const isValid = errors.length === 0;

  return (
    <BookingSearchSurface>
      <form
        action={props.action ?? "/search/hotels/anywhere/1"}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={(_, form) => {
          hasSubmitted.value = true;
          const snapshot = readSnapshot(form);
          const submitErrors = validateSnapshot(snapshot);
          if (submitErrors.length) return;

          destination.value = snapshot.destination;
          checkIn.value = snapshot.checkIn;
          checkOut.value = snapshot.checkOut;
          guests.value = snapshot.guests;

          const destinationToken = toPathToken(snapshot.destination);
          if (!destinationToken) return;

          form.action = `/search/hotels/${encodeURIComponent(destinationToken)}/1`;
          form.submit();
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(180px,0.95fr)_auto]"
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
          <DateField
            id="hotel-check-in"
            name="checkIn"
            value={checkIn}
            required={true}
            minValue={todayIsoDate}
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open check-in date picker"
            overlayLabel="Check-in date picker"
          />
        </BookingSearchField>

        <BookingSearchField label="Check-out" forId="hotel-check-out">
          <DateField
            id="hotel-check-out"
            name="checkOut"
            value={checkOut}
            required={true}
            minValue={minimumCheckoutDate}
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open check-out date picker"
            overlayLabel="Check-out date picker"
            overlayPosition="right"
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
  );
});

type HotelSearchCardProps = {
  action?: string;
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
};

type HotelSubmitSnapshot = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};

const readSnapshot = (form: HTMLFormElement): HotelSubmitSnapshot => {
  const fd = new FormData(form);

  return {
    destination: String(fd.get("destination") || "").trim(),
    checkIn: String(fd.get("checkIn") || "").trim(),
    checkOut: String(fd.get("checkOut") || "").trim(),
    guests: String(fd.get("guests") || "").trim(),
  };
};

const validateSnapshot = (snapshot: HotelSubmitSnapshot) => {
  const validationErrors: string[] = [];
  const checkInDate = normalizeIsoDate(snapshot.checkIn);
  const checkOutDate = normalizeIsoDate(snapshot.checkOut);
  const todayIsoDate = getTodayIsoDate();
  const minimumCheckoutDate =
    addDays(
      checkInDate && checkInDate >= todayIsoDate ? checkInDate : todayIsoDate,
      1,
    ) || todayIsoDate;

  if (!snapshot.destination) {
    validationErrors.push("Enter a destination.");
  }

  if (!checkInDate) {
    validationErrors.push("Select a check-in date.");
  } else if (checkInDate < todayIsoDate) {
    validationErrors.push("Check-in must be today or later.");
  }

  if (!checkOutDate) {
    validationErrors.push("Select a check-out date.");
  } else if (checkOutDate < minimumCheckoutDate) {
    validationErrors.push("Check-out must be at least one day after check-in.");
  }

  return validationErrors;
};

const toPathToken = (value: string) => {
  return String(value || "")
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
};
