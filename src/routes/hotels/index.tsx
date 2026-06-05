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
  throw redirect(302, buildCanonicalHotelSearchHref({ destinationLocation: destination.location, checkIn, checkOut, guests }));
};

export const useHotelsSearchState = routeLoader$(async ({ url }) => {
  const selection = parseLocationSelection(url.searchParams.get("destinationLocation"));
  const destinationLocation = selection || (await resolveLocationFromUrlValues({
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
      description="Search by destination, dates, and guests, or browse by city."
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
      {/* Info strip */}
      <div class="mb-6 rounded-xl border border-[rgba(15,23,42,0.10)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h2 class="text-base font-semibold text-[#0F172A]">Plan stays with less friction</h2>
        <p class="mt-1 text-sm text-[#475569]">Combine destination-first search with city-based discovery.</p>
      </div>

      {/* City grid */}
      <div class="flex items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-[#475569]">Hotel cities</h2>
          <div class="w-16 border-t border-[rgba(15,23,42,0.08)]" />
        </div>
        <a class="t-btn-primary px-3 py-1.5 text-sm" href="/search/hotels/anywhere/1">Search hotels</a>
      </div>

      {items.length ? (
        <div class="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.10)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          {items.map((city, i) => (
            <a
              key={city.slug}
              href={`/hotels/in/${city.slug}`}
              class={`group flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] ${i < items.length - 1 ? "border-b border-[rgba(15,23,42,0.08)]" : ""}`}
            >
              <div>
                <span class="text-sm font-semibold text-[#0F172A]">{city.city}</span>
                <span class="ml-2 text-xs text-[#64748B]">Browse hotels</span>
              </div>
              <span class="text-sm text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#F59E0B]">→</span>
            </a>
          ))}
        </div>
      ) : (
        <SearchEmptyState
          title="No hotel cities are available right now"
          description="Try searching hotels directly while city pages are refreshed."
          primaryAction={{ label: "Search hotels again", href: "/hotels" }}
          secondaryAction={{ label: "Browse hotel cities", href: "/hotels/in" }}
        />
      )}
    </VerticalHeroSearchLayout>
  );
});

export const head: DocumentHead = {
  title: "Hotels | Andacity",
  meta: [{ name: "description", content: "Search hotels by destination, dates, and guests, or browse Andacity city pages for hotel discovery." }],
};
