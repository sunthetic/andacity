import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { HotelsLandingPage } from "~/components/hotels/landing/HotelsLandingPage";
import { HOTELS_FEATURED_STAY_CITY_SLUGS } from "~/components/hotels/landing/hotelsLandingContent";
import {
  loadHotelCitiesFromDb,
  loadTopDestinationStaysFromDb,
} from "~/lib/queries/hotels-pages.server";
import { buildCanonicalHotelSearchHref } from "~/lib/search/entry-routes";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import {
  parseLocationSelection,
  validateLocationSelection,
} from "~/lib/location/validateLocationSelection";

export const useHotelsIndexPage = routeLoader$(async () => {
  const items = await loadHotelCitiesFromDb();
  return { items };
});

/** One real top-rated stay per featured city — omitted entirely if a city has none. */
export const useHotelsFeaturedStays = routeLoader$(async () => {
  const perCity = await Promise.all(
    HOTELS_FEATURED_STAY_CITY_SLUGS.map((slug) =>
      loadTopDestinationStaysFromDb(slug, 1),
    ),
  );
  return perCity.flat();
});

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const isSearchSubmit =
    String(url.searchParams.get("search") || "").trim() === "1";
  if (!isSearchSubmit) return;

  const destination = validateLocationSelection({
    selection: url.searchParams.get("destinationLocation"),
    rawValue: url.searchParams.get("destination"),
    required: true,
    fieldLabel: "destination",
    allowedKinds: ["city", "airport"],
  });

  if (!destination.location) return;

  const checkIn = String(url.searchParams.get("checkIn") || "").trim();
  const checkOut = String(url.searchParams.get("checkOut") || "").trim();
  const guests = String(url.searchParams.get("guests") || "").trim();

  throw redirect(
    302,
    buildCanonicalHotelSearchHref({
      destinationLocation: destination.location,
      checkIn,
      checkOut,
      guests,
    }),
  );
};

export const useHotelsSearchState = routeLoader$(async ({ url }) => {
  const selection = parseLocationSelection(
    url.searchParams.get("destinationLocation"),
  );
  const destinationLocation =
    selection ||
    (await resolveLocationFromUrlValues({
      locationId: url.searchParams.get("destinationLocationId"),
      text: url.searchParams.get("destination"),
    }));

  return {
    destinationLocation,
  };
});

export default component$(() => {
  const { items } = useHotelsIndexPage().value;
  const featuredStays = useHotelsFeaturedStays().value;
  const { destinationLocation } = useHotelsSearchState().value;
  const location = useLocation();
  const destination = String(
    location.url.searchParams.get("destination") || "",
  ).trim();
  const checkIn = String(location.url.searchParams.get("checkIn") || "").trim();
  const checkOut = String(
    location.url.searchParams.get("checkOut") || "",
  ).trim();
  const guests = String(location.url.searchParams.get("guests") || "").trim();

  return (
    <HotelsLandingPage
      cities={items}
      featuredStays={featuredStays}
      search={{
        initialDestination: destinationLocation?.displayName || destination,
        initialDestinationLocation: destinationLocation,
        initialCheckIn: checkIn,
        initialCheckOut: checkOut,
        initialGuests: guests,
      }}
    />
  );
});

export const head: DocumentHead = {
  title: "Hotels | Andacity",
  meta: [
    {
      name: "description",
      content:
        "Search hotels by destination, dates, and guests, or browse Andacity city pages for hotel discovery.",
    },
  ],
};
