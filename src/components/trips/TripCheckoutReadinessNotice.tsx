import { component$ } from "@builder.io/qwik";
import type { TripCheckoutReadiness } from "~/types/checkout";

export const TripCheckoutReadinessNotice = component$(
  (props: { readiness: TripCheckoutReadiness }) => {
    const { readiness } = props;

    return (
      <section
        class={[
          "rounded-xl border px-4 py-4",
          readiness.isReady
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : "border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)]",
        ]}
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {readiness.isReady ? "Ready for checkout" : "Checkout is blocked"}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {readiness.isReady
            ? "This trip can move into checkout now. Pricing and availability will be confirmed before payment."
            : readiness.readinessLabel}
        </p>

        {!readiness.isReady && readiness.issues.length ? (
          <ul class="mt-3 space-y-2 text-sm text-[color:var(--color-text-muted)]">
            {readiness.issues.slice(0, 3).map((issue, index) => (
              <li key={`${issue.code}-${issue.itemId ?? "trip"}-${index}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  },
);
