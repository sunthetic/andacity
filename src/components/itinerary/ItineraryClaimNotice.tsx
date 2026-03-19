import { component$ } from "@builder.io/qwik";
import type { OwnershipDisplayState } from "~/types/ownership";

export const ItineraryClaimNotice = component$(
  (props: {
    displayState: OwnershipDisplayState;
    hasCurrentUser: boolean;
  }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:rgba(217,119,6,0.18)] bg-[color:rgba(255,247,237,0.96)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
          {props.displayState.title}
        </p>
        <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
          {props.displayState.message}
        </p>

        {props.hasCurrentUser ? (
          <form method="post" class="mt-5">
            <input type="hidden" name="intent" value="claim-itinerary" />
            <button
              type="submit"
              class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              {props.displayState.label}
            </button>
          </form>
        ) : (
          <p class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            Sign in with a future account flow to attach this anonymous itinerary.
          </p>
        )}
      </section>
    );
  },
);
