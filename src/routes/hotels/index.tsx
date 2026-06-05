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
      description="Search by destination, dates, and guests — or browse city hubs built for discovery and planning."
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
      {/* Browse hotel cities */}
      <section>
        <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-[color:var(--color-highlight)] opacity-80">
              City hubs
            </p>
            <h2 class="mt-1.5 text-2xl font-bold tracking-tight text-[color:var(--color-text-strong)]">
              Browse hotel cities
            </h2>
            <p class="mt-2 max-w-[60ch] text-sm text-[color:var(--color-text-muted)]">
              Indexable city pages with live search, availability, and neighborhood context.
            </p>
          </div>
          <a class="t-btn-primary px-5 py-2.5 text-sm" href="/search/hotels/anywhere/1">
            Search all hotels
          </a>
        </div>

        {items.length ? (
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((city) => (
              <a
                key={city.slug}
                href={`/hotels/in/${city.slug}`}
                class="group relative overflow-hidden rounded-2xl p-5 transition"
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(90,120,190,0.16); box-shadow: 0 4px 16px rgba(0,0,0,0.25)"
              >
                <div
                  class="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style="background: radial-gradient(30rem 15rem at 0% 50%, rgba(196,126,255,0.06), transparent 60%)"
                />
                <div class="relative">
                  <div
                    class="mb-3 h-0.5 w-6 rounded-full transition-all duration-300 group-hover:w-10"
                    style="background: linear-gradient(90deg, #C47EFF, #9E7EFF)"
                  />
                  <div class="text-base font-bold text-[color:var(--color-text-strong)] group-hover:text-white">
                    {city.city}
                  </div>
                  <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    Browse hotels in {city.city}
                  </div>
                  <div class="mt-4 text-xs font-semibold text-[#C47EFF] opacity-0 transition-opacity group-hover:opacity-100">
                    View hotels →
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-4">
            <SearchEmptyState
              title="No hotel cities available right now"
              description="Try searching hotels directly while city pages refresh."
              primaryAction={{ label: "Search hotels", href: "/hotels" }}
              secondaryAction={{ label: "Browse city guides", href: "/hotels/in" }}
            />
          </div>
        )}
      </section>
    </VerticalHeroSearchLayout>
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
