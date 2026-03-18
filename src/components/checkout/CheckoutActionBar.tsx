import { $, component$, useSignal } from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import type { CheckoutSessionSummary } from "~/types/checkout";

const isRetryAllowed = (summary: CheckoutSessionSummary) => {
  return (
    summary.status !== "expired" &&
    summary.status !== "completed" &&
    summary.status !== "abandoned"
  );
};

export const CheckoutActionBar = component$(
  (props: { summary: CheckoutSessionSummary }) => {
    const pending = useSignal(false);
    const onSubmit$ = $(() => {
      if (!isRetryAllowed(props.summary) || pending.value) return;
      pending.value = true;
    });

    return (
      <aside class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          Next step
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {props.summary.readinessState === "ready"
            ? "This checkout session passed the revalidation gate. Payment intent work lands next."
            : "Payment stays blocked until the latest pricing and availability check passes."}
        </p>

        <div class="mt-5 space-y-3">
          <button
            type="button"
            disabled
            class="w-full rounded-lg bg-[color:rgba(15,23,42,0.08)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)]"
          >
            {props.summary.readinessState === "ready"
              ? "Payment step coming in TASK-039"
              : "Payment blocked until revalidation passes"}
          </button>

          {isRetryAllowed(props.summary) ? (
            <form method="post" onSubmit$={onSubmit$}>
              <input type="hidden" name="intent" value="revalidate" />
              <AsyncPendingButton
                type="submit"
                pending={pending.value}
                pendingLabel="Rechecking availability"
                class="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
              >
                Recheck availability
              </AsyncPendingButton>
            </form>
          ) : null}

          <a
            href={props.summary.tripHref}
            class="block w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-center text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Return to trip
          </a>
        </div>
      </aside>
    );
  },
);
