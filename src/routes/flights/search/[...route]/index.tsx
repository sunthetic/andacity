/**
 * CLAUDE-UI-016 — production flight route results page.
 *
 * Rewrites the presentation layer to use the `--ui-*` system via
 * FlightResultsPage while preserving ALL existing behavior:
 *  - onRequest noindex/follow header
 *  - useCanonicalFlightSearchPage loader (SSR + progressive polling)
 *  - Incremental polling loop (250ms intervals until complete)
 *  - Real URL-driven sort/filter via searchStateFromUrl/searchStateToUrl
 *  - Canonical route shape: /flights/search/{FROM}-{TO}/{depart}[/return/{ret}]
 *  - head metadata (title, description, canonical, noindex,follow)
 *
 * The production CanonicalFlightResultsSection is no longer rendered by this
 * route; its filter/sort logic is replicated in FlightResultsSection on --ui-*.
 */
import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { FlightResultsPage } from "~/components/flights/results/FlightResultsPage";
import { resolveFlightResultsRendererModel } from "~/components/search/flights/flightResultsRendererModel";
import { mapFlightResultsForUi } from "~/server/search/mapFlightResultsForUi";
import {
  loadCanonicalFlightSearchProgressivePage,
  type CanonicalFlightSearchPageResult,
} from "~/server/search/loadCanonicalFlightSearchPage";
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
import type { FlightSearchEntity } from "~/types/search-entity";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalFlightSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalFlightSearchProgressivePage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const loader = useCanonicalFlightSearchPage();
  const pageState = useSignal<CanonicalFlightSearchPageResult>(loader.value);
  const batchesState = useSignal<SearchResultsIncrementalBatch<FlightSearchEntity>[]>([]);
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
          { cache: "no-store" },
        );
        const body = (await response.json()) as
          | SearchResultsIncrementalApiResponse<FlightSearchEntity>
          | SearchResultsApiError;

        if (isIncrementalSearchApiError(body)) {
          pageState.value = {
            status: response.status,
            error: body.error,
            request: initialPage.request,
          };
          return;
        }

        if (body.data.request.type !== "flight") return;

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
          ui: mapFlightResultsForUi({
            request: body.data.request,
            results,
            metadata: body.data.metadata,
          }),
        };

        if (body.data.metadata.status === "complete") return;
      } catch {
        // Keep current partial state on transient polling failures.
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
  const rendererModel = resolveFlightResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });

  return (
    <FlightResultsPage
      data={data}
      rendererModel={rendererModel}
      currentPath={currentPath}
      isNavigating={location.isNavigating}
    />
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useCanonicalFlightSearchPage);

  if ("error" in data) {
    return {
      title: "Flight search results | Andacity",
      meta: [
        {
          name: "description",
          content: "Review canonical flight search results and search status in Andacity.",
        },
        { name: "robots", content: "noindex,follow,max-image-preview:large" },
      ],
    };
  }

  const title = `${data.ui.summary.routeTitle} flights | Andacity`;
  const description = `${data.ui.summary.tripTypeLabel} flight results from ${data.request.origin} to ${data.request.destination} departing ${data.request.departDate}.`;

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
