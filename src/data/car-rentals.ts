import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";
import { generateCarRentalsInventory } from "~/seed/generators/generate-cars.js";

export const CAR_RENTALS: CarRental[] = (
  generateCarRentalsInventory() as CarRental[]
).map((rental) => ({
  ...rental,
  slug: String(rental.slug || "")
    .trim()
    .toLowerCase(),
}));

export const CAR_RENTALS_BY_SLUG = Object.fromEntries(
  CAR_RENTALS.map((c) => [c.slug, c]),
) as Record<string, CarRental>;

export const getCarRentalBySlug = (slug: string) => {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  return CAR_RENTALS_BY_SLUG[key] || null;
};

/* -----------------------------
   Types
----------------------------- */

export type CarRentalPolicy = {
  freeCancellation: boolean;
  payAtCounter: boolean;
  securityDepositRequired: boolean;
  minDriverAge: number;
  fuelPolicy: string;
  cancellationBlurb: string;
  paymentBlurb: string;
  feesBlurb: string;
  depositBlurb: string;
};

export type CarOffer = {
  id: string;
  name: string;
  category: string;
  seats: number;
  bags: string;
  transmission: "Automatic" | "Manual";
  doors: 2 | 3 | 4 | 5;
  ac: boolean;
  priceFrom: number;
  freeCancellation: boolean;
  payAtCounter: boolean;
  badges: string[];
  features: string[];
};

export type FAQ = {
  q: string;
  a: string;
};

export type CarRentalAvailability = {
  pickupStart: string;
  pickupEnd: string;
  minDays: number;
  maxDays: number;
  blockedWeekdays: number[];
  pairingKey: string;
};

export type CarRental = {
  inventoryId?: number;
  locationId?: number;
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  cityQuery: string;
  pickupArea: string;
  pickupAddressLine: string;
  currency: string;
  rating: number;
  reviewCount: number;
  fromDaily: number;
  summary: string;
  images: string[];
  inclusions: string[];
  policies: CarRentalPolicy;
  offers: CarOffer[];
  faq: FAQ[];
  availability?: CarRentalAvailability;
  availabilityConfidence?: AvailabilityConfidenceModel;
  freshness?: InventoryFreshnessModel;
  seedMeta?: {
    id: string;
    score: number;
  };
};
