import type { RequestHandler } from "@builder.io/qwik-city";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import { buildCanonicalFlightSearchHref } from "~/lib/search/entry-routes";
import { normalizeFlightItineraryType } from "~/lib/search/flights/routing";

export const onGet: RequestHandler = async ({ params, redirect, url }) => {
  const itineraryType = normalizeFlightItineraryType(
    String(params.itineraryTypeSlug || "").trim(),
  );
  const [fromLocation, toLocation] = await Promise.all([
    resolveLocationFromUrlValues({
      locationId: url.searchParams.get("fromLocationId"),
      searchSlug: params.fromLocationSlug,
      text: url.searchParams.get("from"),
    }),
    resolveLocationFromUrlValues({
      locationId: url.searchParams.get("toLocationId"),
      searchSlug: params.toLocationSlug,
      text: url.searchParams.get("to"),
    }),
  ]);

  const departDate = String(url.searchParams.get("depart") || "").trim();
  const returnDate = String(url.searchParams.get("return") || "").trim();

  if (fromLocation && toLocation && departDate) {
    throw redirect(
      301,
      buildCanonicalFlightSearchHref({
        fromLocation,
        toLocation,
        itineraryType,
        departDate,
        returnDate,
        travelers: String(url.searchParams.get("travelers") || "").trim(),
        cabin: String(url.searchParams.get("cabin") || "").trim(),
      }),
    );
  }

  const nextParams = new URLSearchParams(url.searchParams);
  nextParams.set("itineraryType", itineraryType);
  if (departDate) {
    nextParams.set("depart", departDate);
  }
  if (itineraryType === "round-trip" && returnDate) {
    nextParams.set("return", returnDate);
  }
  if (fromLocation?.displayName) {
    nextParams.set("from", fromLocation.displayName);
    nextParams.set("fromLocationId", fromLocation.locationId);
  }
  if (toLocation?.displayName) {
    nextParams.set("to", toLocation.displayName);
    nextParams.set("toLocationId", toLocation.locationId);
  }

  const query = nextParams.toString();
  throw redirect(302, query ? `/flights?${query}` : "/flights");
};
