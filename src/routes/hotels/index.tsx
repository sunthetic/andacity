import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";
import { VerticalHeroSearchLayout } from "~/components/search/VerticalHeroSearchLayout";
import { SearchEmptyState } from "~/components/search/SearchEmptyState";
import { loadHotelCitiesFromDb } from "~/lib/queries/hotels-pages.server";
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

export const onGet: RequestHandler = async ({ url, redirect }) => {
  const isSearchSubmit = String(url.searchParams.get("search") || "").trim() === "1";
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

  throw redirect(302, buildCanonicalHotelSearchHref({
    destinationLocation: destination.location,
    checkIn,
    checkOut,
    guests,
  }));
};

export const useHotelsSearchState = routeLoader$(async ({ url }) => {
  const selection = parseLocationSelection(url.searchParams.get("destinationLocation"));
  const destinationLocation =
    selection ||
    (await resolveLocationFromUrlValues({
      locationId: url.searchParams.get("destinationLocationId"),
      text: url.searchParams.get("destination"),
    }));
  return { destinationLocation };
});

export default component$(() => {
  const { items } = useHotelsIndexPage().value;
  const { destinationLocation } = useHotelsSearchState().value;
  const location = useLocation();
  const destination = String(location.url.searchParams.get("destination") || "").trim();
  const checkIn = String(location.url.searchParams.get("checkIn") || "").trim();
  const checkOut = String(location.url.searchParams.get("checkOut") || "").trim();
  const guests = String(location.url.searchParams.get("guests") || "").trim();

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Hotels" }]}
      eyebrow="Hotels"
      title="Find stays that fit the trip"
      description="Search hotels by destination, dates, and guests, or browse curated city hubs."
      heroImageUrl="/images/hero/hotels.svg"
      heroOverlay="hotels"
      searchCard={
        <HotelSearchCard
          initialDestination={destinationLocation?.displayName || destination}
          initialDestinationLocation={destinationLocation}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      }
      helperLinks={[
        { label: "Miami", href: "/hotels/in/miami" },
        { label: "New York", href: "/hotels/in/new-york" },
        { label: "Las Vegas", href: "/hotels/in/las-vegas" },
      ]}
    >
      {/* Intro */}
      <section class="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(27,45,66,0.08)] border border-[rgba(27,45,66,0.08)]">
        <h2 class="text-xl font-semibold text-[#0E1E2E]" style="letter-spacing: -0.02em">
          Plan stays with less friction
        </h2>
        <p class="mt-2 text-sm text-[#4A6272]" style="line-height: 1.6">
          Combine destination-first search with city-based discovery for a cleaner way to book.
        </p>
      </section>

      {/* City grid */}
      <section class="mt-8">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-2xl font-semibold text-[#0E1E2E]" style="letter-spacing: -0.02em">
            Browse hotel cities
          </h2>
          <a class="t-btn-primary px-5 py-2.5 text-sm" href="/search/hotels/anywhere/1">
            Search hotels
          </a>
        </div>

        {items.length ? (
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((city) => (
              <a
                key={city.slug}
                href={`/hotels/in/${city.slug}`}
                class="group flex items-center justify-between rounded-2xl border border-[rgba(27,45,66,0.08)] bg-white p-5 shadow-[0_2px_8px_rgba(27,45,66,0.06)] transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(27,45,66,0.12)]"
              >
                <div>
                  <div class="font-semibold text-[#0E1E2E]">{city.city}</div>
                  <div class="mt-0.5 text-sm text-[#4A6272]">Browse hotels</div>
                </div>
                <span class="text-[#F97B5C] transition group-hover:translate-x-1">→</span>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-6">
            <SearchEmptyState
              title="No hotel cities are available right now"
              description="Try searching hotels directly while city pages are refreshed."
              primaryAction={{ label: "Search hotels again", href: "/hotels" }}
              secondaryAction={{ label: "Browse hotel cities", href: "/hotels/in" }}
            />
          </div>
        )}
      </section>
    </VerticalHeroSearchLayout>
  );
});

export const head: DocumentHead = {
  title: "Hotels | Andacity",
  meta: [{ name: "description", content: "Search hotels by destination, dates, and guests, or browse Andacity city pages for hotel discovery." }],
};
