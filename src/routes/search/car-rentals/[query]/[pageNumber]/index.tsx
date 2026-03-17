import type { RequestHandler } from "@builder.io/qwik-city";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import { buildCanonicalCarSearchHref } from "~/lib/search/entry-routes";

export const onGet: RequestHandler = async ({ params, redirect, url }) => {
  const pickupLocation = await resolveLocationFromUrlValues({
    locationId: url.searchParams.get("pickupLocationId"),
    searchSlug: params.query,
    text: url.searchParams.get("q"),
  });
  const pickupDate = String(url.searchParams.get("pickupDate") || "").trim();
  const dropoffDate = String(url.searchParams.get("dropoffDate") || "").trim();
  const drivers = String(url.searchParams.get("drivers") || "").trim();

  if (pickupLocation && pickupDate && dropoffDate) {
    throw redirect(
      301,
      buildCanonicalCarSearchHref({
        pickupLocation,
        pickupDate,
        dropoffDate,
        drivers,
      }),
    );
  }

  const nextParams = new URLSearchParams(url.searchParams);
  if (pickupLocation?.displayName) {
    nextParams.set("q", pickupLocation.displayName);
    nextParams.set("pickupLocationId", pickupLocation.locationId);
  }
  if (pickupDate) {
    nextParams.set("pickupDate", pickupDate);
  }
  if (dropoffDate) {
    nextParams.set("dropoffDate", dropoffDate);
  }
  if (drivers) {
    nextParams.set("drivers", drivers);
  }

  const query = nextParams.toString();
  throw redirect(302, query ? `/car-rentals?${query}` : "/car-rentals");
};
