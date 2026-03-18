import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import {
  beginCheckoutFromTrip,
  resolveCheckoutTrip,
} from "~/routes/checkout/actions";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const result = await beginCheckoutFromTrip({
    tripId: url.searchParams.get("trip"),
  });

  if (result) {
    throw redirect(302, result.redirectHref);
  }
};

export const onPost: RequestHandler = async ({ request, redirect }) => {
  const formData = await request.formData().catch(() => null);
  const result = await beginCheckoutFromTrip({
    tripId: formData?.get("tripId")?.toString(),
  });

  if (result) {
    throw redirect(303, result.redirectHref);
  }
};

export const useCheckoutEntry = routeLoader$(async ({ url }) => {
  return resolveCheckoutTrip({
    tripId: url.searchParams.get("trip"),
  });
});

export default component$(() => {
  const data = useCheckoutEntry().value;

  const goBackHref =
    data.kind === "empty_trip" || data.kind === "ready"
      ? `/trips/${data.trip.id}`
      : data.kind === "trip_not_found"
        ? "/trips"
        : data.kind === "missing_trip"
          ? "/trips"
          : data.kind === "invalid_trip"
            ? "/trips"
            : data.tripIdParam
              ? `/trips/${data.tripIdParam}`
              : "/trips";

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
          {data.kind === "empty_trip"
            ? "This trip is still empty"
            : data.kind === "missing_trip"
              ? "No active trip is available"
              : data.kind === "trip_not_found"
                ? "Trip not found"
                : data.kind === "invalid_trip"
                  ? "Trip link is invalid"
                  : data.kind === "error"
                    ? data.title
                    : "Starting checkout"}
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-[color:var(--color-text-muted)]">
          {data.kind === "empty_trip"
            ? `Trip ${data.trip.id} needs at least one canonical trip item before a checkout session can be created.`
            : data.kind === "missing_trip"
              ? "Create or select a persisted trip first, then return here to start a server-backed checkout session."
              : data.kind === "trip_not_found"
                ? `Trip ${data.tripId} could not be loaded from persisted storage.`
                : data.kind === "invalid_trip"
                  ? `The trip reference "${data.tripIdParam || "(empty)"}" is not a valid persisted trip id.`
                  : data.kind === "error"
                    ? data.message
                    : "Checkout is starting. If you are not redirected, return to the trip and try again."}
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <a
            href={goBackHref}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
          >
            Back to trips
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
      { name: "description", content: "Start or resume a persisted checkout session." },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
