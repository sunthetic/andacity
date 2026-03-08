import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CarRentalsResultsAdapter } from "~/components/car-rentals/CarRentalsResultsAdapter";
import { Page } from "~/components/site/Page";
import { CAR_RENTALS } from "~/data/car-rentals";
import { tryDbRead } from "~/lib/db/read-switch.server";
import { loadCarRentalResultsFromDb } from "~/lib/queries/car-rentals-search.server";
import { mapCarRentalsToResults } from "~/lib/search/car-rentals/mapCarRentalsToResults";
import {
  clampInt,
  normalizeQuery,
  safeTitleQuery,
} from "~/lib/search/car-rentals/normalize";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { findTopTravelCity } from "~/seed/cities/top-100.js";

export const useSearchCarRentalsPage = routeLoader$(async ({ params, url }) => {
  const query = normalizeQuery(params.query);
  const page = clampInt(params.pageNumber, 1, 9999);
  const matchedCity = findTopTravelCity(query);
  const qHuman =
    matchedCity?.name || safeTitleQuery(query).replaceAll("-", " ");
  const pickupDate =
    String(url.searchParams.get("pickupDate") || "").trim() || null;
  const dropoffDate =
    String(url.searchParams.get("dropoffDate") || "").trim() || null;
  const fallbackResults = () =>
    mapCarRentalsToResults(CAR_RENTALS, query, { pickupDate, dropoffDate });
  const results = matchedCity
    ? await tryDbRead(
        () => loadCarRentalResultsFromDb({ query, pickupDate, dropoffDate }),
        fallbackResults,
      )
    : fallbackResults();

  const searchState = searchStateFromUrl(url, {
    query: qHuman,
    location: { city: qHuman },
    sort: "recommended",
    page,
  });

  if (!String(searchState.query || "").trim()) {
    searchState.query = qHuman;
  }

  searchState.location = {
    ...(searchState.location || {}),
    city: qHuman,
  };

  return {
    query,
    qHuman,
    page,
    results,
    searchState,
  };
});

export default component$(() => {
  const data = useSearchCarRentalsPage().value;
  const basePath = `/search/car-rentals/${encodeURIComponent(data.query)}/1`;

  return (
    <Page
      breadcrumbs={[
        { label: "Andacity Travel", href: "/" },
        { label: "Car Rentals", href: "/car-rentals" },
        { label: "Search", href: "/search/car-rentals" },
        { label: data.qHuman, href: basePath },
      ]}
    >
      <div class="mt-4">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Car rental search results
        </h1>
        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          Compare policies, pickup options, and pricing with shared filtering
          and sorting.
        </p>
      </div>

      <section class="mt-8">
        <CarRentalsResultsAdapter
          results={data.results}
          searchState={data.searchState}
          queryLabel={data.qHuman}
          basePath={basePath}
          urlOptions={{
            includeQueryParam: true,
            includeLocationParams: false,
            dateParamKeys: { checkIn: "pickupDate", checkOut: "dropoffDate" },
          }}
          emptyPrimaryAction={{
            label: "Search car rentals again",
            href: "/car-rentals",
          }}
          emptySecondaryAction={{
            label: "Browse rental cities",
            href: "/car-rentals/in",
          }}
        />
      </section>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useSearchCarRentalsPage);

  const title = `Car rentals in ${data.qHuman} – Page ${data.page} | Andacity Travel`;
  const description = `Browse car rental results for ${data.qHuman}. Compare policies and totals with clarity.`;
  const canonicalPath = `/search/car-rentals/${encodeURIComponent(data.query)}/${data.page}`;
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
