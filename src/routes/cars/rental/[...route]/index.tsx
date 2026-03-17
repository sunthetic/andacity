import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { CarEntityPage } from "~/components/entities/cars/CarEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import { readEntitySearchFlow } from "~/lib/entities/search-flow";
import { resolveLocationBySearchSlug } from "~/lib/location/location-repo.server";
import {
  buildAddToTripErrorHref,
  buildAddToTripSuccessHref,
  parseAddToTripContextTripId,
} from "~/lib/trips/add-to-trip-feedback";
import { parseSearchRoute } from "~/server/search/routeParser";
import {
  AddBookableEntityToTripError,
  addBookableEntityPageToTrip,
} from "~/server/entities/addBookableEntityPageToTrip";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("x-robots-tag", "noindex, follow");
};

const resolveCarSearchContextCityName = async (url: URL) => {
  const flow = readEntitySearchFlow(url);
  const candidateHrefs = [flow.returnTo, flow.modifySearch].filter(
    (value): value is string => Boolean(value),
  );

  for (const href of candidateHrefs) {
    const candidateUrl = new URL(href, url.origin);

    try {
      const request = parseSearchRoute(candidateUrl.pathname);
      if (request.type === "car") {
        const location = await resolveLocationBySearchSlug(request.airport);
        const cityName =
          String(location?.cityName || location?.displayName || "").trim() || null;
        if (cityName) {
          return cityName;
        }
      }
    } catch {
      // Keep walking fallbacks until a search context can be recovered.
    }

    const queryCode = String(candidateUrl.searchParams.get("q") || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(queryCode)) {
      const location = await resolveLocationBySearchSlug(queryCode);
      const cityName =
        String(location?.cityName || location?.displayName || "").trim() || null;
      if (cityName) {
        return cityName;
      }
    }
  }

  return null;
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
      vertical: "car",
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

  throw redirect(
    303,
    buildAddToTripSuccessHref({
      tripId: resolvedTripId,
    }),
  );
};

export const useCarEntityPageLoader = routeLoader$(async ({ status, url }) => {
  const page = await loadBookableEntityPage({
    vertical: "car",
    route: url,
  });

  status(page.status);
  return {
    page,
    searchContextCityName: await resolveCarSearchContextCityName(url),
  };
});

const resolveCarEntityPageLoader = useCarEntityPageLoader;

export default component$(() => {
  const data = useCarEntityPageLoader().value;

  return (
    <CarEntityPage
      page={data.page}
      searchContextCityName={data.searchContextCityName}
    />
  );
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(resolveCarEntityPageLoader).page, url, {
    allowIndexing: false,
  });
