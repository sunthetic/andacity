import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CanonicalHotelResultsSection } from "~/components/search/hotels/CanonicalHotelResultsSection";
import { HotelResultsRenderer } from "~/components/search/hotels/HotelResultsRenderer";
import { buildHotelSearchEditorHref, resolveHotelResultsRendererModel } from "~/components/search/hotels/hotelResultsRendererModel";
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

  const heroData = !("error" in data) ? data : null;

  return (
    <div style="background:var(--ui-bg);color:var(--ui-text)">
      <section
        class="relative isolate z-10"
        style="background-image:var(--ui-hero)"
        aria-label={heroData ? `Hotel search results for ${heroData.ui.summary.cityLabel}` : "Hotel search results"}
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
                <a href="/hotels" class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Hotels</a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" style="color:rgba(255,255,255,0.95)">{breadcrumbLabel}</li>
            </ol>
          </nav>

          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold md:text-3xl" style="color:#fff;font-family:'Lexend Variable',var(--system-font-family)">
                {heroData ? `Hotels in ${heroData.ui.summary.cityLabel}` : "Hotel search results"}
              </h1>
              {heroData ? (
                <p class="mt-1 text-sm" style="color:rgba(255,255,255,0.88)">
                  {heroData.ui.summary.checkInDateLabel} – {heroData.ui.summary.checkOutDateLabel}
                </p>
              ) : null}
            </div>
            {heroData ? (
              <a
                href={buildHotelSearchEditorHref(heroData.request, heroData.ui.summary.cityLabel)}
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
          <CanonicalHotelResultsSection
            page={data}
            currentPath={currentPath}
            isNavigating={location.isNavigating}
            hideHeader={true}
          />
        ) : (
          <HotelResultsRenderer model={rendererModel} />
        )}
      </div>
    </div>
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
