import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { BookableEntityPage } from "~/components/entities/BookableEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useCarEntityPage = routeLoader$(async ({ status, url }) => {
  const result = await loadBookableEntityPage({
    vertical: "car",
    route: url,
  });

  status(result.status);
  return result;
});

export default component$(() => {
  return <BookableEntityPage page={useCarEntityPage().value} />;
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(useCarEntityPage), url, {
    allowIndexing: false,
  });
