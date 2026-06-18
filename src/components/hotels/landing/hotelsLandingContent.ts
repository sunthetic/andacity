/**
 * CLAUDE-UI-008 — Hotels landing page implementation: static curated content.
 *
 * Promoted from the CLAUDE-UI-007 sample (src/components/dev/hotels/hotelsSampleData.ts).
 * This file holds only safe, non-claim-bearing marketing copy and real route
 * targets — no fictional prices, ratings, or availability. Live numbers (top
 * stays, full city list) are loaded from the DB in src/routes/hotels/index.tsx
 * and passed into HotelsLandingPage as props.
 */

export type FeaturedCity = {
  name: string;
  meta: string;
  tag?: string;
  href: string;
};

/**
 * Curated destination spotlight — editorial blurbs only (no price/availability
 * claims), linking to real indexable city hub routes.
 */
export const HOTELS_FEATURED_CITIES: FeaturedCity[] = [
  {
    name: "Miami",
    meta: "Beachfront resorts · Art Deco",
    tag: "Trending",
    href: "/hotels/in/miami",
  },
  {
    name: "New York",
    meta: "Iconic stays · walkable",
    tag: "Editor’s pick",
    href: "/hotels/in/new-york",
  },
  {
    name: "Las Vegas",
    meta: "Strip suites · pools",
    href: "/hotels/in/las-vegas",
  },
  {
    name: "Orlando",
    meta: "Family resorts · near parks",
    href: "/hotels/in/orlando",
  },
];

/** City slugs the real-stay results/filter preview draws one top-rated stay from each. */
export const HOTELS_FEATURED_STAY_CITY_SLUGS: string[] =
  HOTELS_FEATURED_CITIES.map((c) => c.href.split("/").pop() as string);

/** Quick-fill chips under the hero search module — all real city routes. */
export const HOTELS_SEARCH_SUGGESTIONS: { label: string; href: string }[] =
  HOTELS_FEATURED_CITIES.map((c) => ({ label: c.name, href: c.href }));

/**
 * Quick-filter preview chips — display-only (this is a landing page, not a
 * live result set, so these are not wired to real filtering). Rendered as
 * inert badges with a caption, not buttons, so they never imply a false
 * affordance.
 */
export const HOTELS_QUICK_FILTER_PREVIEW: string[] = [
  "Free cancellation",
  "4+ stars",
  "Breakfast included",
  "Pool",
];

/** Filter sidebar preview groups — display-only (FilterRail is a preview primitive). */
export const HOTELS_FILTER_PREVIEW_GROUPS = [
  {
    title: "Popular filters",
    options: [
      { label: "Free cancellation" },
      { label: "Breakfast included" },
      { label: "No prepayment" },
    ],
  },
  {
    title: "Guest rating",
    options: [
      { label: "Wonderful 9+" },
      { label: "Very good 8+" },
      { label: "Good 7+" },
    ],
  },
  {
    title: "Property type",
    options: [
      { label: "Hotels" },
      { label: "Boutique" },
      { label: "Apartments" },
    ],
  },
];

export type TrustPolicy = { title: string; body: string; icon: string };

/**
 * Policy/trust clarity — mirrors the language the product actually surfaces
 * (see defaultPolicies in hotels-pages.server.ts). Verifiable only; no
 * guarantees, star inflation, or invented review counts.
 */
export const HOTELS_TRUST: TrustPolicy[] = [
  {
    title: "Total price, up front",
    body: "Taxes and property fees are included in the price you compare — no checkout surprises.",
    icon: "◎",
  },
  {
    title: "Free cancellation, clearly marked",
    body: "When a rate is refundable, the deadline is shown on the card before you book.",
    icon: "✓",
  },
  {
    title: "Policies before payment",
    body: "Cancellation, payment timing, and fees are stated up front, not buried after.",
    icon: "❏",
  },
];

export const HOTELS_HERO_TRUST: string[] = [
  "Total price up front",
  "Free cancellation marked",
  "Policies before payment",
];
