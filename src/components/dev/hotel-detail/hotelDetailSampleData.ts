/**
 * CLAUDE-UI-009 — Hotel detail page sample: shared sample data.
 *
 * DEV / DESIGN-SAMPLE ONLY. Drives the preview at /dev/ui-hotel-detail.
 * EVERYTHING in this file is ILLUSTRATIVE — a fictional property, fictional
 * rooms/rates, sample prices, and sample rating/review counts. There is no DB
 * dependency (unlike the production /hotels/[slug] route, which loads a real
 * Hotel via loadHotelBySlugFromDb). The field shapes intentionally mirror the
 * production `Hotel`/`Room` types in src/data/hotels.ts so CLAUDE-UI-010 can
 * map real data onto the same layout. Hrefs point at routes that exist today.
 */
import type { HotelCardModel } from "~/components/ui/HotelCard";

/** One selectable rate within a room (e.g. Flexible vs. Saver). */
export type SampleRoomRate = {
  name: string;
  /** Plain-language cancellation term (mirrors policy copy, not a guarantee). */
  cancellation: string;
  payment: string;
  /** Illustrative nightly price in whole currency units. */
  nightly: number;
  recommended?: boolean;
};

export type SampleRoom = {
  id: string;
  name: string;
  sleeps: number;
  beds: string;
  sizeSqft: number;
  features: string[];
  rates: SampleRoomRate[];
};

export type AmenityGroup = { title: string; icon: string; items: string[] };

export type NearbyPlace = { name: string; distance: string };

export type SampleHotel = {
  name: string;
  neighborhood: string;
  city: string;
  region: string;
  address: string;
  stars: number;
  /** Illustrative rating + review count (fictional property). */
  rating: number;
  reviewLabel: string;
  reviewCount: number;
  summary: string;
  /** Illustrative "from" nightly price (whole USD). */
  fromNightly: number;
  currency: string;
  /** Total photos the gallery represents (placeholders rendered as gradients). */
  photoCount: number;
  /** Short captions describing the intended photography for each gallery tile. */
  galleryCaptions: string[];
  highlights: string[];
  amenityGroups: AmenityGroup[];
  rooms: SampleRoom[];
  policies: {
    cancellation: string;
    payment: string;
    fees: string;
    checkIn: string;
    checkOut: string;
  };
  nearby: NearbyPlace[];
  gettingAround: string;
};

export const SAMPLE_HOTEL: SampleHotel = {
  name: "The Reefline Hotel",
  neighborhood: "South Beach",
  city: "Miami",
  region: "Florida",
  address: "120 Ocean Drive, Miami Beach, FL",
  stars: 5,
  rating: 9.2,
  reviewLabel: "Superb",
  reviewCount: 1840,
  summary:
    "A calm, design-led retreat a block from the sand. Ocean-view rooms, a rooftop pool, and a quiet courtyard restaurant — the kind of stay that makes the trip feel longer than it was.",
  fromNightly: 228,
  currency: "USD",
  photoCount: 28,
  galleryCaptions: [
    "Hero — rooftop pool at golden hour",
    "Ocean-view king room",
    "Courtyard restaurant",
    "Lobby lounge",
    "Spa relaxation room",
    "Beach access path",
  ],
  highlights: [
    "Beachfront · 1 block to the sand",
    "Rooftop pool & bar",
    "Free Wi-Fi throughout",
  ],
  amenityGroups: [
    {
      title: "Most popular",
      icon: "★",
      items: [
        "Rooftop pool",
        "Free Wi-Fi",
        "Beachfront",
        "Spa",
        "Restaurant",
        "Fitness center",
      ],
    },
    {
      title: "Wellness",
      icon: "◇",
      items: ["Outdoor pool", "Spa & sauna", "Fitness center", "Yoga deck"],
    },
    {
      title: "Food & drink",
      icon: "◎",
      items: [
        "Courtyard restaurant",
        "Rooftop bar",
        "Breakfast available",
        "Room service",
      ],
    },
    {
      title: "Services",
      icon: "❖",
      items: [
        "24-hour front desk",
        "Concierge",
        "Airport shuttle",
        "Valet parking",
      ],
    },
  ],
  rooms: [
    {
      id: "ocean-view-king",
      name: "Ocean View King",
      sleeps: 2,
      beds: "1 king bed",
      sizeSqft: 410,
      features: ["Ocean view", "Private balcony", "Nespresso", "Rain shower"],
      rates: [
        {
          name: "Flexible",
          cancellation: "Free cancellation until 48h before check-in",
          payment: "Pay at the hotel",
          nightly: 268,
        },
        {
          name: "Saver",
          cancellation: "Non-refundable",
          payment: "Prepay now",
          nightly: 228,
          recommended: true,
        },
      ],
    },
    {
      id: "deluxe-double-queen",
      name: "Deluxe Double Queen",
      sleeps: 4,
      beds: "2 queen beds",
      sizeSqft: 470,
      features: ["City view", "Sofa seating", "Mini fridge", "Workspace"],
      rates: [
        {
          name: "Flexible",
          cancellation: "Free cancellation until 48h before check-in",
          payment: "Pay at the hotel",
          nightly: 312,
        },
      ],
    },
    {
      id: "reefline-suite",
      name: "Reefline Suite",
      sleeps: 2,
      beds: "1 king bed + sofa bed",
      sizeSqft: 640,
      features: [
        "Corner ocean view",
        "Separate living room",
        "Soaking tub",
        "Espresso bar",
      ],
      rates: [
        {
          name: "Flexible",
          cancellation: "Free cancellation until 48h before check-in",
          payment: "Pay at the hotel",
          nightly: 489,
        },
      ],
    },
  ],
  policies: {
    cancellation:
      "Select rates include free cancellation; the exact deadline is shown on each rate before you book.",
    payment:
      "Some rates support pay-at-hotel; others are prepaid. Final payment terms are confirmed before booking.",
    fees: "Local taxes and any property fees are included in the total price shown before checkout.",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
  },
  nearby: [
    { name: "Ocean Drive", distance: "2 min walk" },
    { name: "Miami Beach Boardwalk", distance: "5 min walk" },
    { name: "South Pointe Park", distance: "9 min walk" },
    { name: "Lincoln Road", distance: "12 min drive" },
    { name: "Miami Intl. Airport (MIA)", distance: "22 min drive" },
  ],
  gettingAround:
    "Walkable to the beach and Ocean Drive; rideshare and the South Beach trolley are a block away.",
};

/** Related stays — illustrative HotelCard models; link to the safe search hub. */
export const SAMPLE_RELATED_STAYS: HotelCardModel[] = [
  {
    name: "Castelo Boutique",
    area: "Mid-Beach, Miami",
    rating: 9.0,
    reviewCount: 980,
    stars: 4,
    priceTotal: "$196",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Free cancellation"],
    href: "/hotels/in/miami",
  },
  {
    name: "Palm Court",
    area: "South Beach, Miami",
    rating: 8.8,
    reviewCount: 2140,
    stars: 4,
    priceTotal: "$174",
    priceQualifier: "Per night · taxes incl.",
    badges: ["Pay later"],
    href: "/hotels/in/miami",
  },
  {
    name: "The Marlin House",
    area: "North Beach, Miami",
    rating: 9.1,
    reviewCount: 612,
    stars: 5,
    priceTotal: "$252",
    priceQualifier: "Per night · taxes incl.",
    badges: ["No resort fees"],
    href: "/hotels/in/miami",
  },
];
