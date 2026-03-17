import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CanonicalHotelResultsSection } from "~/components/search/hotels/CanonicalHotelResultsSection";
import { HotelResultsRenderer } from "~/components/search/hotels/HotelResultsRenderer";
import { resolveHotelResultsRendererModel } from "~/components/search/hotels/hotelResultsRendererModel";
import { Page } from "~/components/site/Page";
import { mapHotelResultsForUi } from "~/server/search/mapHotelResultsForUi";
import {
  loadCanonicalHotelSearchProgressivePage,
  type CanonicalHotelSearchPageResult,
} from "~/server/search/loadCanonicalHotelSearchPage";
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
import type { HotelSearchEntity } from "~/types/search-entity";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalHotelSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalHotelSearchProgressivePage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const loader = useCanonicalHotelSearchPage();
  const pageState = useSignal<CanonicalHotelSearchPageResult>(loader.value);
  const batchesState = useSignal<SearchResultsIncrementalBatch<HotelSearchEntity>[]>([]);
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
          | SearchResultsIncrementalApiResponse<HotelSearchEntity>
          | SearchResultsApiError;

        if (isIncrementalSearchApiError(body)) {
          pageState.value = {
            status: response.status,
            error: body.error,
            request: initialPage.request,
          };
          return;
        }

        if (body.data.request.type !== "hotel") {
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
          ui: mapHotelResultsForUi({
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
  const rendererModel = resolveHotelResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });
  const breadcrumbLabel =
    "error" in data || location.isNavigating ? "Search results" : data.ui.summary.cityLabel;
  const showShell =
    !("error" in data) &&
    rendererModel.state !== "loading" &&
    rendererModel.state !== "error";

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Hotels", href: "/hotels" },
        { label: "Search", href: "/hotels/search" },
        { label: breadcrumbLabel, href: location.url.pathname },
      ]}
    >
      {showShell ? (
        <CanonicalHotelResultsSection
          page={data}
          currentPath={currentPath}
          isNavigating={location.isNavigating}
        />
      ) : (
        <HotelResultsRenderer model={rendererModel} />
      )}
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useCanonicalHotelSearchPage);

  if ("error" in data) {
    return {
      title: "Hotel search results | Andacity",
      meta: [
        {
          name: "description",
          content: "Review canonical hotel search results and search status in Andacity.",
        },
        {
          name: "robots",
          content: "noindex,follow,max-image-preview:large",
        },
      ],
    };
  }

  const title = `${data.ui.summary.cityLabel} hotels | Andacity`;
  const description = `Browse hotel results for ${data.ui.summary.cityLabel} from ${data.request.checkIn} to ${data.request.checkOut}.`;

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
