import { generateHotelsInventory } from "~/seed/generators/generate-hotels.js";

export const HOTELS: Hotel[] = (generateHotelsInventory() as Hotel[]).map(
  (hotel) => ({
    ...hotel,
    slug: String(hotel.slug || "")
      .trim()
      .toLowerCase(),
  }),
);

export const HOTELS_BY_SLUG = Object.fromEntries(
  HOTELS.map((h) => [h.slug, h]),
) as Record<string, Hotel>;

export const getHotelBySlug = (slug: string) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  return HOTELS_BY_SLUG[key] || null;
};

/* -----------------------------
   Types
----------------------------- */

export type HotelPolicy = {
  freeCancellation: boolean;
  payLater: boolean;
  noResortFees: boolean;
  checkInTime: string;
  checkOutTime: string;
  cancellationBlurb: string;
  paymentBlurb: string;
  feesBlurb: string;
};

export type Room = {
  id: string;
  name: string;
  sleeps: number;
  beds: string;
  sizeSqft: number;
  priceFrom: number;
  refundable: boolean;
  payLater: boolean;
  badges: string[];
  features: string[];
};

export type FAQ = {
  q: string;
  a: string;
};

export type HotelAvailability = {
  checkInStart: string;
  checkInEnd: string;
  minNights: number;
  maxNights: number;
  blockedWeekdays: number[];
  pairingKey: string;
};

export type Hotel = {
  inventoryId?: number;
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  cityQuery: string;
  neighborhood: string;
  propertyType?: string;
  addressLine: string;
  currency: string;
  stars: 2 | 3 | 4 | 5;
  rating: number;
  reviewCount: number;
  fromNightly: number;
  summary: string;
  images: string[];
  amenities: string[];
  policies: HotelPolicy;
  rooms: Room[];
  faq: FAQ[];
  availability?: HotelAvailability;
  seedMeta?: {
    id: string;
  };
};
