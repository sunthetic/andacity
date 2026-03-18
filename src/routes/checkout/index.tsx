import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { getCheckoutEntryErrorMessage } from "~/lib/checkout/getCheckoutEntryErrorMessage";
import type { CheckoutEntryErrorCode } from "~/types/checkout";
import {
  beginCheckoutFromTrip,
  resolveCheckoutTrip,
} from "~/routes/checkout/actions";

type CheckoutBootstrapErrorCode = Extract<
  CheckoutEntryErrorCode,
  "CHECKOUT_CREATE_FAILED" | "CHECKOUT_RESUME_FAILED"
>;

const readBootstrapErrorCode = (
  value: FormDataEntryValue | string | null | undefined,
): CheckoutBootstrapErrorCode | null => {
  if (
    value !== "CHECKOUT_CREATE_FAILED" &&
    value !== "CHECKOUT_RESUME_FAILED"
  ) {
    return null;
  }

  return value;
};

const buildCheckoutEntryHref = (input: {
  tripId?: FormDataEntryValue | string | number | null;
  error?: CheckoutBootstrapErrorCode | null;
}) => {
  const params = new URLSearchParams();
  const tripId = String(input.tripId || "").trim();
  if (tripId) params.set("trip", tripId);
  if (input.error) params.set("error", input.error);

  const query = params.toString();
  return query ? `/checkout?${query}` : "/checkout";
};

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onGet: RequestHandler = async ({ url, redirect }) => {
  if (readBootstrapErrorCode(url.searchParams.get("error"))) return;

  const result = await beginCheckoutFromTrip({
    tripId: url.searchParams.get("trip"),
  });

  if (result.ok) {
    throw redirect(302, result.redirectTo);
  }

  if (
    result.code === "CHECKOUT_CREATE_FAILED" ||
    result.code === "CHECKOUT_RESUME_FAILED"
  ) {
    throw redirect(
      302,
      buildCheckoutEntryHref({
        tripId: url.searchParams.get("trip"),
        error: result.code,
      }),
    );
  }
};

export const onPost: RequestHandler = async ({ request, redirect }) => {
  const formData = await request.formData().catch(() => null);
  const tripId = formData?.get("tripId");
  const result = await beginCheckoutFromTrip({
    tripId: tripId?.toString(),
  });

  if (result.ok) {
    throw redirect(303, result.redirectTo);
  }

  throw redirect(
    303,
    buildCheckoutEntryHref({
      tripId,
      error:
        result.code === "CHECKOUT_CREATE_FAILED" ||
        result.code === "CHECKOUT_RESUME_FAILED"
          ? result.code
          : null,
    }),
  );
};

export const useCheckoutEntry = routeLoader$(async ({ url }) => {
  return {
    resolved: await resolveCheckoutTrip({
      tripId: url.searchParams.get("trip"),
    }),
    bootstrapError: readBootstrapErrorCode(url.searchParams.get("error")),
  };
});

export default component$(() => {
  const data = useCheckoutEntry().value;
  const { resolved, bootstrapError } = data;

  const primaryHref =
    resolved.kind === "ready" ||
    resolved.kind === "empty_trip" ||
    resolved.kind === "invalid_trip_state"
      ? `/trips/${resolved.trip.id}`
      : resolved.kind === "trip_not_found"
        ? "/trips"
        : resolved.kind === "invalid_trip" && resolved.tripIdParam
          ? `/trips/${resolved.tripIdParam}`
          : "/trips";
  const primaryLabel =
    primaryHref === "/trips" ? "Back to trips" : "Back to trip";

  const title = bootstrapError
    ? bootstrapError === "CHECKOUT_RESUME_FAILED"
      ? "We couldn’t resume checkout"
      : "We couldn’t start checkout"
    : resolved.kind === "missing_trip"
      ? "No active trip is available"
      : resolved.kind === "trip_not_found"
        ? "Trip not found"
        : resolved.kind === "invalid_trip"
          ? "Trip link is invalid"
          : resolved.kind === "empty_trip"
            ? "This trip is still empty"
            : resolved.kind === "invalid_trip_state"
              ? "This trip can’t enter checkout yet"
              : resolved.kind === "error"
                ? resolved.title
                : "Starting checkout";

  const message = bootstrapError
    ? getCheckoutEntryErrorMessage(bootstrapError)
    : resolved.kind === "missing_trip"
      ? "Create or select a trip first, then return here to start a checkout snapshot."
      : resolved.kind === "trip_not_found"
        ? getCheckoutEntryErrorMessage("TRIP_NOT_FOUND", {
            tripIdParam: resolved.tripId,
          })
        : resolved.kind === "invalid_trip"
          ? getCheckoutEntryErrorMessage("TRIP_INVALID", {
              detail: `The trip reference "${resolved.tripIdParam || "(empty)"}" is not valid.`,
            })
          : resolved.kind === "empty_trip"
            ? getCheckoutEntryErrorMessage("TRIP_EMPTY")
            : resolved.kind === "invalid_trip_state"
              ? getCheckoutEntryErrorMessage("TRIP_INVALID", {
                  detail: resolved.readiness.readinessLabel,
                })
              : resolved.kind === "error"
                ? resolved.message
                : "Checkout is starting. If you are not redirected, return to the trip and try again.";

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        { label: "Checkout" },
      ]}
    >
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          Checkout entry
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
          {title}
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          {message}
        </p>
        {resolved.kind === "invalid_trip_state" ? (
          <ul class="mt-4 space-y-2 text-sm text-[color:var(--color-text-muted)]">
            {resolved.readiness.issues.slice(0, 4).map((issue, index) => (
              <li key={`${issue.code}-${issue.itemId ?? "trip"}-${index}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        ) : null}
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={primaryHref}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            {primaryLabel}
          </a>
          <a
            href="/"
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Start a new search
          </a>
        </div>
      </section>
    </Page>
  );
});

export const head: DocumentHead = ({ url }) => {
  const canonicalHref = new URL(url.pathname, url.origin).href;

  return {
    title: "Checkout | Andacity",
    meta: [
      {
        name: "description",
        content:
          "Start or resume a persisted checkout session from a saved trip.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
