import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { CarRentalsResultsAdapter } from "~/components/car-rentals/CarRentalsResultsAdapter";
import { Page } from "~/components/site/Page";
import {
  EMPTY_CAR_RENTALS_FACETS,
  loadCarRentalResultsPageFromDb,
  normalizeCarRentalsSort,
  parseCarRentalsSelectedFilters,
  toCarRentalsSearchStateFilters,
} from "~/lib/queries/car-rentals-search.server";
import {
  clampInt,
  normalizeQuery,
  safeTitleQuery,
} from "~/lib/search/car-rentals/normalize";
import { searchStateFromUrl } from "~/lib/search/url-to-state";
import { findTopTravelCity } from "~/seed/cities/top-100.js";

export const useSearchCarRentalsPage = routeLoader$(async ({ params, url }) => {
  const query = normalizeQuery(params.query);
  const routePage = clampInt(params.pageNumber, 1, 9999);
  const matchedCity = findTopTravelCity(query);
  const qHuman =
    matchedCity?.name || safeTitleQuery(query).replaceAll("-", " ");
  const pickupDate =
    String(url.searchParams.get("pickupDate") || "").trim() || null;
  const dropoffDate =
    String(url.searchParams.get("dropoffDate") || "").trim() || null;
  const searchState = searchStateFromUrl(url, {
    query: qHuman,
    location: { city: qHuman },
    sort: "recommended",
    page: routePage,
  });

  if (!String(searchState.query || "").trim()) {
    searchState.query = qHuman;
  }

  searchState.location = {
    ...(searchState.location || {}),
    city: qHuman,
  };

  const source = matchedCity
    ? await loadCarRentalResultsPageFromDb({
        citySlug: matchedCity.slug,
        query,
        pickupDate,
        dropoffDate,
        sort: String(searchState.sort || "recommended"),
        page: searchState.page || routePage,
        pageSize: 6,
        filters: (searchState.filters || {}) as Record<string, unknown>,
      })
    : {
        totalCount: 0,
        page: 1,
        pageSize: 6,
        totalPages: 1,
        activeSort: normalizeCarRentalsSort(searchState.sort),
        selectedFilters: parseCarRentalsSelectedFilters(
          (searchState.filters || {}) as Record<string, unknown>,
        ),
        results: [],
        facets: EMPTY_CAR_RENTALS_FACETS,
      };

  searchState.page = source.page;
  searchState.sort = source.activeSort;
  searchState.filters = toCarRentalsSearchStateFilters(
    source.selectedFilters,
    (searchState.filters || {}) as Record<string, unknown>,
  );

  return {
    query,
    qHuman,
    page: source.page,
    totalCount: source.totalCount,
    totalPages: source.totalPages,
    activeSort: source.activeSort,
    selectedFilters: source.selectedFilters,
    facets: source.facets,
    results: source.results,
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
          totalCount={data.totalCount}
          page={data.page}
          totalPages={data.totalPages}
          activeSort={data.activeSort}
          selectedFilters={data.selectedFilters}
          filterFacets={data.facets}
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
