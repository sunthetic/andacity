import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { HotelEntityPage } from "~/components/entities/hotels/HotelEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useHotelEntityPage = routeLoader$(async ({ status, url }) => {
  const result = await loadBookableEntityPage({
    vertical: "hotel",
    route: url,
  });

  status(result.status);
  return result;
});

export default component$(() => {
  return <HotelEntityPage page={useHotelEntityPage().value} />;
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(useHotelEntityPage), url, {
    allowIndexing: false,
  });
