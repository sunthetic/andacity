import { component$ } from "@builder.io/qwik";
import { StripePaymentElement } from "~/components/payments/StripePaymentElement";

export const StripeElementsProvider = component$(
  (props: { clientSecret: string | null; amountLabel: string }) => {
    const publishableKey = String(
      import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    ).trim();

    if (!props.clientSecret) {
      return (
        <p class="text-sm text-[color:var(--color-text-muted)]">
          Stripe can mount once the checkout has an active client secret.
        </p>
      );
    }

    if (!publishableKey) {
      return (
        <div class="rounded-xl border border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)] p-4 text-sm text-[color:var(--color-text-muted)]">
          Stripe is configured on the server, but{" "}
          <code>PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is missing for the client
          payment form.
        </div>
      );
    }

    return (
      <StripePaymentElement
        clientSecret={props.clientSecret}
        publishableKey={publishableKey}
        amountLabel={props.amountLabel}
      />
    );
  },
);
