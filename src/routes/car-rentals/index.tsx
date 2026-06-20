/**
 * CLAUDE-UI-018 — production car rentals landing page.
 *
 * Rewrites the presentation layer to use the `--ui-*` system via
 * CarRentalsLanding while preserving ALL existing behavior:
 *  - onGet canonical search redirect (search=1 + resolvable pickup location)
 *  - useCarRentalsIndexPage loader (city items + featured rentals for JSON-LD)
 *  - useCarRentalsSearchState loader (pickup location prefill from URL)
 *  - head metadata (title, description, canonical, JSON-LD)
 *
 * CarRentalSearchCard inner styling stays as-is (shared with home/city pages);
 * CarRentalsLanding supplies the --ui-* frame around it.
 */
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { CarRentalsLanding } from "~/components/car-rentals/landing/CarRentalsLanding";
import { CarRentalSearchCard } from "~/components/car-rentals/CarRentalSearchCard";
import {
  loadCarRentalCitiesFromDb,
  loadFeaturedCarRentalsFromDb,
} from "~/lib/queries/car-rentals-pages.server";
import { buildCanonicalCarSearchHref } from "~/lib/search/entry-routes";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import {
  parseLocationSelection,
  validateLocationSelection,
} from "~/lib/location/validateLocationSelection";

export const useCarRentalsIndexPage = routeLoader$(async () => {
  const [cityItems, featuredRentals] = await Promise.all([
    loadCarRentalCitiesFromDb(),
    loadFeaturedCarRentalsFromDb(24),
  ]);

  return {
    cityItems,
    featuredRentals,
  };
});

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const isSearchSubmit =
    String(url.searchParams.get("search") || "").trim() === "1";
  if (!isSearchSubmit) return;

  const pickupLocation = validateLocationSelection({
    selection: url.searchParams.get("pickupLocation"),
    rawValue: url.searchParams.get("q"),
    required: true,
    fieldLabel: "pickup location",
    allowedKinds: ["city", "airport"],
  });

  if (!pickupLocation.location) return;

  const pickupDate = String(url.searchParams.get("pickupDate") || "").trim();
  const dropoffDate = String(url.searchParams.get("dropoffDate") || "").trim();
  const drivers = String(url.searchParams.get("drivers") || "").trim();

  throw redirect(
    302,
    buildCanonicalCarSearchHref({
      pickupLocation: pickupLocation.location,
      pickupDate,
      dropoffDate,
      drivers,
    }),
  );
};

export const useCarRentalsSearchState = routeLoader$(async ({ url }) => {
  const selection = parseLocationSelection(
    url.searchParams.get("pickupLocation"),
  );
  const pickupLocation =
    selection ||
    (await resolveLocationFromUrlValues({
      locationId: url.searchParams.get("pickupLocationId"),
      text: url.searchParams.get("q"),
    }));

  return {
    pickupLocation,
  };
});

export default component$(() => {
  const { pickupLocation } = useCarRentalsSearchState().value;
  const loc = useLocation();

  const q = String(loc.url.searchParams.get("q") || "").trim();
  const pickupDate = String(loc.url.searchParams.get("pickupDate") || "").trim();
  const dropoffDate = String(loc.url.searchParams.get("dropoffDate") || "").trim();
  const drivers = String(loc.url.searchParams.get("drivers") || "").trim();

  return (
    <CarRentalsLanding
      searchCard={
        <CarRentalSearchCard
          variant="hero"
          surface="plain"
          destinationValue={pickupLocation?.displayName || q}
          initialPickupLocation={pickupLocation}
          pickupDate={pickupDate}
          dropoffDate={dropoffDate}
          drivers={drivers}
          submitLabel="Search car rentals"
        />
      }
    />
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const { featuredRentals } = resolveValue(useCarRentalsIndexPage);
  const title = "Car Rentals | Andacity Travel";
  const description =
    "Search car rentals by pickup location and dates. Compare vehicles by class, seats, and luggage space — taxes and fees included in every total.";

  const canonicalHref = new URL("/car-rentals", url.origin).href;

  const listCap = 24;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Car Rentals",
            item: canonicalHref,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Andacity car rentals",
        itemListElement: featuredRentals.slice(0, listCap).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: new URL(buildCarRentalDetailHref(c.slug), url.origin).href,
          numberOfItems: featuredRentals.length,
        })),
      },
    ],
  });

  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
    scripts: [
      {
        key: "ld-car-rentals",
        props: { type: "application/ld+json" },
        script: jsonLd,
      },
    ],
  };
};

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`;
};
