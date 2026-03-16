import { component$ } from "@builder.io/qwik";
import { FlightSegmentCard } from "~/components/entities/flights/FlightSegmentCard";
import type { FlightEntitySegmentModel } from "~/types/flight-entity-page";

export const FlightSegmentList = component$((props: FlightSegmentListProps) => {
  return (
    <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
            Segment details
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            Flight segments
          </h2>
          <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
            Each segment is rendered from the normalized canonical entity,
            including layover timing where it can be derived.
          </p>
        </div>

        <p class="text-sm font-semibold text-[color:var(--color-text-muted)]">
          {props.segments.length} segment
          {props.segments.length === 1 ? "" : "s"}
        </p>
      </div>

      <div class="mt-6 grid gap-4">
        {props.segments.map((segment) => (
          <FlightSegmentCard key={segment.id} segment={segment} />
        ))}
      </div>
    </section>
  );
});

type FlightSegmentListProps = {
  segments: FlightEntitySegmentModel[];
};
