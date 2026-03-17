import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { VerticalHeroSearchLayout } from "~/components/search/VerticalHeroSearchLayout";
import { FlightsSearchCard } from "~/components/flights/search/FlightsSearchCard";
import { normalizeFlightItineraryType } from "~/lib/search/flights/routing";
import { buildCanonicalFlightSearchHref } from "~/lib/search/entry-routes";
import { resolveLocationFromUrlValues } from "~/lib/location/location-repo.server";
import {
  parseLocationSelection,
  validateLocationSelection,
} from "~/lib/location/validateLocationSelection";

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const isSearchSubmit =
    String(url.searchParams.get("search") || "").trim() === "1";
  if (!isSearchSubmit) return;

  const itineraryType = normalizeFlightItineraryType(
    String(url.searchParams.get("itineraryType") || "").trim(),
  );
  const from = validateLocationSelection({
    selection: url.searchParams.get("fromLocation"),
    rawValue: url.searchParams.get("from"),
    required: true,
    fieldLabel: "origin city or airport",
    allowedKinds: ["city", "airport"],
  });
  const to = validateLocationSelection({
    selection: url.searchParams.get("toLocation"),
    rawValue: url.searchParams.get("to"),
    required: true,
    fieldLabel: "destination city or airport",
    allowedKinds: ["city", "airport"],
  });

  if (!from.location || !to.location) return;

  const depart = String(url.searchParams.get("depart") || "").trim();
  const ret = String(url.searchParams.get("return") || "").trim();
  const travelers = String(url.searchParams.get("travelers") || "").trim();
  const cabin = String(url.searchParams.get("cabin") || "").trim();

  throw redirect(
    302,
    buildCanonicalFlightSearchHref({
      fromLocation: from.location,
      toLocation: to.location,
      itineraryType,
      departDate: depart,
      returnDate: ret,
      travelers,
      cabin,
    }),
  );
};

export const useFlightsIndexPage = routeLoader$(async ({ url }) => {
  const fromSelection = parseLocationSelection(
    url.searchParams.get("fromLocation"),
  );
  const toSelection = parseLocationSelection(
    url.searchParams.get("toLocation"),
  );
  const [fromLocation, toLocation] = await Promise.all([
    fromSelection ||
      resolveLocationFromUrlValues({
        locationId: url.searchParams.get("fromLocationId"),
        text: url.searchParams.get("from"),
      }),
    toSelection ||
      resolveLocationFromUrlValues({
        locationId: url.searchParams.get("toLocationId"),
        text: url.searchParams.get("to"),
      }),
  ]);

  return {
    fromLocation,
    toLocation,
  };
});

export default component$(() => {
  const data = useFlightsIndexPage().value;
  const location = useLocation();

  const itineraryType = normalizeFlightItineraryType(
    String(location.url.searchParams.get("itineraryType") || "").trim(),
  );
  const from = String(location.url.searchParams.get("from") || "").trim();
  const to = String(location.url.searchParams.get("to") || "").trim();
  const depart = String(location.url.searchParams.get("depart") || "").trim();
  const ret = String(location.url.searchParams.get("return") || "").trim();
  const travelers = String(
    location.url.searchParams.get("travelers") || "",
  ).trim();
  const cabin = String(location.url.searchParams.get("cabin") || "").trim();

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Flights" }]}
      eyebrow="Flights"
      title="Find smarter flights with flexible planning"
      description="Search routes, compare schedules, and plan around your dates and preferences with less friction."
      heroImageUrl="/images/hero/flights.svg"
      heroOverlay="base"
      searchCard={
        <FlightsSearchCard
          initialItineraryType={itineraryType}
          initialFrom={data.fromLocation?.displayName || from}
          initialFromLocation={data.fromLocation}
          initialTo={data.toLocation?.displayName || to}
          initialToLocation={data.toLocation}
          initialDepart={depart}
          initialReturn={ret}
          initialTravelers={travelers}
          initialCabin={cabin}
          autoResolveOriginLocation={true}
        />
      }
    >
      <section class="mx-auto max-w-4xl">
        <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Plan air travel with clarity
        </h2>

        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
          Compare routes, timing, and options faster so you can book with
          confidence.
        </p>
      </section>
    </VerticalHeroSearchLayout>
  );
});

export const head: DocumentHead = {
  title: "Flights | Andacity",
  meta: [
    {
      name: "description",
      content:
        "Search flights by route, dates, and traveler preferences with Andacity.",
    },
  ],
};
