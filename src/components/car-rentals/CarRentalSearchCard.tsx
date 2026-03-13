import { component$, useSignal } from "@builder.io/qwik";
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
import { validateLocationSelection } from "~/lib/location/validateLocationSelection";
import type { CanonicalLocation } from "~/types/location";

export const CarRentalSearchCard = component$(
  (props: CarRentalSearchCardProps) => {
    const variant = props.variant || "stacked";
    const pickupLocation = useSignal<CanonicalLocation | null>(
      props.initialPickupLocation ?? null,
    );
    const destination = useSignal(
      props.initialPickupLocation?.displayName || props.destinationValue || "",
    );
    const pickupDate = useSignal(props.pickupDate ?? "");
    const dropoffDate = useSignal(props.dropoffDate ?? "");
    const drivers = useSignal(props.drivers ?? "1");
    const hasSubmitted = useSignal(false);
    const todayIsoDate = getTodayIsoDate();
    const tomorrowIsoDate = addDays(todayIsoDate, 1) || todayIsoDate;
    const minimumDropoffDate =
      addDays(
        pickupDate.value >= todayIsoDate ? pickupDate.value : todayIsoDate,
        1,
      ) || tomorrowIsoDate;
    const errors = validateSnapshot({
      destination: destination.value,
      pickupLocation: pickupLocation.value,
      pickupDate: pickupDate.value,
      dropoffDate: dropoffDate.value,
      drivers: drivers.value,
    });
    const isValid = errors.length === 0;

    return (
      <BookingSearchSurface title={props.title}>
        <form
          method="get"
          action={props.action || "/car-rentals"}
          preventdefault:submit
          noValidate
          onSubmit$={async (_, formEl) => {
            hasSubmitted.value = true;
            const snapshot = readSnapshot(formEl);
            const submitErrors = validateSnapshot(snapshot);
            if (submitErrors.length) {
              return;
            }

            destination.value = snapshot.destination;
            pickupLocation.value = snapshot.pickupLocation;
            pickupDate.value = snapshot.pickupDate;
            dropoffDate.value = snapshot.dropoffDate;
            drivers.value = snapshot.drivers;
            formEl.submit();
          }}
          class={
            variant === "hero"
              ? "grid gap-3 md:grid-cols-[minmax(0,2.65fr)_minmax(10rem,0.95fr)_minmax(10rem,0.95fr)_minmax(170px,0.85fr)_auto]"
              : "grid gap-3"
          }
        >
          <input type="hidden" name="search" value="1" />
          <BookingSearchField
            label="Pickup location"
            forId="car-rental-destination"
          >
            <LocationAutosuggestField
              id="car-rental-destination"
              name="q"
              selectionName="pickupLocation"
              value={destination}
              selectedLocation={pickupLocation}
              inputClass={BOOKING_SEARCH_CONTROL_CLASS}
              placeholder={props.destinationPlaceholder || "e.g., Las Vegas"}
              ariaLabel="Car rental pickup location"
              required
            />
          </BookingSearchField>

          {variant === "hero" ? (
            <>
              <BookingSearchField label="Pickup" forId="car-rental-pickup">
                <DateField
                  id="car-rental-pickup"
                  name="pickupDate"
                  value={pickupDate}
                  required={true}
                  minValue={todayIsoDate}
                  class="w-full pr-2"
                  inputClass={BOOKING_SEARCH_CONTROL_CLASS}
                  iconLabel="Open pickup date picker"
                  overlayLabel="Pickup date picker"
                />
              </BookingSearchField>

              <BookingSearchField label="Dropoff" forId="car-rental-dropoff">
                <DateField
                  id="car-rental-dropoff"
                  name="dropoffDate"
                  value={dropoffDate}
                  required={true}
                  minValue={minimumDropoffDate}
                  class="w-full pr-2"
                  inputClass={BOOKING_SEARCH_CONTROL_CLASS}
                  iconLabel="Open dropoff date picker"
                  overlayLabel="Dropoff date picker"
                  overlayPosition="right"
                />
              </BookingSearchField>
            </>
          ) : (
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BookingSearchField label="Pickup" forId="car-rental-pickup">
                <DateField
                  id="car-rental-pickup"
                  name="pickupDate"
                  value={pickupDate}
                  required={true}
                  minValue={todayIsoDate}
                  inputClass={BOOKING_SEARCH_CONTROL_CLASS}
                  iconLabel="Open pickup date picker"
                  overlayLabel="Pickup date picker"
                />
              </BookingSearchField>

              <BookingSearchField label="Dropoff" forId="car-rental-dropoff">
                <DateField
                  id="car-rental-dropoff"
                  name="dropoffDate"
                  value={dropoffDate}
                  required={true}
                  minValue={minimumDropoffDate}
                  inputClass={BOOKING_SEARCH_CONTROL_CLASS}
                  iconLabel="Open dropoff date picker"
                  overlayLabel="Dropoff date picker"
                  overlayPosition="right"
                />
              </BookingSearchField>
            </div>
          )}

          <BookingSearchField label="Drivers" forId="car-rental-drivers">
            <select
              id="car-rental-drivers"
              name="drivers"
              class={BOOKING_SEARCH_CONTROL_CLASS}
              bind:value={drivers}
            >
              <option value="1">1 driver</option>
              <option value="2">2 drivers</option>
              <option value="3">3 drivers</option>
              <option value="4">4 drivers</option>
            </select>
          </BookingSearchField>

          <button
            disabled={hasSubmitted.value && !isValid}
            class="inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-lg)] px-5 text-sm font-semibold t-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            {props.submitLabel || "Search car rentals"}
          </button>

          {props.helperText ? (
            <div
              class={
                variant === "hero"
                  ? "text-left text-xs text-[color:var(--color-text-muted)] md:col-span-full"
                  : "text-xs text-[color:var(--color-text-muted)]"
              }
            >
              {props.helperText}
            </div>
          ) : null}
        </form>

        <BookingValidationSummary errors={errors} show={hasSubmitted.value} />
      </BookingSearchSurface>
    );
  },
);

