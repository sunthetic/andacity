import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CanonicalCarResultsSection } from "~/components/search/cars/CanonicalCarResultsSection";
import { CarResultsRenderer } from "~/components/search/cars/CarResultsRenderer";
import { buildCarSearchEditorHref, resolveCarResultsRendererModel } from "~/components/search/cars/carResultsRendererModel";
import { mapCarResultsForUi } from "~/server/search/mapCarResultsForUi";
import {
  loadCanonicalCarSearchProgressivePage,
  type CanonicalCarSearchPageResult,
} from "~/server/search/loadCanonicalCarSearchPage";
import {
  buildIncrementalSearchRequestUrl,
  isIncrementalSearchApiError,
  mergeIncrementalSearchResponse,
} from "~/lib/search/incrementalSearchClient";
import type {
  SearchResultsApiError,
  SearchResultsIncrementalApiResponse,
  SearchResultsIncrementalBatch,
} from "~/types/search";
import type { CarSearchEntity } from "~/types/search-entity";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalCarSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalCarSearchProgressivePage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const loader = useCanonicalCarSearchPage();
  const pageState = useSignal<CanonicalCarSearchPageResult>(loader.value);
  const batchesState = useSignal<SearchResultsIncrementalBatch<CarSearchEntity>[]>([]);
  const location = useLocation();
  const currentPath = `${location.url.pathname}${location.url.search}`;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const nextPage = track(() => loader.value);
    pageState.value = nextPage;
    batchesState.value = [];
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    const initialPage = track(() => loader.value);
    if ("error" in initialPage) return;
    if (!initialPage.progress || initialPage.progress.status === "complete") return;

    let stopped = false;
    let timeoutId = 0;
    let cursor = initialPage.progress.cursor;
    let batches = batchesState.value.slice();
    let results = initialPage.results.slice();

    const poll = async () => {
      if (stopped) return;

      try {
        const response = await fetch(
          buildIncrementalSearchRequestUrl(initialPage.progress?.endpoint || currentPath, cursor),
          {
            cache: "no-store",
          },
        );
        const body = (await response.json()) as
          | SearchResultsIncrementalApiResponse<CarSearchEntity>
          | SearchResultsApiError;

        if (isIncrementalSearchApiError(body)) {
          pageState.value = {
            status: response.status,
            error: body.error,
            request: initialPage.request,
          };
          return;
        }

        if (body.data.request.type !== "car") {
          return;
        }

        const merged = mergeIncrementalSearchResponse(results, batches, body);
        results = merged.results;
        batches = merged.batches;
        batchesState.value = batches;
        cursor = body.data.metadata.cursor;

        pageState.value = {
          status: 200,
          request: body.data.request,
          results,
          metadata: body.data.metadata,
          progress: {
            endpoint: initialPage.progress?.endpoint || currentPath,
            searchKey: body.data.metadata.searchKey,
            status: body.data.metadata.status,
            cursor: body.data.metadata.cursor,
          },
          ui: mapCarResultsForUi({
            request: body.data.request,
            results,
            metadata: body.data.metadata,
          }),
        };

        if (body.data.metadata.status === "complete") {
          return;
        }
      } catch {
        // Keep the current partial state on transient polling failures.
      }

      if (stopped) return;
      timeoutId = window.setTimeout(() => {
        void poll();
      }, 250);
    };

    void poll();

    cleanup(() => {
      stopped = true;
      window.clearTimeout(timeoutId);
    });
  });

  const data = pageState.value;
  const rendererModel = resolveCarResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });
  const breadcrumbLabel =
    "error" in data || location.isNavigating ? "Search results" : data.ui.summary.searchTitle;
  const showShell =
    !("error" in data) &&
    rendererModel.state !== "loading" &&
    rendererModel.state !== "error";

  const heroData = !("error" in data) ? data : null;

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text)">
      <section
        class="relative isolate"
        style="background-image:var(--ui-hero)"
        aria-label={heroData ? `Car rental search results at ${heroData.request.airport}` : "Car rental search results"}
      >
        <div class="absolute inset-0 -z-10" style="background-image:var(--ui-hero-scrim)" aria-hidden="true" />
        <div class="mx-auto max-w-6xl px-4 pt-8 pb-7 md:pt-10 md:pb-8">
          <nav aria-label="Breadcrumb" class="mb-4">
            <ol class="flex flex-wrap items-center gap-2 text-[12px]" style="color:rgba(255,255,255,0.72)">
              <li class="flex items-center gap-2">
                <a href="/" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Home</a>
                <span aria-hidden="true">/</span>
              </li>
              <li class="flex items-center gap-2">
                <a href="/car-rentals" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Car Rentals</a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">{breadcrumbLabel}</li>
            </ol>
          </nav>

          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold md:text-3xl" style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)">
                {heroData ? `Car rentals at ${heroData.request.airport}` : "Car rental search results"}
              </h1>
              {heroData ? (
                <p class="mt-1 text-sm" style="color:rgba(255,255,255,0.88)">
                  {heroData.ui.summary.pickupDateLabel} – {heroData.ui.summary.dropoffDateLabel}
                </p>
              ) : null}
            </div>
            {heroData ? (
              <a
                href={buildCarSearchEditorHref(heroData.request)}
                class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.3);min-height:44px"
              >
                Edit search
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div class="mx-auto max-w-6xl px-4 py-8">
        {showShell ? (
          <CanonicalCarResultsSection
            page={data}
            currentPath={currentPath}
            isNavigating={location.isNavigating}
            hideHeader={true}
          />
        ) : (
          <CarResultsRenderer model={rendererModel} />
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useCanonicalCarSearchPage);

  if ("error" in data) {
    return {
      title: "Car search results | Andacity",
      meta: [
        {
          name: "description",
          content: "Review canonical car search results and search status in Andacity.",
        },
        {
          name: "robots",
          content: "noindex,follow,max-image-preview:large",
        },
      ],
    };
  }

  const title = `${data.ui.summary.searchTitle} | Andacity`;
  const description = `Browse car rental results for ${data.request.airport} pickup and dropoff from ${data.request.pickupDate} to ${data.request.dropoffDate}.`;

  return {
    title,
    meta: [
      { name: "description", content: description },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url.href },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url.href }],
  };
};
