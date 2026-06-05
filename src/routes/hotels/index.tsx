import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import type { RequestHandler } from "@builder.io/qwik-city";
import { VerticalHeroSearchLayout } from "~/components/search/VerticalHeroSearchLayout";
import { HotelSearchCard } from "~/components/hotels/search/HotelSearchCard";

export { useHotelIndexData } from "~/routes/hotels/hotel.data";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({ maxAge: 60 * 10, staleWhileRevalidate: 60 * 60 });
};

export default component$(() => {
  return (
    <VerticalHeroSearchLayout
      eyebrow="Hotels"
      title="Find stays that fit the trip"
      description="Search hotels by destination, dates, and guests — or browse destination guides built for planning."
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
      {/* Intro strip — editorial dark, stamp accent tags */}
      <div
        class="mb-10 overflow-hidden rounded-2xl"
        style="border: 1px solid rgba(196,97,74,0.16)"
      >
        <div class="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
          style="divide-color: rgba(196,97,74,0.10); background: rgba(255,255,255,0.04)"
        >
          {[
            { tag: "Property types", note: "Hotels, motels, resorts, suites", accent: "#C4614A" },
            { tag: "Instant confirmation", note: "Know your booking is secured immediately", accent: "#5D8A6E" },
            { tag: "Free cancel", note: "Many properties offer no-fee cancellation", accent: "#D4973A" },
          ].map((item) => (
            <div key={item.tag} class="px-6 py-5">
              <span
                class="mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={`border: 1.5px solid ${item.accent}38; color: ${item.accent}; background: ${item.accent}10; letter-spacing: 0.08em`}
              >
                {item.tag}
              </span>
              <p class="text-xs" style="color: rgba(239,230,214,0.55); line-height: 1.65">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City list — editorial row style from TERRA on dark */}
      <section>
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold" style="color: #FBF4EA; letter-spacing: -0.02em">
            Browse by city
          </h2>
          <a href="/hotels/in" class="text-sm font-semibold" style="color: #C4614A">All cities →</a>
        </div>

        <div class="overflow-hidden rounded-2xl" style="border: 1px solid rgba(196,97,74,0.16)">
          {[
            { city: "Miami", state: "FL", tag: "Beach", accent: "#C4614A" },
            { city: "New York", state: "NY", tag: "City", accent: "#5D8A6E" },
            { city: "Las Vegas", state: "NV", tag: "Resort", accent: "#D4973A" },
            { city: "Orlando", state: "FL", tag: "Families", accent: "#C4614A" },
            { city: "Los Angeles", state: "CA", tag: "Coastal", accent: "#5D8A6E" },
            { city: "Chicago", state: "IL", tag: "Downtown", accent: "#D4973A" },
            { city: "San Diego", state: "CA", tag: "Beachside", accent: "#C4614A" },
            { city: "Nashville", state: "TN", tag: "Culture", accent: "#5D8A6E" },
          ].map((row, i, arr) => (
            <a
              key={row.city}
              href={`/hotels/in/${row.city.toLowerCase().replace(/ /g, "-")}`}
              class="group flex items-center justify-between px-5 py-4 transition hover:bg-white/05"
              style={i < arr.length - 1 ? "border-bottom: 1px solid rgba(196,97,74,0.08)" : ""}
            >
              <div class="flex items-center gap-3">
                <span class="text-base font-semibold" style="color: #FBF4EA">{row.city}</span>
                <span class="text-xs" style="color: rgba(239,230,214,0.40)">{row.state}</span>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="hidden rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest sm:inline-block"
                  style={`border: 1px solid ${row.accent}32; color: ${row.accent}; background: ${row.accent}0C; letter-spacing: 0.08em`}
                >
                  {row.tag}
                </span>
                <span class="text-sm font-semibold transition group-hover:translate-x-0.5" style="color: #C4614A">→</span>
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
