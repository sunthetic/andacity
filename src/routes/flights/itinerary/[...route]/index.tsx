import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import { FlightEntityPage } from "~/components/entities/flights/FlightEntityPage";
import { buildBookableEntityDocumentHead } from "~/lib/entities/metadata";
import { resolveLocationBySearchSlug } from "~/lib/location/location-repo.server";
import {
  buildAddToTripErrorHref,
  buildAddToTripSuccessHref,
  parseAddToTripContextTripId,
} from "~/lib/trips/add-to-trip-feedback";
import {
  AddBookableEntityToTripError,
  addBookableEntityPageToTrip,
} from "~/server/entities/addBookableEntityPageToTrip";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";
import type { FlightBookableEntity } from "~/types/bookable-entity";
import type { CanonicalLocation } from "~/types/location";

const resolveFlightAirportLookup = async (
  page: Awaited<ReturnType<typeof loadBookableEntityPage>>,
) => {
  if (
    page.kind !== "resolved" &&
    page.kind !== "unavailable" &&
    page.kind !== "revalidation_required"
  ) {
    return {} as Record<string, CanonicalLocation | null>;
  }

  const entity = page.entity as FlightBookableEntity;
  const codes = new Set<string>();

  for (const segment of entity.payload.segments || []) {
    for (const code of [segment.originCode, segment.destinationCode]) {
      const normalized = String(code || "").trim().toUpperCase();
      if (/^[A-Z]{3}$/.test(normalized)) {
        codes.add(normalized);
      }
    }
  }

  for (const code of [entity.bookingContext.origin, entity.bookingContext.destination]) {
    const normalized = String(code || "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(normalized)) {
      codes.add(normalized);
    }
  }

  const entries = await Promise.all(
    Array.from(codes).map(async (code) => [
      code,
      await resolveLocationBySearchSlug(code),
    ] as const),
  );

  return Object.fromEntries(entries);
};

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

  throw redirect(
    303,
    buildAddToTripSuccessHref({
      tripId: resolvedTripId,
    }),
  );
};

export const useFlightEntityPageLoader = routeLoader$(async ({ status, url }) => {
  const page = await loadBookableEntityPage({
    vertical: "flight",
    route: url,
  });

  status(page.status);
  return {
    page,
    airportLookup: await resolveFlightAirportLookup(page),
  };
});

const resolveFlightEntityPageLoader = useFlightEntityPageLoader;

export default component$(() => {
  const data = useFlightEntityPageLoader().value;

  return <FlightEntityPage page={data.page} airportLookup={data.airportLookup} />;
});

export const head: DocumentHead = ({ resolveValue, url }) =>
  buildBookableEntityDocumentHead(resolveValue(resolveFlightEntityPageLoader).page, url, {
    allowIndexing: false,
  });
