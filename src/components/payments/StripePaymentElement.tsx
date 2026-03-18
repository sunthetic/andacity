import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

type StripeWindow = Window & {
  Stripe?: (publishableKey: string) => {
    elements(input: {
      clientSecret: string;
      appearance?: Record<string, unknown>;
    }): {
      create(
        type: "payment",
        options?: Record<string, unknown>,
      ): {
        mount(element: HTMLElement): void;
        destroy?(): void;
      };
    };
    confirmPayment(input: {
      elements: unknown;
      redirect?: "if_required" | "always";
      confirmParams?: {
        return_url: string;
      };
    }): Promise<{
      error?: {
        message?: string;
      };
    }>;
  };
};

let stripeScriptPromise: Promise<void> | null = null;

const ensureStripeScript = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as StripeWindow).Stripe) return Promise.resolve();
  if (stripeScriptPromise) return stripeScriptPromise;

  stripeScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-stripe-js="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Stripe.js failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.dataset.stripeJs = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Stripe.js failed to load."));
    document.head.appendChild(script);
  });

  return stripeScriptPromise;
};

export const StripePaymentElement = component$(
  (props: {
    clientSecret: string;
    publishableKey: string;
    amountLabel: string;
  }) => {
    const formRef = useSignal<HTMLFormElement>();
    const mountRef = useSignal<HTMLDivElement>();
    const loading = useSignal(true);
    const submitting = useSignal(false);
    const errorMessage = useSignal<string | null>(null);
    const statusMessage = useSignal<string | null>(null);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      const clientSecret = track(() => props.clientSecret);
      const publishableKey = track(() => props.publishableKey);
      const formEl = track(() => formRef.value);
      const mountEl = track(() => mountRef.value);

      if (
        !(formEl instanceof HTMLFormElement) ||
        !(mountEl instanceof HTMLDivElement) ||
        !clientSecret ||
        !publishableKey
      ) {
        return;
      }

      let destroyed = false;
      let stripePaymentElement: {
        mount(element: HTMLElement): void;
        destroy?(): void;
      } | null = null;
      let onSubmit: ((event: Event) => Promise<void>) | null = null;

      void ensureStripeScript()
        .then(async () => {
          if (destroyed) return;
          const Stripe = (window as StripeWindow).Stripe;
          if (typeof Stripe !== "function") {
            throw new Error("Stripe.js is unavailable.");
          }

          errorMessage.value = null;
          statusMessage.value = null;
          loading.value = true;
          mountEl.innerHTML = "";

          const stripe = Stripe(publishableKey);
          const elements = stripe.elements({
            clientSecret,
            appearance: {
              theme: "stripe",
              labels: "floating",
            },
          });
          stripePaymentElement = elements.create("payment", {
            layout: "tabs",
          });
          stripePaymentElement.mount(mountEl);
          loading.value = false;

          onSubmit = async (event: Event) => {
            event.preventDefault();
            if (submitting.value) return;

            submitting.value = true;
            errorMessage.value = null;
            statusMessage.value = "Confirming payment...";

            try {
              const result = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
                confirmParams: {
                  return_url: window.location.href,
                },
              });

              if (result.error?.message) {
                errorMessage.value = result.error.message;
                statusMessage.value = null;
                return;
              }

              statusMessage.value = "Payment submitted. Refreshing checkout...";
              window.setTimeout(() => {
                window.location.reload();
              }, 800);
            } catch (error) {
              errorMessage.value =
                error instanceof Error
                  ? error.message
                  : "Payment confirmation failed.";
              statusMessage.value = null;
            } finally {
              submitting.value = false;
            }
          };

          formEl.addEventListener("submit", onSubmit);
        })
        .catch((error) => {
          errorMessage.value =
            error instanceof Error
              ? error.message
              : "Stripe payment form failed to load.";
          statusMessage.value = null;
          loading.value = false;
        });

      cleanup(() => {
        destroyed = true;
        if (onSubmit) {
          formEl.removeEventListener("submit", onSubmit);
        }
        stripePaymentElement?.destroy?.();
      });
    });

    return (
      <form ref={formRef} class="space-y-4">
        <div
          ref={mountRef}
          class="min-h-[180px] rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-4"
        />

        {loading.value ? (
          <p class="text-sm text-[color:var(--color-text-muted)]">
            Loading secure payment fields...
          </p>
        ) : null}
        {errorMessage.value ? (
          <p class="text-sm text-[color:#b91c1c]">{errorMessage.value}</p>
        ) : null}
        {statusMessage.value ? (
          <p class="text-sm text-[color:var(--color-text-muted)]">
            {statusMessage.value}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading.value || submitting.value}
          class="w-full rounded-lg bg-[color:var(--color-action)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting.value ? "Submitting payment" : `Pay ${props.amountLabel}`}
        </button>
      </form>
    );
  },
);
