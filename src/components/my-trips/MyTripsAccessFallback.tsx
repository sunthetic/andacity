import { component$ } from "@builder.io/qwik";

export const MyTripsAccessFallback = component$(
  (props: { title?: string; message?: string }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)] p-6 shadow-[var(--shadow-sm)]">
        <h1 class="text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {props.title || "My Trips is unavailable right now"}
        </h1>
        <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
          {props.message ||
            "We could not resolve an ownership context for this request. Start a new trip or reopen a saved itinerary link to restore access."}
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href="/#global-search-entry"
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Start a new trip
          </a>
          <a
            href="/trips"
            class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Open trip workspace
          </a>
        </div>
      </section>
    );
  },
);
