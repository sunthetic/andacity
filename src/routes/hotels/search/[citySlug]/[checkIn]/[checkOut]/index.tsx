import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { HotelResultsRenderer } from "~/components/search/hotels/HotelResultsRenderer";
import { resolveHotelResultsRendererModel } from "~/components/search/hotels/hotelResultsRendererModel";
import { Page } from "~/components/site/Page";
import { loadCanonicalHotelSearchPage } from "~/server/search/loadCanonicalHotelSearchPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCanonicalHotelSearchPage = routeLoader$(async ({ status, url }) => {
  const result = await loadCanonicalHotelSearchPage(url);
  status(result.status);
  return result;
});

export default component$(() => {
  const data = useCanonicalHotelSearchPage().value;
  const location = useLocation();
  const currentPath = `${location.url.pathname}${location.url.search}`;
  const rendererModel = resolveHotelResultsRendererModel(data, {
    isLoading: location.isNavigating,
    currentPath,
  });
  const breadcrumbLabel =
    "error" in data || location.isNavigating ? "Search results" : data.ui.summary.cityLabel;

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Hotels", href: "/hotels" },
        { label: "Search", href: "/hotels/search" },
        { label: breadcrumbLabel, href: location.url.pathname },
      ]}
    >
      <HotelResultsRenderer model={rendererModel} />
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
