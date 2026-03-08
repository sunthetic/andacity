import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { FlightsResultsAdapter } from "~/components/flights/FlightsResultsAdapter";
import { Page } from "~/components/site/Page";
import {
  buildFlightsSearchPath,
  humanizeLocationSlug,
  normalizeFlightItineraryType,
  slugifyLocation,
} from "~/lib/search/flights/routing";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { findTopTravelCity } from "~/seed/cities/top-100.js";
import { generateFlightsForRoute } from "~/seed/generators/generate-flights.js";
import type { FlightResult } from "~/types/flights/search";

export const useSearchFlightsPage = routeLoader$(({ params, url }) => {
  const fromLocationSlug =
    slugifyLocation(String(params.fromLocationSlug || "").trim()) || "anywhere";
  const toLocationSlug =
    slugifyLocation(String(params.toLocationSlug || "").trim()) || "anywhere";
  const itineraryType = normalizeFlightItineraryType(
    String(params.itineraryTypeSlug || "")
      .trim()
      .toLowerCase(),
  );
  const page = clampInt(params.pageNumber, 1, 9999);

  const fromCity = findTopTravelCity(fromLocationSlug);
  const toCity = findTopTravelCity(toLocationSlug);

  const from =
    fromCity?.name || humanizeLocationSlug(fromLocationSlug) || "Anywhere";
  const to = toCity?.name || humanizeLocationSlug(toLocationSlug) || "Anywhere";

  const searchState = searchStateFromUrl(url, {
    query: `${from} to ${to}`,
    location: { city: to },
    sort: "recommended",
    page,
  });

  searchState.query = `${from} to ${to}`;
  searchState.location = {
    ...(searchState.location || {}),
    city: to,
  };

  if (itineraryType === "one-way" && searchState.dates?.checkOut) {
    searchState.dates = {
      ...(searchState.dates || {}),
      checkOut: undefined,
    };
  }

  const results = generateFlightsForRoute({
    fromSlug: fromLocationSlug,
    toSlug: toLocationSlug,
    itineraryType,
    departDate: searchState.dates?.checkIn,
    returnDate:
      itineraryType === "round-trip" ? searchState.dates?.checkOut : undefined,
  }) as FlightResult[];

  const searchAgainHref = buildSearchFlightsHref({
    from,
    to,
    itineraryType,
    depart: searchState.dates?.checkIn,
    ret:
      itineraryType === "round-trip" ? searchState.dates?.checkOut : undefined,
    travelers: String(searchState.filters?.travelers || "").trim(),
    cabin: String(searchState.filters?.cabin || "").trim(),
  });

  return {
    fromLocationSlug,
    toLocationSlug,
    itineraryType,
    page,
    from,
    to,
    results,
    searchState,
    searchAgainHref,
  };
});

export default component$(() => {
  const data = useSearchFlightsPage().value;
  const location = useLocation();
  const basePath = buildFlightsSearchPath(
    data.fromLocationSlug,
    data.toLocationSlug,
    data.itineraryType,
    1,
  );

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Flights", href: "/flights" },
        { label: "Search", href: "/search/flights" },
        { label: `${data.from} to ${data.to}`, href: location.url.pathname },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Flight search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Compare schedules, fares, and cabin options with shared filters and
          sorting.
        </p>
      </div>

      <section class="mt-8">
        <FlightsResultsAdapter
          results={data.results}
          searchState={data.searchState}
          fromLabel={data.from}
          toLabel={data.to}
          itineraryType={data.itineraryType}
          basePath={basePath}
          editSearchHref={data.searchAgainHref}
          flightCtaHref={data.searchAgainHref}
          emptyPrimaryAction={{
            label: "Search flights again",
            href: data.searchAgainHref,
          }}
          emptySecondaryAction={{
            label: "Explore destinations",
            href: "/explore",
          }}
        />
      </section>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useSearchFlightsPage);
  const title = `Flights from ${data.from} to ${data.to} – Page ${data.page} | Andacity Travel`;
  const description = `Browse flight results from ${data.from} to ${data.to} with shared filtering and sorting.`;
  const canonicalPath = buildFlightsSearchPath(
    data.fromLocationSlug,
    data.toLocationSlug,
    data.itineraryType,
    data.page,
  );
  const canonicalHref = new URL(canonicalPath, url.origin).href;

  return {
    title,
    meta: [
      { name: "description", content: description },
      { name: "robots", content: "noindex,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};

const clampInt = (value: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const buildSearchFlightsHref = (input: {
  from: string;
  to: string;
  itineraryType: "round-trip" | "one-way";
  depart?: string;
  ret?: string;
  travelers?: string;
  cabin?: string;
}) => {
  const sp = new URLSearchParams();
  sp.set("itineraryType", input.itineraryType);
  sp.set("from", input.from);
  sp.set("to", input.to);

  if (input.depart) sp.set("depart", input.depart);
  if (input.itineraryType === "round-trip" && input.ret)
    sp.set("return", input.ret);
  if (input.travelers) sp.set("travelers", input.travelers);
  if (input.cabin) sp.set("cabin", input.cabin);

  return `/flights?${sp.toString()}`;
};
