import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { getBookingConfirmationByPublicRef } from "~/lib/confirmation/getBookingConfirmationByPublicRef";
import { getConfirmationDisplayStatus } from "~/lib/confirmation/getConfirmationDisplayStatus";

export const useConfirmationPage = routeLoader$(async ({ params, status }) => {
  const confirmationRef = String(params.confirmationRef || "").trim();
  if (!confirmationRef) {
    status(404);
    return {
      kind: "not_found" as const,
      confirmationRef: "(empty)",
    };
  }

  const confirmation = await getBookingConfirmationByPublicRef(confirmationRef);
  if (!confirmation) {
    status(404);
    return {
      kind: "not_found" as const,
      confirmationRef,
    };
  }

  return {
    kind: "loaded" as const,
    confirmation,
  };
});

export default component$(() => {
  const data = useConfirmationPage().value;

  if (data.kind === "not_found") {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Confirmation" },
        ]}
      >
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
            Confirmation
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
            Confirmation not found
          </h1>
          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            Confirmation {data.confirmationRef} does not exist or is no longer
            available.
          </p>
        </section>
      </Page>
    );
  }

  const display = getConfirmationDisplayStatus(data.confirmation.status);
  const summary = data.confirmation.summaryJson;

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Confirmation" },
        { label: data.confirmation.publicRef },
      ]}
    >
      <div class="space-y-6">
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
            Booking confirmation
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-[color:var(--color-text-strong)]">
            {data.confirmation.publicRef}
          </h1>
          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            {display.description}
          </p>

          <div class="mt-5 flex flex-wrap gap-3 text-sm text-[color:var(--color-text-muted)]">
            <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1">
              {display.label}
            </span>
            {summary ? (
              <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1">
                {summary.confirmedItemCount} confirmed of {summary.totalItemCount}
              </span>
            ) : null}
            <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1">
              Trip {data.confirmation.tripId}
            </span>
          </div>
        </section>

        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            Placeholder confirmation page
          </p>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            TASK-042 prepares the confirmation domain and route contract. A more
            complete confirmation page lands in TASK-043 on top of this public
            reference model.
          </p>
        </section>
      </div>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useConfirmationPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    return {
      title: `${data.confirmation.publicRef} | Andacity`,
      meta: [
        {
          name: "description",
          content: `View booking confirmation ${data.confirmation.publicRef}.`,
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  return {
    title: "Confirmation unavailable | Andacity",
    meta: [
      {
        name: "description",
        content: "The requested confirmation could not be loaded.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
