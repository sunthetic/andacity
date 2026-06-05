import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { VerticalHeroSearchLayout } from "~/components/search/VerticalHeroSearchLayout";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({ maxAge: 60 * 10, staleWhileRevalidate: 60 * 60 });
};

export default component$(() => {
  return (
    <VerticalHeroSearchLayout
      eyebrow="Hotels"
      title="Find your perfect stay"
      description="Compare prices across thousands of properties, from boutique guesthouses to iconic five-star resorts."
      heroImageUrl="/assets/hero/hotels.jpg"
      heroOverlay="hotels"
      searchCard={<HotelSearchCard compact={false} />}
      helperLinks={[
        { label: "Miami Beach", href: "/hotels/in/miami" },
        { label: "New York City", href: "/hotels/in/new-york" },
        { label: "Las Vegas", href: "/hotels/in/las-vegas" },
        { label: "Orlando", href: "/hotels/in/orlando" },
        { label: "Los Angeles", href: "/hotels/in/los-angeles" },
      ]}
    >
      {/* Intro row */}
      <div class="mb-10 overflow-hidden rounded-2xl" style="border: 1px solid rgba(200,160,255,0.14)">
        <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style="divide-color: rgba(200,160,255,0.10); background: rgba(255,255,255,0.05)">
          {[
            { icon: "✦", label: "All property types", note: "Hotels, motels, resorts, suites" },
            { icon: "◈", label: "Instant confirmation", note: "Know your booking is secured" },
            { icon: "⊕", label: "Flexible cancellation", note: "Many properties offer free cancel" },
          ].map((item) => (
            <div key={item.label} class="flex items-start gap-3 px-6 py-5">
              <span class="mt-0.5 text-base" style="color: #E8728A">{item.icon}</span>
              <span class="flex flex-col">
                <span class="text-sm font-semibold" style="color: #FFF8F0">{item.label}</span>
                <span class="text-xs" style="color: rgba(240,232,216,0.55)">{item.note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* City index */}
      <section>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold" style="color: #FFF8F0; letter-spacing: -0.02em">
            Browse by city
          </h2>
          <a
            href="/hotels/in"
            class="text-sm font-semibold transition"
            style="color: #E8728A"
          >
            All cities →
          </a>
        </div>

        <div class="overflow-hidden rounded-2xl" style="border: 1px solid rgba(200,160,255,0.14)">
          {[
            { city: "Miami", state: "FL", tag: "Beach resorts", tagColor: "#E8728A" },
            { city: "New York", state: "NY", tag: "City hotels", tagColor: "#9080FF" },
            { city: "Las Vegas", state: "NV", tag: "Resort stays", tagColor: "#F5C842" },
            { city: "Orlando", state: "FL", tag: "Theme park stays", tagColor: "#E8728A" },
            { city: "Los Angeles", state: "CA", tag: "Coastal", tagColor: "#9080FF" },
            { city: "Chicago", state: "IL", tag: "Downtown", tagColor: "#F5C842" },
            { city: "San Diego", state: "CA", tag: "Beachside", tagColor: "#E8728A" },
            { city: "Nashville", state: "TN", tag: "Music & culture", tagColor: "#9080FF" },
          ].map((row, i, arr) => (
            <a
              key={row.city}
              href={`/hotels/in/${row.city.toLowerCase().replace(/ /g, "-")}`}
              class="group flex items-center justify-between px-5 py-4 transition hover:bg-white/06"
              style={i < arr.length - 1 ? "border-bottom: 1px solid rgba(200,160,255,0.08)" : ""}
            >
              <div class="flex items-center gap-3">
                <span class="text-base font-semibold" style="color: #FFF8F0">{row.city}</span>
                <span class="text-xs" style="color: rgba(240,232,216,0.40)">{row.state}</span>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="hidden rounded-full px-3 py-0.5 text-xs font-medium sm:inline-block"
                  style={`border: 1px solid ${row.tagColor}28; color: ${row.tagColor}; background: ${row.tagColor}10`}
                >
                  {row.tag}
                </span>
                <span class="text-sm font-semibold transition group-hover:translate-x-0.5" style="color: #E8728A">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

    </VerticalHeroSearchLayout>
  );
});

export const head: DocumentHead = ({ url }) => {
  const title = "Hotel Search | Andacity";
  const description =
    "Search hotels and find the perfect stay for your trip. Browse thousands of properties with instant confirmation and flexible cancellation.";
  const canonicalHref = new URL("/hotels", url.origin).href;
  const ogImage = new URL("/og/hotels.png", url.origin).href;
  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};
