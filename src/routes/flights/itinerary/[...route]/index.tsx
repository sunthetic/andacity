import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { FlightEntityPage } from "~/components/entities/flights/FlightEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const useFlightEntityPage = routeLoader$(async ({ status, url }) => {
  const result = await loadBookableEntityPage({
    vertical: "flight",
    route: url,
  });

  status(result.status);
  return result;
});

export default component$(() => {
  const page = useFlightEntityPage().value;

  return <FlightEntityPage page={page} />;
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(useFlightEntityPage), url, {
    allowIndexing: false,
  });
