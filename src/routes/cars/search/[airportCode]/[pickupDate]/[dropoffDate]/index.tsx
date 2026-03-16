import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CarResultsRenderer } from "~/components/search/cars/CarResultsRenderer";
import { resolveCarResultsRendererModel } from "~/components/search/cars/carResultsRendererModel";
import { Page } from "~/components/site/Page";
import { loadCanonicalCarSearchPage } from "~/server/search/loadCanonicalCarSearchPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalCarSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalCarSearchPage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const data = useCanonicalCarSearchPage().value;
  const location = useLocation();
  const currentPath = `${location.url.pathname}${location.url.search}`;
  const rendererModel = resolveCarResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });
  const breadcrumbLabel =
    "error" in data || location.isNavigating ? "Search results" : data.ui.summary.searchTitle;

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Cars", href: "/car-rentals" },
        { label: "Search", href: "/car-rentals" },
        { label: breadcrumbLabel, href: location.url.pathname },
      ]}
    >
      <CarResultsRenderer model={rendererModel} />
    </Page>
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
