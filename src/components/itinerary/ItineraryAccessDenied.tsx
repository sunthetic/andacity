import { component$ } from "@builder.io/qwik";

export const ItineraryAccessDenied = component$(
  (props: {
    title?: string;
    message: string;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:rgba(220,38,38,0.16)] bg-[color:rgba(254,242,242,0.96)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "Itinerary access denied"}
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {props.message}
        </p>
      </section>
    );
  },
);
