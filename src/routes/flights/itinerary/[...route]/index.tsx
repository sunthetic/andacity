import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { FlightEntityPage } from "~/components/entities/flights/FlightEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import {
  buildAddToTripErrorHref,
  parseAddToTripContextTripId,
} from "~/lib/trips/add-to-trip-feedback";
import {
  AddBookableEntityToTripError,
  addBookableEntityPageToTrip,
} from "~/server/entities/addBookableEntityPageToTrip";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

export const onPost: RequestHandler = async ({ request, redirect, url }) => {
  const formData = await request.formData().catch(() => new FormData());
  if (String(formData.get("intent") || "").trim() !== "add-to-trip") {
    throw redirect(303, `${url.pathname}${url.search}`);
  }

  const tripId = parseAddToTripContextTripId(
    formData.get("tripId")?.toString(),
  );

  let resolvedTripId!: number;
  try {
    const result = await addBookableEntityPageToTrip({
      vertical: "flight",
      route: url,
      preferredTripId: tripId,
    });
    resolvedTripId = result.trip.id;
  } catch (error) {
    const code =
      error instanceof AddBookableEntityToTripError
        ? error.code
        : "persistence_failed";

    throw redirect(
      303,
      buildAddToTripErrorHref({
        url,
        code,
        tripId,
        preserveTripContext: code !== "trip_not_found",
      }),
    );
  }

  throw redirect(303, `/trips/${resolvedTripId}`);
};

export const useFlightEntityPageLoader = routeLoader$(async ({ status, url }) => {
  const result = await loadBookableEntityPage({
    vertical: "flight",
    route: url,
  });

  status(result.status);
  return result;
});

const resolveFlightEntityPageLoader = useFlightEntityPageLoader;

export default component$(() => {
  const page = useFlightEntityPageLoader().value;

  return <FlightEntityPage page={page} />;
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(resolveFlightEntityPageLoader), url, {
    allowIndexing: false,
  });
