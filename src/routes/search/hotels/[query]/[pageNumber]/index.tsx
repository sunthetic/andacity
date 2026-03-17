import type { RequestHandler } from "@builder.io/qwik-city";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import { buildCanonicalHotelSearchHref } from "~/lib/search/entry-routes";

export const onGet: RequestHandler = async ({ params, redirect, url }) => {
  const destinationLocation = await resolveLocationFromUrlValues({
    locationId: url.searchParams.get("destinationLocationId"),
    searchSlug: params.query,
    text: url.searchParams.get("destination"),
  });
  const checkIn = String(url.searchParams.get("checkIn") || "").trim();
  const checkOut = String(url.searchParams.get("checkOut") || "").trim();
  const guests = String(url.searchParams.get("guests") || "").trim();

  if (destinationLocation && checkIn && checkOut) {
    throw redirect(
      301,
      buildCanonicalHotelSearchHref({
        destinationLocation,
        checkIn,
        checkOut,
        guests,
      }),
    );
  }

  const nextParams = new URLSearchParams(url.searchParams);
  if (destinationLocation?.displayName) {
    nextParams.set("destination", destinationLocation.displayName);
    nextParams.set("destinationLocationId", destinationLocation.locationId);
  }
  if (checkIn) {
    nextParams.set("checkIn", checkIn);
  }
  if (checkOut) {
    nextParams.set("checkOut", checkOut);
  }
  if (guests) {
    nextParams.set("guests", guests);
  }

  const query = nextParams.toString();
  throw redirect(302, query ? `/hotels?${query}` : "/hotels");
};
