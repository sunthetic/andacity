import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { getItineraryByPublicRef } from "~/lib/itinerary/getItineraryByPublicRef";
import { buildItineraryDetail } from "~/lib/itinerary/buildItineraryDetail";

const ITINERARY_REF_PATTERN = /^ITN-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useItineraryPage = routeLoader$(async ({ params, status }) => {
  const itineraryRef = String(params.itineraryRef || "")
    .trim()
    .toUpperCase();

  if (!itineraryRef || !ITINERARY_REF_PATTERN.test(itineraryRef)) {
    status(400);
    return {
      kind: "invalid_ref",
      itineraryRef: itineraryRef || "(empty)",
    } as const;
  }

  const itinerary = await getItineraryByPublicRef(itineraryRef);
  if (!itinerary) {
    status(404);
    return {
      kind: "not_found",
      itineraryRef,
    } as const;
  }

  return {
    kind: "loaded",
    detail: buildItineraryDetail(itinerary),
  } as const;
});

export default component$(() => {
  const data = useItineraryPage().value;

  if (data.kind !== "loaded") {
    return (
      <Page
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Itinerary" }]}
      >
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-lg font-semibold text-[color:var(--color-text-strong)]">
            Itinerary unavailable
          </p>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            {data.kind === "invalid_ref"
              ? `The itinerary reference "${data.itineraryRef}" is not valid.`
              : `Itinerary ${data.itineraryRef} could not be found.`}
          </p>
        </section>
      </Page>
    );
  }

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Trips", href: "/trips" },
        ...(data.detail.tripHref
          ? [
              {
                label: data.detail.summary.publicRef,
                href: data.detail.tripHref,
              },
            ]
          : []),
        { label: data.detail.publicRef },
      ]}
    >
      <div class="space-y-6">
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Durable itinerary
          </p>
          <h1 class="mt-2 text-3xl font-semibold text-[color:var(--color-text-strong)]">
            {data.detail.summary.title}
          </h1>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
            {data.detail.statusLabel} · {data.detail.statusDescription}
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            {data.detail.tripHref ? (
              <a
                href={data.detail.tripHref}
                class="rounded-lg bg-[color:var(--color-action)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                View trip
              </a>
            ) : null}
            <span class="rounded-lg border border-[color:var(--color-border)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-text-muted)]">
              Ownership foundation ready
            </span>
          </div>
        </section>

        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Owned items
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                This placeholder route proves itinerary ownership can now be
                retrieved independently of transient checkout and confirmation
                state.
              </p>
            </div>
            <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {data.detail.items.length} item
              {data.detail.items.length === 1 ? "" : "s"}
            </span>
          </div>

          <div class="mt-5 space-y-4">
            {data.detail.items.map((item) => (
              <article
                key={item.id}
                class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {item.display.title}
                    </p>
                    {item.display.subtitle ? (
                      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        {item.display.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                    {item.display.statusLabel}
                  </span>
                </div>

                <dl class="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt class="text-[color:var(--color-text-muted)]">Dates</dt>
                    <dd class="font-medium text-[color:var(--color-text-strong)]">
                      {item.display.dateLabel || "Unavailable"}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-[color:var(--color-text-muted)]">
                      Location
                    </dt>
                    <dd class="font-medium text-[color:var(--color-text-strong)]">
                      {item.display.locationLabel || "Unavailable"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useItineraryPage);
  const canonicalHref = new URL(url.pathname, url.origin).href;

  if (data.kind === "loaded") {
    return {
      title: `${data.detail.publicRef} | Itinerary | Andacity`,
      meta: [
        {
          name: "description",
          content: `View itinerary ${data.detail.publicRef} in the durable ownership layer.`,
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: canonicalHref }],
    };
  }

  return {
    title: "Itinerary unavailable | Andacity",
    meta: [
      {
        name: "description",
        content: "The requested itinerary could not be loaded.",
      },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
