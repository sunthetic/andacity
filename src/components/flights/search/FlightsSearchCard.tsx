import { component$, useSignal } from "@builder.io/qwik";
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from "~/components/booking-surface/SearchFormPrimitives";
import { DateField } from "~/components/ui/DateField";
import {
  normalizeFlightItineraryType,
  slugifyLocation,
  type FlightItineraryTypeSlug,
} from "~/lib/search/flights/routing";
import { normalizeIsoDate } from "~/lib/date/validateDate";

export const FlightsSearchCard = component$((props: FlightsSearchCardProps) => {
  const from = useSignal(props.initialFrom ?? "");
  const to = useSignal(props.initialTo ?? "");
  const depart = useSignal(props.initialDepart ?? "");
  const ret = useSignal(props.initialReturn ?? "");
  const itineraryType = useSignal<FlightItineraryTypeSlug>(
    normalizeFlightItineraryType(props.initialItineraryType),
  );
  const travelers = useSignal(props.initialTravelers ?? "1");
  const cabin = useSignal(props.initialCabin ?? "economy");
  const hasSubmitted = useSignal(false);

  const renderSnapshot: FlightSubmitSnapshot = {
    from: from.value,
    to: to.value,
    depart: depart.value,
    ret: ret.value,
    itineraryType: itineraryType.value,
    travelers: travelers.value,
    cabin: cabin.value,
  };

  const isRoundTrip = renderSnapshot.itineraryType === "round-trip";
  const errors = validateFlightSubmit(renderSnapshot);

  const isValid = errors.length === 0;

  return (
    <BookingSearchSurface>
      <form
        action={props.action || "/flights"}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={(_, formEl) => {
          hasSubmitted.value = true;

          const snapshot = readFlightSubmitSnapshot(formEl);
          const submitErrors = validateFlightSubmit(snapshot);
          if (submitErrors.length) {
            return;
          }

          from.value = snapshot.from;
          to.value = snapshot.to;
          depart.value = snapshot.depart;
          ret.value = snapshot.ret;
          itineraryType.value = snapshot.itineraryType;
          travelers.value = snapshot.travelers;
          cabin.value = snapshot.cabin;

          const fromLocationSlug = slugifyLocation(snapshot.from);
          const toLocationSlug = slugifyLocation(snapshot.to);

          if (!fromLocationSlug || !toLocationSlug) {
            return;
          }

          formEl.submit();
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_1fr_1fr_minmax(200px,1fr)_auto]"
      >
        <input type="hidden" name="search" value="1" />
        <BookingSearchField
          label="Trip type"
          forId="flight-itinerary-type"
          class="md:col-span-2"
        >
          <select
            id="flight-itinerary-type"
            name="itineraryType"
            bind:value={itineraryType}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          >
            <option value="round-trip">Round-trip</option>
            <option value="one-way">One-way</option>
          </select>
        </BookingSearchField>

        {/* From */}
        <BookingSearchField
          label="From"
          forId="flight-from"
          class="md:col-span-2"
        >
          <input
            id="flight-from"
            name="from"
            type="text"
            bind:value={from}
            placeholder="City or airport"
            class={BOOKING_SEARCH_CONTROL_CLASS}
          />
        </BookingSearchField>

        {/* To */}
        <BookingSearchField label="To" forId="flight-to" class="md:col-span-2">
          <input
            id="flight-to"
            name="to"
            type="text"
            bind:value={to}
            placeholder="City or airport"
            class={BOOKING_SEARCH_CONTROL_CLASS}
          />
        </BookingSearchField>

        {/* Depart */}
        <BookingSearchField label="Depart" forId="flight-depart">
          <DateField
            id="flight-depart"
            name="depart"
            value={depart}
            required={true}
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open departure date picker"
            overlayLabel="Departure date picker"
          />
        </BookingSearchField>

        {/* Return */}
        <BookingSearchField label="Return" forId="flight-return">
          <DateField
            id="flight-return"
            name="return"
            disabled={!isRoundTrip}
            required={isRoundTrip}
            value={ret}
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open return date picker"
            overlayLabel="Return date picker"
            overlayPosition="right"
          />
        </BookingSearchField>

        {/* Travelers */}
        <BookingSearchField label="Travelers" forId="flight-travelers">
          <select
            id="flight-travelers"
            name="travelers"
            bind:value={travelers}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          >
            <option value="1">1 traveler</option>
            <option value="2">2 travelers</option>
            <option value="3">3 travelers</option>
            <option value="4">4 travelers</option>
          </select>
        </BookingSearchField>

        {/* Cabin */}
        <BookingSearchField label="Cabin" forId="flight-cabin">
          <select
            id="flight-cabin"
            name="cabin"
            bind:value={cabin}
            class={BOOKING_SEARCH_CONTROL_CLASS}
          >
            <option value="economy">Economy</option>
            <option value="premium-economy">Premium economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </BookingSearchField>

        <button
          type="submit"
          disabled={hasSubmitted.value && !isValid}
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Search flights
        </button>
      </form>

      <BookingValidationSummary errors={errors} show={hasSubmitted.value} />
    </BookingSearchSurface>
  );
});

type FlightsSearchCardProps = {
  action?: string;
  initialFrom?: string;
  initialTo?: string;
  initialDepart?: string;
  initialReturn?: string;
  initialItineraryType?: FlightItineraryTypeSlug;
  initialTravelers?: string;
  initialCabin?: string;
};

type FlightSubmitSnapshot = {
  from: string;
  to: string;
  depart: string;
  ret: string;
  itineraryType: FlightItineraryTypeSlug;
  travelers: string;
  cabin: string;
};

const readFlightSubmitSnapshot = (
  form: HTMLFormElement,
): FlightSubmitSnapshot => {
  const fd = new FormData(form);

  return {
    from: String(fd.get("from") || "").trim(),
    to: String(fd.get("to") || "").trim(),
    depart: String(fd.get("depart") || "").trim(),
    ret: String(fd.get("return") || "").trim(),
    itineraryType: normalizeFlightItineraryType(
      String(fd.get("itineraryType") || "").trim(),
    ),
    travelers: String(fd.get("travelers") || "").trim(),
    cabin: String(fd.get("cabin") || "").trim(),
  };
};

const validateFlightSubmit = (snapshot: FlightSubmitSnapshot) => {
  const validationErrors: string[] = [];
  const departDate = normalizeIsoDate(snapshot.depart);
  const returnDate = normalizeIsoDate(snapshot.ret);

  const normalizedFrom = snapshot.from.toLowerCase();
  const normalizedTo = snapshot.to.toLowerCase();
  const isRoundTrip = snapshot.itineraryType === "round-trip";

  if (!snapshot.from) {
    validationErrors.push("Enter an origin city or airport.");
  }

  if (!snapshot.to) {
    validationErrors.push("Enter a destination city or airport.");
  }

  if (normalizedFrom && normalizedTo && normalizedFrom === normalizedTo) {
    validationErrors.push("Origin and destination must be different.");
  }

  if (!departDate) {
    validationErrors.push("Select a departure date.");
  }

  if (isRoundTrip && !returnDate) {
    validationErrors.push("Select a return date.");
  }

  if (isRoundTrip && departDate && returnDate && returnDate < departDate) {
    validationErrors.push("Return must be on or after departure.");
  }

  return validationErrors;
};
