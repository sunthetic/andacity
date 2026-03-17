import { component$ } from "@builder.io/qwik";
import type { CarPickupDropoffSummaryModel } from "~/types/car-entity-page";

const LocationCard = component$((props: LocationCardProps) => {
  return (
    <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
      <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
        {props.label}
      </p>
      <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
        {props.locationLabel}
      </p>
      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
        {props.dateTimeLabel}
      </p>
      {props.typeLabel ? (
        <p class="mt-3 text-sm text-[color:var(--color-text)]">
          {props.typeLabel}
        </p>
      ) : null}
      {props.addressLabel ? (
        <p class="mt-1 text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.addressLabel}
        </p>
      ) : null}
    </div>
  );
});

export const CarPickupDropoffSummary = component$(
  (props: CarPickupDropoffSummaryProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
          Rental window
        </p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Pickup and dropoff
        </h2>

        <div class="mt-5 grid gap-4">
          <LocationCard
            label="Pickup"
            locationLabel={props.summary.pickupLocationLabel}
            typeLabel={props.summary.pickupTypeLabel}
            addressLabel={props.summary.pickupAddressLabel}
            dateTimeLabel={props.summary.pickupDateTimeLabel}
          />
          <LocationCard
            label="Dropoff"
            locationLabel={props.summary.dropoffLocationLabel}
            typeLabel={props.summary.dropoffTypeLabel}
            addressLabel={props.summary.dropoffAddressLabel}
            dateTimeLabel={props.summary.dropoffDateTimeLabel}
          />
        </div>

        {props.summary.rentalLengthLabel ? (
          <div class="mt-6 rounded-[24px] border border-[color:var(--color-border)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Rental length
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.rentalLengthLabel}
            </p>
          </div>
        ) : null}
      </section>
    );
  },
);

type CarPickupDropoffSummaryProps = {
  summary: CarPickupDropoffSummaryModel;
};

type LocationCardProps = {
  label: string;
  locationLabel: string;
  typeLabel: string | null;
  addressLabel: string | null;
  dateTimeLabel: string;
};
