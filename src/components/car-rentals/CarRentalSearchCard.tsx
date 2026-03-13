import { component$, useSignal } from "@builder.io/qwik";
import {
  BOOKING_SEARCH_CONTROL_CLASS,
  BookingSearchField,
  BookingSearchSurface,
  BookingValidationSummary,
} from "~/components/booking-surface/SearchFormPrimitives";
import { DateField } from "~/components/ui/DateField";
import { normalizeIsoDate } from "~/lib/date/validateDate";

export const CarRentalSearchCard = component$(
  (props: CarRentalSearchCardProps) => {
    const variant = props.variant || "stacked";
    const destination = useSignal(props.destinationValue ?? "");
    const pickupDate = useSignal(props.pickupDate ?? "");
    const dropoffDate = useSignal(props.dropoffDate ?? "");
    const drivers = useSignal(props.drivers ?? "1");
    const hasSubmitted = useSignal(false);
    const errors = validateSnapshot({
      destination: destination.value,
      pickupDate: pickupDate.value,
      dropoffDate: dropoffDate.value,
      drivers: drivers.value,
    });
    const isValid = errors.length === 0;

    return (
      <BookingSearchSurface title={props.title}>
        <form
          method="get"
          action={props.action || "/search/car-rentals/anywhere/1"}
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
            pickupDate.value = snapshot.pickupDate;
            dropoffDate.value = snapshot.dropoffDate;
            drivers.value = snapshot.drivers;

            const normalizedDestination = snapshot.destination.trim();
            formEl.action = `/search/car-rentals/${encodeURIComponent(normalizedDestination)}/1`;
            formEl.submit();
          }}
          class={
            variant === "hero"
              ? "grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(180px,0.95fr)_auto]"
              : "grid gap-3"
          }
        >
          <BookingSearchField
            label="Destination"
            forId="car-rental-destination"
          >
            <input
              id="car-rental-destination"
              name="q"
              class={BOOKING_SEARCH_CONTROL_CLASS}
              placeholder={props.destinationPlaceholder || "e.g., Las Vegas"}
              bind:value={destination}
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
                  inputClass={BOOKING_SEARCH_CONTROL_CLASS}
                  iconLabel="Open dropoff date picker"
                  overlayLabel="Dropoff date picker"
                  overlayPosition="right"
                />
              </BookingSearchField>
            </>
          ) : (
            <div class="grid grid-cols-2 gap-3">
              <BookingSearchField label="Pickup" forId="car-rental-pickup">
                <DateField
                  id="car-rental-pickup"
                  name="pickupDate"
                  value={pickupDate}
                  required={true}
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
  destinationPlaceholder?: string;
  pickupDate?: string;
  dropoffDate?: string;
  drivers?: string;
  submitLabel?: string;
  helperText?: string;
};

type CarRentalSubmitSnapshot = {
  destination: string;
  pickupDate: string;
  dropoffDate: string;
  drivers: string;
};

const readSnapshot = (form: HTMLFormElement): CarRentalSubmitSnapshot => {
  const fd = new FormData(form);
  return {
    destination: String(fd.get("q") || "").trim(),
    pickupDate: String(fd.get("pickupDate") || "").trim(),
    dropoffDate: String(fd.get("dropoffDate") || "").trim(),
    drivers: String(fd.get("drivers") || "").trim(),
  };
};

const validateSnapshot = (snapshot: CarRentalSubmitSnapshot) => {
  const validationErrors: string[] = [];
  const pickupIsoDate = normalizeIsoDate(snapshot.pickupDate);
  const dropoffIsoDate = normalizeIsoDate(snapshot.dropoffDate);

  if (!snapshot.destination) {
    validationErrors.push("Enter a pickup location.");
  }

  if (!pickupIsoDate) {
    validationErrors.push("Select a pickup date.");
  }

  if (!dropoffIsoDate) {
    validationErrors.push("Select a dropoff date.");
  }

  if (pickupIsoDate && dropoffIsoDate && dropoffIsoDate <= pickupIsoDate) {
    validationErrors.push("Dropoff must be after pickup.");
  }

  return validationErrors;
};
