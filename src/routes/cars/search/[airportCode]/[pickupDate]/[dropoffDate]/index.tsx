import { component$ } from "@builder.io/qwik";
import { routeLoader$, type RequestHandler } from "@builder.io/qwik-city";
import { Page } from "~/components/site/Page";
import { loadCanonicalCarSearch } from "~/server/search/loadCanonicalCarSearch";

const formatPayload = (value: unknown) => JSON.stringify(value, null, 2);

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalCarSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalCarSearch(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const data = useCanonicalCarSearchPage().value;

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Cars", href: "/car-rentals" },
        { label: "Search", href: "/car-rentals/in" },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Canonical car search
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Placeholder renderer for canonical airport pickup car search routes
          backed by the shared search pipeline.
        </p>
      </div>

      {"error" in data ? (
        <section class="mt-8 rounded-3xl border border-[color:var(--color-danger-border,#f1b3b8)] bg-[color:var(--color-danger-surface,#fff5f5)] p-6">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Search request error
            </h2>
            <span class="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
              HTTP {data.status}
            </span>
          </div>

          <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
            Invalid canonical car routes return structured validation payloads.
          </p>

          <pre class="mt-5 overflow-x-auto rounded-2xl bg-[color:var(--color-surface)] p-4 text-xs leading-6 text-[color:var(--color-text-strong)]">
            {formatPayload({ error: data.error })}
          </pre>
        </section>
      ) : (
        <section class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div class="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Search summary
            </h2>

            <dl class="mt-5 space-y-4 text-sm">
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Airport
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.request.airport}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Pickup
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.request.pickupDate}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Dropoff
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.request.dropoffDate}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Total results
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.metadata.totalResults}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Providers queried
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.metadata.providersQueried.join(", ") || "None"}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-[color:var(--color-text-muted)]">
                  Search time
                </dt>
                <dd class="mt-1 text-[color:var(--color-text-strong)]">
                  {data.metadata.searchTime}ms
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Canonical response payload
            </h2>
            <p class="mt-3 text-sm text-[color:var(--color-text-muted)]">
              Exact <code>{"{ results, metadata }"}</code> response shape
              returned by the canonical car search loader.
            </p>

            <pre class="mt-5 overflow-x-auto rounded-2xl bg-[color:var(--color-bg-subtle,#f6f6f2)] p-4 text-xs leading-6 text-[color:var(--color-text-strong)]">
              {formatPayload({
                results: data.results,
                metadata: data.metadata,
              })}
            </pre>
          </div>
        </section>
      )}
    </Page>
  );
});
