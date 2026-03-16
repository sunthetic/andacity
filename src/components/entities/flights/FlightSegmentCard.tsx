import { component$ } from "@builder.io/qwik";
import type { FlightEntitySegmentModel } from "~/types/flight-entity-page";

export const FlightSegmentCard = component$((props: FlightSegmentCardProps) => {
  const segment = props.segment;

  return (
    <article class="rounded-[24px] border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            {segment.segmentLabel}
          </p>
          <h3 class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
            {segment.flightNumberLabel}
          </h3>
          <p class="mt-1 text-sm text-[color:var(--color-text)]">
            {segment.airlineLabel}
          </p>
          {segment.operatingAirlineLabel ? (
            <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Operated by {segment.operatingAirlineLabel}
            </p>
          ) : null}
        </div>

        <div class="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]">
          {segment.durationLabel}
        </div>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-[1fr,1fr]">
        <div class="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Departure
          </p>
          <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
            {segment.departureAirportLabel}
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {segment.departureTimeLabel}
          </p>
        </div>

        <div class="rounded-2xl bg-[color:var(--color-surface-muted)] px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Arrival
          </p>
          <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
            {segment.arrivalAirportLabel}
          </p>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            {segment.arrivalTimeLabel}
          </p>
        </div>
      </div>

      {segment.aircraftLabel ? (
        <p class="mt-4 text-xs text-[color:var(--color-text-muted)]">
          Aircraft: {segment.aircraftLabel}
        </p>
      ) : null}

      {segment.layoverAfterLabel ? (
        <p class="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text)]">
          {segment.layoverAfterLabel}
        </p>
      ) : null}
    </article>
  );
});

type FlightSegmentCardProps = {
  segment: FlightEntitySegmentModel;
};
