import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { useLocation } from "@builder.io/qwik-city";
import { VerticalHeroSearchLayout } from "~/components/search/VerticalHeroSearchLayout";
import { CarRentalSearchCard } from "~/components/car-rentals/CarRentalSearchCard";
import { SearchEmptyState } from "~/components/search/SearchEmptyState";
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
  const { cityItems } = useCarRentalsIndexPage().value;
  const { pickupLocation } = useCarRentalsSearchState().value;
  const loc = useLocation();

  const q = String(loc.url.searchParams.get("q") || "").trim();
  const pickupDate = String(
    loc.url.searchParams.get("pickupDate") || "",
  ).trim();
  const dropoffDate = String(
    loc.url.searchParams.get("dropoffDate") || "",
  ).trim();
  const drivers = String(loc.url.searchParams.get("drivers") || "").trim();

  return (
    <VerticalHeroSearchLayout
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Car Rentals" }]}
      eyebrow="Car Rentals"
      title="Get the right car for where the trip takes you"
      description="Search pickup locations, dates, and vehicle types so your plans stay flexible on the ground."
      heroImageUrl="/images/hero/cars.svg"
      heroOverlay="base"
      searchCard={
        <CarRentalSearchCard
          variant="hero"
          destinationValue={pickupLocation?.displayName || q}
          initialPickupLocation={pickupLocation}
          pickupDate={pickupDate}
          dropoffDate={dropoffDate}
          drivers={drivers}
          submitLabel="Search car rentals"
        />
      }
      helperLinks={[
        { label: "Las Vegas", href: "/car-rentals/in/las-vegas" },
        { label: "Orlando", href: "/car-rentals/in/orlando" },
        { label: "New York", href: "/car-rentals/in/new-york" },
      ]}
    >
      <section class="mx-auto max-w-4xl">
        <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          Stay flexible on the ground
        </h2>

        <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
          Find vehicles by location and timing so your trip doesn't depend on
          rigid schedules.
        </p>
      </section>

      <section class="mt-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-balance text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              Browse car rental cities
            </h2>

            <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              City pages support rental discovery, itinerary planning, and
              stronger internal linking across the Car Rentals vertical.
            </p>
          </div>

          <a
            class="t-btn-primary px-5 text-center"
            href="/search/car-rentals/anywhere/1"
          >
            Search car rentals
          </a>
        </div>

        {cityItems.length ? (
          <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cityItems.map((city) => (
              <a
                key={city.slug}
                href={`/car-rentals/in/${city.slug}`}
                class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
              >
                <div class="text-base font-medium text-[color:var(--color-text-strong)]">
                  {city.name}
                </div>

                <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  Browse car rentals in {city.name}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div class="mt-6">
            <SearchEmptyState
              title="No rental cities are available right now"
              description="Try searching car rentals directly while city pages are refreshed."
              primaryAction={{
                label: "Search car rentals again",
                href: "/car-rentals",
              }}
              secondaryAction={{
                label: "Browse rental cities",
                href: "/car-rentals/in",
              }}
            />
          </div>
        )}
      </section>
    </VerticalHeroSearchLayout>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const { featuredRentals } = resolveValue(useCarRentalsIndexPage);
  const title = "Car Rentals | Andacity Travel";
  const description =
    "Browse indexable car rental guides with clear inclusions and policy summaries. Search pages stay noindex; detail pages earn rankings.";

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
