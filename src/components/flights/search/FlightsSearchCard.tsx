import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from "~/components/booking-surface/SearchFormPrimitives";
import { DateField } from "~/components/ui/DateField";
import { LocationAutosuggestField } from "~/components/ui/LocationAutosuggestField";
import {
  normalizeFlightItineraryType,
  type FlightItineraryTypeSlug,
} from "~/lib/search/flights/routing";
import { getTodayIsoDate, normalizeIsoDate } from "~/lib/date/validateDate";
import { addDays } from "~/lib/trips/date-utils";
import { buildCanonicalFlightSearchHref } from "~/lib/search/entry-routes";
import { validateLocationSelection } from "~/lib/location/validateLocationSelection";
import { discoverLocations } from "~/lib/location/searchLocations";
import type { CanonicalLocation } from "~/types/location";

const TRAVELER_OPTIONS = ["1", "2", "3", "4"] as const;
const CABIN_OPTIONS = [
  "economy",
  "premium-economy",
  "business",
  "first",
] as const;

const normalizeTravelerValue = (value: string | null | undefined) => {
  const normalized = String(value || "").trim();
  return TRAVELER_OPTIONS.includes(normalized as (typeof TRAVELER_OPTIONS)[number])
    ? normalized
    : "1";
};

const normalizeCabinValue = (value: string | null | undefined) => {
  const normalized = String(value || "").trim();
  return CABIN_OPTIONS.includes(normalized as (typeof CABIN_OPTIONS)[number])
    ? normalized
    : "economy";
};

const requestCurrentCoordinates = () =>
  new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 300_000,
      },
    );
  });

const resolveDefaultOriginLocation = async () => {
  const coordinates = await requestCurrentCoordinates();
  const discovered = coordinates
    ? await discoverLocations({
        limit: 1,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }).catch(() => [])
    : await discoverLocations({ limit: 1 }).catch(() => []);

  return discovered[0] || null;
};

