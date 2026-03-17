import { component$ } from "@builder.io/qwik";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";

export const TripErrorState = component$(
  (props: { title: string; message: string; retryHref: string }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 class="text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {props.title}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          The trip could not be loaded from persisted storage right now.
        </p>

        <AsyncStateNotice
          class="mt-4"
          state="failed"
          title={props.title}
          message={props.message}
        />

        <AsyncRetryControl
          class="mt-4"
          label="Retry trip"
          href={props.retryHref}
          message="Retry this trip page or return to the trip builder while persistence recovers."
        />
      </section>
    );
  },
);
