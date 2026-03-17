import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from "~/components/booking-surface/SearchFormPrimitives";
import { DateField } from "~/components/ui/DateField";
import { LocationAutosuggestField } from "~/components/ui/LocationAutosuggestField";
import { getTodayIsoDate, normalizeIsoDate } from "~/lib/date/validateDate";
import { addDays } from "~/lib/trips/date-utils";
import { buildCanonicalHotelSearchHref } from "~/lib/search/entry-routes";
import { validateLocationSelection } from "~/lib/location/validateLocationSelection";
import type { CanonicalLocation } from "~/types/location";

export const HotelSearchCard = component$((props: HotelSearchCardProps) => {
  const navigate = useNavigate();
  const destinationLocation = useSignal<CanonicalLocation | null>(
    props.initialDestinationLocation ?? null,
  );
  const destination = useSignal(
    props.initialDestinationLocation?.displayName ||
      props.initialDestination ||
      "",
  );
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
    destinationLocation: destinationLocation.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    guests: guests.value,
  });
  const isValid = errors.length === 0;
  const submitBehavior = props.submitBehavior ?? "form-submit";
  const surface = props.surface ?? "card";

  const content = (
    <>
      <form
        action={props.action ?? "/hotels"}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={async (_, form) => {
          hasSubmitted.value = true;
          const snapshot = readSnapshot(form);
          const submitErrors = validateSnapshot(snapshot);
          if (submitErrors.length) return;

          if (!snapshot.destinationLocation) return;

          destination.value = snapshot.destination;
          destinationLocation.value = snapshot.destinationLocation;
          checkIn.value = snapshot.checkIn;
          checkOut.value = snapshot.checkOut;
          guests.value = snapshot.guests;

          if (submitBehavior === "canonical-route") {
            await navigate(
              buildCanonicalHotelSearchHref({
                destinationLocation: snapshot.destinationLocation,
                checkIn: snapshot.checkIn,
                checkOut: snapshot.checkOut,
                guests: snapshot.guests,
              }),
            );
            return;
          }

          form.submit();
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,2.65fr)_minmax(10rem,0.95fr)_minmax(10rem,0.95fr)_minmax(170px,0.85fr)_auto]"
      >
        <input type="hidden" name="search" value="1" />
        <BookingSearchField label="Destination" forId="hotel-destination">
          <LocationAutosuggestField
            id="hotel-destination"
            name="destination"
            selectionName="destinationLocation"
            value={destination}
            selectedLocation={destinationLocation}
            placeholder="City or airport"
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            ariaLabel="Hotel destination"
            required={true}
          />
        </BookingSearchField>

        <BookingSearchField label="Check-in" forId="hotel-check-in">
          <DateField
            id="hotel-check-in"
            name="checkIn"
            value={checkIn}
            required={true}
            minValue={todayIsoDate}
            class="w-full pr-2"
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
            class="w-full pr-2"
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
    </>
  );

  if (surface === "plain") {
    return content;
  }

  return <BookingSearchSurface>{content}</BookingSearchSurface>;
});

type HotelSearchCardProps = {
  action?: string;
  initialDestination?: string;
  initialDestinationLocation?: CanonicalLocation | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  surface?: "card" | "plain";
  submitBehavior?: "form-submit" | "canonical-route";
};

type HotelSubmitSnapshot = {
  destination: string;
  destinationLocation: CanonicalLocation | null;
  checkIn: string;
  checkOut: string;
  guests: string;
};

const readSnapshot = (form: HTMLFormElement): HotelSubmitSnapshot => {
  const fd = new FormData(form);
  const destinationSelection = validateLocationSelection({
    selection: fd.get("destinationLocation"),
    rawValue: fd.get("destination"),
    required: true,
    fieldLabel: "destination",
    allowedKinds: ["city", "airport"],
  });

  return {
    destination: String(fd.get("destination") || "").trim(),
    destinationLocation: destinationSelection.location,
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

  const destinationSelection = validateLocationSelection({
    selection: snapshot.destinationLocation,
    rawValue: snapshot.destination,
    required: true,
    fieldLabel: "destination",
    allowedKinds: ["city", "airport"],
  });

  if (destinationSelection.error) {
    validationErrors.push(destinationSelection.error);
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