export const FlightsSearchCard = component$((props: FlightsSearchCardProps) => {
  const fromLocation = useSignal<CanonicalLocation | null>(
    props.initialFromLocation ?? null,
  );
  const toLocation = useSignal<CanonicalLocation | null>(
    props.initialToLocation ?? null,
  );
  const from = useSignal(
    props.initialFromLocation?.displayName || props.initialFrom || "",
  );
  const to = useSignal(
    props.initialToLocation?.displayName || props.initialTo || "",
  );
  const depart = useSignal(props.initialDepart ?? "");
  const ret = useSignal(props.initialReturn ?? "");
  const itineraryType = useSignal<FlightItineraryTypeSlug>(
    normalizeFlightItineraryType(props.initialItineraryType),
  );
  const travelers = useSignal(normalizeTravelerValue(props.initialTravelers));
  const cabin = useSignal(normalizeCabinValue(props.initialCabin));
  const hasSubmitted = useSignal(false);
  const defaultOriginResolution = useSignal<Promise<CanonicalLocation | null> | null>(
    null,
  );
  const todayIsoDate = getTodayIsoDate();
  const tomorrowIsoDate = addDays(todayIsoDate, 1) || todayIsoDate;
  const minimumReturnDate =
    addDays(depart.value >= todayIsoDate ? depart.value : todayIsoDate, 1) ||
    tomorrowIsoDate;

  const renderSnapshot: FlightSubmitSnapshot = {
    from: from.value,
    to: to.value,
    fromLocation: fromLocation.value,
    toLocation: toLocation.value,
    depart: depart.value,
    ret: ret.value,
    itineraryType: itineraryType.value,
    travelers: travelers.value,
    cabin: cabin.value,
  };

  const isRoundTrip = renderSnapshot.itineraryType === "round-trip";
  const errors = validateFlightSubmit(renderSnapshot);
  const surface = props.surface ?? "card";

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const autoResolveOrigin = track(() => props.autoResolveOriginLocation === true);
    const currentFrom = track(() => from.value);
    const currentFromLocation = track(() => fromLocation.value);

    if (
      !autoResolveOrigin ||
      defaultOriginResolution.value ||
      String(currentFrom || "").trim() ||
      currentFromLocation
    ) {
      return;
    }

    const pendingResolution = resolveDefaultOriginLocation()
      .then((location) => {
        if (!location) return null;
        if (String(from.value || "").trim() || fromLocation.value) {
          return location;
        }

        fromLocation.value = location;
        from.value = location.displayName;
        return location;
      })
      .catch(() => null);

    defaultOriginResolution.value = pendingResolution;
  });

  const content = (
    <>
      <form
        action={props.action || "/flights"}
        method="get"
        preventdefault:submit
        noValidate
        onSubmit$={async () => {
          hasSubmitted.value = true;

          let snapshot = readFlightSubmitSnapshotFromState({
            from: from.value,
            to: to.value,
            fromLocation: fromLocation.value,
            toLocation: toLocation.value,
            depart: depart.value,
            ret: ret.value,
            itineraryType: itineraryType.value,
            travelers: travelers.value,
            cabin: cabin.value,
          });

          if (
            props.autoResolveOriginLocation &&
            !snapshot.fromLocation &&
            !String(snapshot.from || "").trim() &&
            defaultOriginResolution.value
          ) {
            const resolvedOrigin = await defaultOriginResolution.value.catch(
              () => null,
            );
            if (resolvedOrigin) {
              snapshot = {
                ...snapshot,
                from: resolvedOrigin.displayName,
                fromLocation: resolvedOrigin,
              };
              from.value = resolvedOrigin.displayName;
              fromLocation.value = resolvedOrigin;
            }
          }

          const submitErrors = validateFlightSubmit(snapshot);
          if (submitErrors.length) {
            return;
          }

          if (!snapshot.fromLocation || !snapshot.toLocation) {
            return;
          }

          from.value = snapshot.from;
          to.value = snapshot.to;
          fromLocation.value = snapshot.fromLocation;
          toLocation.value = snapshot.toLocation;
          depart.value = snapshot.depart;
          ret.value = snapshot.ret;
          itineraryType.value = snapshot.itineraryType;
          travelers.value = normalizeTravelerValue(snapshot.travelers);
          cabin.value = normalizeCabinValue(snapshot.cabin);

          window.location.assign(
            buildCanonicalFlightSearchHref({
              fromLocation: snapshot.fromLocation,
              toLocation: snapshot.toLocation,
              itineraryType: snapshot.itineraryType,
              departDate: snapshot.depart,
              returnDate: snapshot.ret,
              travelers: snapshot.travelers,
              cabin: snapshot.cabin,
            }),
          );
        }}
        class="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(200px,1fr)_auto]"
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

        <BookingSearchField
          label="From"
          forId="flight-from"
          class="md:col-span-2"
        >
          <LocationAutosuggestField
            id="flight-from"
            name="from"
            selectionName="fromLocation"
            value={from}
            selectedLocation={fromLocation}
            placeholder="City or airport"
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            ariaLabel="Origin city or airport"
            required={true}
          />
        </BookingSearchField>

        <BookingSearchField label="To" forId="flight-to" class="md:col-span-2">
          <LocationAutosuggestField
            id="flight-to"
            name="to"
            selectionName="toLocation"
            value={to}
            selectedLocation={toLocation}
            placeholder="City or airport"
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            ariaLabel="Destination city or airport"
            required={true}
          />
        </BookingSearchField>

        <BookingSearchField label="Depart" forId="flight-depart">
          <DateField
            id="flight-depart"
            name="depart"
            value={depart}
            required={true}
            minValue={todayIsoDate}
            class="w-full"
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open departure date picker"
            overlayLabel="Departure date picker"
          />
        </BookingSearchField>

        <BookingSearchField label="Return" forId="flight-return">
          <DateField
            id="flight-return"
            name="return"
            disabled={!isRoundTrip}
            required={isRoundTrip}
            value={ret}
            minValue={minimumReturnDate}
            class="w-full"
            inputClass={BOOKING_SEARCH_CONTROL_CLASS}
            iconLabel="Open return date picker"
            overlayLabel="Return date picker"
            overlayPosition="right"
          />
        </BookingSearchField>

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
          class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary"
        >
          Search flights
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

type FlightsSearchCardProps = {
  action?: string;
  initialFrom?: string;
  initialFromLocation?: CanonicalLocation | null;
  initialTo?: string;
  initialToLocation?: CanonicalLocation | null;
  initialDepart?: string;
  initialReturn?: string;
  initialItineraryType?: FlightItineraryTypeSlug;
  initialTravelers?: string;
  initialCabin?: string;
  surface?: "card" | "plain";
  submitBehavior?: "form-submit" | "canonical-route";
  autoResolveOriginLocation?: boolean;
};

type FlightSubmitSnapshot = {
  from: string;
  to: string;
  fromLocation: CanonicalLocation | null;
  toLocation: CanonicalLocation | null;
  depart: string;
  ret: string;
  itineraryType: FlightItineraryTypeSlug;
  travelers: string;
  cabin: string;
};

const readFlightSubmitSnapshotFromState = (
  input: FlightSubmitSnapshot,
): FlightSubmitSnapshot => ({
  from: String(input.from || "").trim(),
  to: String(input.to || "").trim(),
  fromLocation: input.fromLocation,
  toLocation: input.toLocation,
  depart: String(input.depart || "").trim(),
  ret: String(input.ret || "").trim(),
  itineraryType: normalizeFlightItineraryType(input.itineraryType),
  travelers: normalizeTravelerValue(input.travelers),
  cabin: normalizeCabinValue(input.cabin),
});

const validateFlightSubmit = (snapshot: FlightSubmitSnapshot) => {
  const validationErrors: string[] = [];
  const departDate = normalizeIsoDate(snapshot.depart);
  const returnDate = normalizeIsoDate(snapshot.ret);
  const todayIsoDate = getTodayIsoDate();
  const minimumReturnDate =
    addDays(
      departDate && departDate >= todayIsoDate ? departDate : todayIsoDate,
      1,
    ) || todayIsoDate;

  const isRoundTrip = snapshot.itineraryType === "round-trip";

  const fromSelection = validateLocationSelection({
    selection: snapshot.fromLocation,
    rawValue: snapshot.from,
    required: true,
    fieldLabel: "origin city or airport",
    allowedKinds: ["city", "airport"],
  });
  const toSelection = validateLocationSelection({
    selection: snapshot.toLocation,
    rawValue: snapshot.to,
    required: true,
    fieldLabel: "destination city or airport",
    allowedKinds: ["city", "airport"],
  });

  if (fromSelection.error) {
    validationErrors.push(fromSelection.error);
  }

  if (toSelection.error) {
    validationErrors.push(toSelection.error);
  }

  if (
    fromSelection.location &&
    toSelection.location &&
    fromSelection.location.locationId === toSelection.location.locationId
  ) {
    validationErrors.push("Origin and destination must be different.");
  }

  if (!departDate) {
    validationErrors.push("Select a departure date.");
  } else if (departDate < todayIsoDate) {
    validationErrors.push("Departure must be today or later.");
  }

  if (isRoundTrip && !returnDate) {
    validationErrors.push("Select a return date.");
  } else if (isRoundTrip && returnDate && returnDate < minimumReturnDate) {
    validationErrors.push("Return must be at least one day after departure.");
  }

  return validationErrors;
};