/* -----------------------------
  Types
----------------------------- */

type CarRentalSearchCardProps = {
  title?: string;
  action?: string;
  variant?: "hero" | "stacked";
  destinationValue?: string;
  initialPickupLocation?: CanonicalLocation | null;
  destinationPlaceholder?: string;
  pickupDate?: string;
  dropoffDate?: string;
  drivers?: string;
  submitLabel?: string;
  helperText?: string;
};

type CarRentalSubmitSnapshot = {
  destination: string;
  pickupLocation: CanonicalLocation | null;
  pickupDate: string;
  dropoffDate: string;
  drivers: string;
};

const readSnapshot = (form: HTMLFormElement): CarRentalSubmitSnapshot => {
  const fd = new FormData(form);
  const pickupSelection = validateLocationSelection({
    selection: fd.get("pickupLocation"),
    rawValue: fd.get("q"),
    required: true,
    fieldLabel: "pickup location",
    allowedKinds: ["city", "airport"],
  });
  return {
    destination: String(fd.get("q") || "").trim(),
    pickupLocation: pickupSelection.location,
    pickupDate: String(fd.get("pickupDate") || "").trim(),
    dropoffDate: String(fd.get("dropoffDate") || "").trim(),
    drivers: String(fd.get("drivers") || "").trim(),
  };
};

const validateSnapshot = (snapshot: CarRentalSubmitSnapshot) => {
  const validationErrors: string[] = [];
  const pickupIsoDate = normalizeIsoDate(snapshot.pickupDate);
  const dropoffIsoDate = normalizeIsoDate(snapshot.dropoffDate);
  const todayIsoDate = getTodayIsoDate();
  const minimumDropoffDate =
    addDays(
      pickupIsoDate && pickupIsoDate >= todayIsoDate
        ? pickupIsoDate
        : todayIsoDate,
      1,
    ) || todayIsoDate;

  if (!snapshot.pickupLocation) {
    validationErrors.push("Choose a pickup location from the suggestions.");
  }

  if (!pickupIsoDate) {
    validationErrors.push("Select a pickup date.");
  } else if (pickupIsoDate < todayIsoDate) {
    validationErrors.push("Pickup must be today or later.");
  }

  if (!dropoffIsoDate) {
    validationErrors.push("Select a dropoff date.");
  } else if (dropoffIsoDate < minimumDropoffDate) {
    validationErrors.push("Dropoff must be at least one day after pickup.");
  }

  return validationErrors;
};
