import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { FlightResultsRenderer } from "~/components/search/flights/FlightResultsRenderer";
import { resolveFlightResultsRendererModel } from "~/components/search/flights/flightResultsRendererModel";
import { Page } from "~/components/site/Page";
import { loadCanonicalFlightSearchPage } from "~/server/search/loadCanonicalFlightSearchPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalFlightSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalFlightSearchPage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const data = useCanonicalFlightSearchPage().value;
  const location = useLocation();
  const currentPath = `${location.url.pathname}${location.url.search}`;
  const rendererModel = resolveFlightResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });
  const breadcrumbLabel =
    "error" in data || location.isNavigating ? "Search results" : data.ui.summary.routeTitle;

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Flights", href: "/flights" },
        { label: "Search", href: "/flights/search" },
        { label: breadcrumbLabel, href: location.url.pathname },
      ]}
    >
      <FlightResultsRenderer model={rendererModel} />
    </Page>
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
        {
          name: "robots",
          content: "noindex,follow,max-image-preview:large",
        },
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
